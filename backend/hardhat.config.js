require("@nomiclabs/hardhat-etherscan");
require("hardhat-deploy");
require("hardhat-deploy-ethers");
require("solidity-coverage");
require("hardhat-gas-reporter");
require("hardhat-contract-sizer");
require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");
require("prettier-plugin-solidity");

// here we add or so no error occurs and give clear idea of what is going on
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "http://";
const SEPOLIA_PRIVATE_KEY = process.env.SEPOLIA_PRIVATE_KEY || "0x";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "0x";
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY || "0x";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.18",
  namedAccounts: {
    deployer: {
      default: 0,
    },
    player: {
      default: 1,
    },
  },
  networks: {
    sepolia: {
      url: SEPOLIA_RPC_URL, // alchemy
      accounts: [SEPOLIA_PRIVATE_KEY],
      chainId: 11155111, // chainlink id get it from chainlist.org
      blockConfirmations: 5, // wait for 5 block confirmation
    },
    localhost: {
      url: "http://127.0.0.1:8545/",
      // accounts: [], directly by hardhat
      chainId: 31337,
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
  gasReporter: {
    // currency: "USD",
    // gasPrice: 100,

    currency: "INR",
    // coin market cap to get api to get current usd value for gas
    outputFile: "gas-report.txt",
    enabled: true,
    noColors: true, // because it can mess up in txt file
    coinmarketcap: COINMARKETCAP_API_KEY, // to get usd
  },
  mocha: {
    timeout: 200000, // 200 seconds
  },
};

// IIM Ahmedabad
// guj startup gujrat
