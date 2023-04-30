const { development_chain } = require("../helper-hardhat-config");
const { network, ethers } = require("hardhat");
const BASE_FEE = ethers.utils.parseEther("0.25"); // 0.25 premium , its cost 0.25 links
const GAS_PRICE_LINK = 1e9; // calculated based on gas price of chain link

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;

  // why this things : gas price because nodes pay forus to get random number its offseted by giving BASE_FEE by us
  if (development_chain.includes(network.name)) {
    console.log("Local network is detected 🚀 deploying mock contracts");
    // deploy mock vrfcoodinator
    await deploy("VRFCoordinatorV2Mock", {
      from: deployer,
      args: [BASE_FEE, GAS_PRICE_LINK],
      log: true,
      WaitForConfirmations: network.config.blockConfirmations || 1,
    });
    console.log("Mock is deployed 👍");
  }
};

module.exports.tags = ["mocks", "all"];
