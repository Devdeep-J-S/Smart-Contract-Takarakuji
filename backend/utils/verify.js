const { run } = require("hardhat");

/**@dev using etherscan api to verify contract
 verify contract
 */
async function verify(contractAddress, args) {
  // https://hardhat.org/hardhat-runner/plugins/nomiclabs-hardhat-etherscan

  /// to do it mannully
  // npx hardhat verify --network mainnet DEPLOYED_CONTRACT_ADDRESS "Constructor argument 1"
  console.log("Verifying contract on etherscan...");
  // try catch for safety
  try {
    await run("verify:verify", {
      // verfiy:verify is a task
      address: contractAddress,
      constructorArguments: args,
    });
  } catch (error) {
    if (error.message.includes("Contract source code already verified")) {
      console.log("Contract already verified, skipping...");
    }
    console.log(error);
  }
}

module.exports = { verify };
