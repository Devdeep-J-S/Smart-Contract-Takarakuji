const { ethers } = require("hardhat");

const networkConfig = {
  11155111: {
    name: "sepolia",
    pricefeed_address: "0x694AA1769357215DE4FAC081bf1f309aDC325306",
    vrfCoordinator: "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625", // VRF Coordinator address
    entranceFee: ethers.utils.parseEther("0.01"),
    gaslane:
      "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c", // gaslane address,
    subscriptionID: "1449", // got by subscribing to gaslane chainlink vrf subscription
    callbackGasLimit: "5000000", // very high for safety
    interval: "30", // 30 seconds
  },
  31337: {
    name: "localhost",
    entranceFee: ethers.utils.parseEther("0.01"),
    gaslane:
      "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c",
    callbackGasLimit: "500000",
    interval: "30",
  },
};

const development_chain = ["hardhat", "localhost"];
// const DECIMALS = 8;
// const INITIAL_ANSWER = 200000000000;

module.exports = { networkConfig, development_chain };
