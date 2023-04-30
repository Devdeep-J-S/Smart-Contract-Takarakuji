// traditionally
// import
// function (main)
// calling main function

// now we declare function here
// all other function are called from script

// define func method
// function deploy_func() {
//     console.log('Deploying FundMe');
// }

// module.exports.default = deploy_func;

// name less function method 2 // arrow function
// cosnt getnamedaccount = hre.getNamedAccounts() // get named account
// hre - >  hardhat runtime environment

const {
  networkConfig,
  development_chain,
} = require("../helper-hardhat-config");
const { network, ethers } = require("hardhat");
const { verify } = require("../utils/verify");

const VRF_MOCK_FEE = ethers.utils.parseEther("20");

module.exports = async ({ getNamedAccounts, deployments }) => {
  // get named account and deployment are from hre -> hardhat runtime environment !!!
  // deploy, getNamedAccounts, ethers, network are from hardhat hre -> hardhat runtime environment
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;
  const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;

  let vrfCoordinatorV2address, subscriptionID; // vrf coordinator address
  const entranceFee = networkConfig[chainId].entranceFee; // get from helper-hardhat-config.js
  const gaslane = networkConfig[chainId].gaslane; // get from helper-hardhat-config.js
  const callbackGasLimit = networkConfig[chainId].callbackGasLimit; // get from helper-hardhat-config.js
  const interval = networkConfig[chainId].interval; // get from helper-hardhat-config.js

  let mock_contract = await ethers.getContract("VRFCoordinatorV2Mock");

  // for local only
  if (development_chain.includes(network.name)) {
    const response = await mock_contract.createSubscription();
    const receipt = await response.wait(); // wait for 1 block
    subscriptionID = receipt.events[0].args.subId;
    vrfCoordinatorV2address = mock_contract.address;

    // fund the subscription
    await mock_contract.fundSubscription(subscriptionID, VRF_MOCK_FEE);
  } // get from helper-hardhat-config.js
  else {
    vrfCoordinatorV2address = networkConfig[chainId].vrfCoordinator;
    subscriptionID = networkConfig[chainId].subscriptionID;
  }

  const args = [
    vrfCoordinatorV2address,
    entranceFee,
    gaslane,
    subscriptionID,
    callbackGasLimit,
    interval,
  ]; // args for lottery

  const lottery = await deploy("Lottery", {
    from: deployer,
    args: args,
    log: true,
    WaitForConfirmations: network.config.blockConfirmations || 1,
  });

  await mock_contract.addConsumer(subscriptionID, lottery.address); // add because automation chainlink update

  // verify contract
  if (!development_chain.includes(network.name) && ETHERSCAN_API_KEY) {
    await verify(lottery.address, args);
  }
  console.log("Lottery is deployed 👍");
};

// mocking : https://stackoverflow.com/questions/2665812/what-is-mocking
