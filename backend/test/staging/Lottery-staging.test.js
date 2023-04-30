// verbode tetsing
const { assert, expect, AssertionError } = require("chai");
const { getNamedAccounts, deployments, network, ethers } = require("hardhat");
const {
  networkConfig,
  development_chain,
} = require("../../helper-hardhat-config");
// const chainID = networkConfig[network.config.chainId];

development_chain.includes(network.name)
  ? describe.skip
  : describe("Lottery Staging Test", function () {
      let lottery, deployer;

      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer;
        lottery = await ethers.getContract("Lottery", deployer);
        lottery_fee = await lottery.getTicketPrice();
      });

      describe("one massive staging test", async () => {
        it("works on testnet", async () => {
          const start_time = await lottery.getLastTimeStemp();
          const accounts = await ethers.getSigners();

          // set up listner
          await new Promise(async (resolve, reject) => {
            resolve();
            lottery.once("WinnerPicked", async () => {
              console.log("Event is emiited, event check completed");
              try {
                const winner = await lottery.getWinner();
                const lottery_state = await lottery.getLotteryState();
                const winner_balance = await accounts[0].getBalance();
                const ending_time = await lottery.getLotteryTimeStemp();

                await expect(lottery.getPlayer(0)).to.be.reverted;
                assert(winner, accounts[0].address);
                assert.equal(lottery_state.toString(), "0");
                assert.equal(
                  winner_balance.toString(),
                  starting_balance.add(lottery_fee).toString()
                );

                assert(ending_time > start_time);
                // resolve();
              } catch (error) {
                reject(error);
                console.log(error);
              }
            });
          });

          await lottery.enter({ value: lottery_fee });
          const starting_balance = await accounts[0].getBalance();
        });
      });
    });

// for testing
// 1 . get subid  for chainlink orf from vrf chainlink
// 2.  deploy contract with subid
// 3 . register constract and vrf subid
// 4.  register chainlink keepers
// 5. run staging test
