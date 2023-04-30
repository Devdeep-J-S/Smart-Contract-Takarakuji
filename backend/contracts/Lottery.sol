// Note :
// Lottery contract

// ennter lottery anonymously
// pay 0.01 ether to enter
// pick a random winner (VRF Chainlink Oracle) verifiable random function
// automatic every interval  -> automatic make

// random pick -> chainlink oracle -> verifiable random function
// automation -> chainlink keepers -> smart contract

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Imports
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/interfaces/KeeperCompatibleInterface.sol";

// Errors -> gas efficient way to revert
error Lottery__NotEnoughETHTrasferred();
error Lottery__TrasferFailed();
error Lottery__NotOpenBro();
error Lottery__UpkeepNotNeeded(
    uint256 balance,
    uint256 lotteryState,
    uint256 playerCount
);

/**
 * @title Lottery Contract - Cryptography and Blockchain
 * @author Devdeep Shetraniwala (devdeep)
 * @notice This contract is creating untempered lottery system using decentralized smart contract
 * @dev This implements Chainlink VRF v2 and Chainlink Keepers
 */
// Why inhertied because random word funciton interanl virtual so here ovveride and use it
contract Lottery is VRFConsumerBaseV2, KeeperCompatibleInterface {
    // Enum declaration here
    enum LotteryState {
        OPEN,
        CLOSED
    } // enum -> list of values uint256 0 , 1

    // State variables
    uint256 private immutable i_ticketPrice;
    address payable[] private s_players;
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    bytes32 private immutable i_gasLane_keyHash;
    uint64 private immutable i_subscriptionId;
    uint32 private immutable i_callbackGasLimit;
    uint16 private constant REQUEST_CONFIRMATIONS = 5; // 5 blocks for confirmation
    uint16 private constant NUM_WORDS = 1; // 1 word

    // Lottery variables
    address private s_lotteryWinner;
    LotteryState private s_lotteryState;
    uint256 private s_lastLotteryTime;
    uint256 private immutable i_lotteryInterval;

    // Events
    event lottery_event(address indexed player);
    event RequestLotteryWinner(uint256 indexed requestId);
    event WinnerPicked(address indexed winner);

    // constructor
    constructor(
        address vrfCoordinatorV2, // contract address find address as hint remember
        uint256 ticketPrice,
        bytes32 gasLane,
        uint64 subscriptionId,
        uint32 callbackGasLimit,
        uint256 lotteryInterval
    ) VRFConsumerBaseV2(vrfCoordinatorV2) {
        i_ticketPrice = ticketPrice;
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_gasLane_keyHash = gasLane; // gas lane keyHash -> max gas price willing to pay for a requeist in wei : ID for off -chain VRF job
        i_subscriptionId = subscriptionId; // subscriptionId
        i_callbackGasLimit = callbackGasLimit; // gas limit for the callback
        s_lotteryState = LotteryState.OPEN; // lottery state staring with open
        s_lastLotteryTime = block.timestamp; // block.timestamp -> current time
        i_lotteryInterval = lotteryInterval; // time interval
    }

    // Functions
    function enter() public payable {
        // 1. check if the lottery is open
        if (s_lotteryState == LotteryState.CLOSED) {
            revert Lottery__NotOpenBro();
        }

        // 2. check if the player has sent enough eth
        if (msg.value < i_ticketPrice) {
            revert Lottery__NotEnoughETHTrasferred();
        }

        // 3. add the player to the players array
        s_players.push(payable(msg.sender));
        // event when we update the state
        // listner -> event -> update UI
        // EVM = Ethereum Virtual Machine
        // smart contract can't access get
        emit lottery_event(msg.sender);
    }

    /**
     * @dev This is the function that the Chainlink Keeper will call to check if upkeep is needed.
     * @dev they look for 'upkeepNeeded' to be true
     * if condition match then returns true:
     * 1. time is up interval has passed
     * 2. atleast 1 player with some money
     * 3. subscription is set and funded (chainlink oracle)
     * 4. lottery -> open state
     */
    function checkUpkeep(
        bytes memory /* checkData */
    )
        public
        view
        override
        returns (bool upkeepNeeded, bytes memory /* performData */)
    {
        bool isOpen = (s_lotteryState == LotteryState.OPEN);
        bool enoughPlayers = (getPlayerCount() > 0);
        bool enoughTime = ((block.timestamp - s_lastLotteryTime) >
            i_lotteryInterval);
        bool balance = (address(this).balance > 0); // our contract has balance or not
        upkeepNeeded = (isOpen && enoughPlayers && enoughTime && balance);
    }

    /**
     * @dev Called by the Chainlink Keeper to perform work that was scheduled for it.
       @dev
    chainlink oracle
    verifiable random function
    2 step process : get num , then decalre winner

    request random number is converted to performUpkeep !!!
    ```
    function ReqestRandomNum() external {
        // 1. get random number from chainlink oracle
        // Will revert if subscription is not set and funded.
        // Will revert if the subscription is not for the specified job.

        s_lotteryState = LotteryState.CLOSED; // kind of muation lock thing going on here while calcualting winner lottery will be in closed state
        uint256 reqeustId = i_vrfCoordinator.requestRandomWords(
            i_gasLane_keyHash, // gase lane keyHash -> max gas price willing to pay for a requeist in wei : ID for off -chain VRF job
            i_subscriptionId, // subscriptionId
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit, // gas limit for the callback
            NUM_WORDS // number of random words to return 1 word
        );

        emit RequestLotteryWinner(reqeustId);
    }
    ```
*/
    function performUpkeep(bytes calldata /* performData */) external override {
        // validate if the upkeep is needed
        (bool upkeepNeeded, ) = checkUpkeep("");
        if (!upkeepNeeded) {
            revert Lottery__UpkeepNotNeeded(
                address(this).balance,
                uint256(s_lotteryState),
                getPlayerCount()
            );
        }
        s_lotteryState = LotteryState.CLOSED; // kind of muation lock thing going on here while calcualting winner lottery will be in closed state
        uint256 reqeustId = i_vrfCoordinator.requestRandomWords(
            i_gasLane_keyHash, // gase lane keyHash -> max gas price willing to pay for a requeist in wei : ID for off -chain VRF job
            i_subscriptionId, // subscriptionId
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit, // gas limit for the callback
            NUM_WORDS // number of random words to return 1 word
        );

        emit RequestLotteryWinner(reqeustId);
    }

    function fulfillRandomWords(
        uint256 /*requestId*/,
        uint256[] memory randomWords
    ) internal override {
        // modulo to get the winner
        uint256 winnerIndex = randomWords[0] % getPlayerCount();
        address payable winner = s_players[winnerIndex]; // recent winner or getPlayer(winnerIndex)
        s_lotteryWinner = winner; // gloabl winner to show on UI
        s_players = new address payable[](0); // reset the players array
        s_lotteryState = LotteryState.OPEN; // open the lottery again
        s_lastLotteryTime = block.timestamp; // update the last lottery time
        (bool success, ) = winner.call{value: address(this).balance}(""); // send all the money to the winner
        if (!success) {
            revert Lottery__TrasferFailed();
        }
        emit WinnerPicked(winner); // to get a history of winners using events
    }

    // Pure fuction to get the state variables
    function getTicketPrice() public view returns (uint256) {
        return i_ticketPrice;
    }

    function getPlayerCount() public view returns (uint256) {
        return s_players.length;
    }

    function getPlayer(uint256 index) public view returns (address) {
        return s_players[index];
    }

    function getWinnerAddress() public view returns (address) {
        return s_lotteryWinner;
    }

    function getLotteryState() public view returns (LotteryState) {
        return s_lotteryState;
    }

    // note pure not view why ? because its constant so direct return
    function getNumWord() public pure returns (uint256) {
        return NUM_WORDS;
    }

    function getLastTimeStemp() public view returns (uint256) {
        return s_lastLotteryTime;
    }

    function getRequestConfirmations() public pure returns (uint16) {
        return REQUEST_CONFIRMATIONS; // number of confirmations to wait for before calling the callback
    }

    function getLotteryInterval() public view returns (uint256) {
        return i_lotteryInterval;
    }
}
