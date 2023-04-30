// verbode tetsing

const { assert, expect } = require("chai");
const { getNamedAccounts, deployments, network, ethers } = require("hardhat");
const {
  networkConfig,
  development_chain,
} = require("../../helper-hardhat-config");
const chainID = network.config.chainId;

!development_chain.includes(network.name)
  ? describe.skip
  : describe("Lottery", function () {
      let lottery, mock_contract, lottery_fee, deployer, interval;

      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer;
        await deployments.fixture(); // deploy all contracts
        lottery = await ethers.getContract("Lottery", deployer);
        mock_contract = await ethers.getContract(
          "VRFCoordinatorV2Mock",
          deployer
        );
        lottery_fee = await lottery.getTicketPrice();
        interval = await lottery.getLotteryInterval();
      });

      describe("constructor", async () => {
        it("initialize lottery contract", async () => {
          // ideally one assert per it
          const lottery_state = await lottery.getLotteryState(); // big number so used string
          assert.equal(lottery_state.toString(), "0");
          assert.equal(interval.toString(), networkConfig[chainID].interval);
        });
      });

      describe("Enter Lottery", async () => {
        //test case - 1
        it("revert if don't have enough money", async () => {
          await expect(lottery.enter()).to.be.revertedWithCustomError(
            // new leaernig reverted with custom error
            lottery,
            "Lottery__NotEnoughETHTrasferred"
          );
        });

        // test case - 2
        it("Records player when player enters", async () => {
          await lottery.enter({ value: lottery_fee });
          const player_in_contract = await lottery.getPlayer(0);
          assert.equal(player_in_contract, deployer);
        });

        // test case - 3
        it("check event is emmited or not should return true", async () => {
          await expect(lottery.enter({ value: lottery_fee })).to.emit(
            lottery,
            "lottery_event"
          );
        });

        it("should not enter player when id closed state", async () => {
          await lottery.enter({ value: lottery_fee });
          // evm increase time function documentation in github and hardhat site watch it!!!
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);
          await network.provider.send("evm_mine");
          await lottery.performUpkeep(0);
          await expect(
            lottery.enter({ value: lottery_fee })
          ).to.be.revertedWithCustomError(lottery, "Lottery__NotOpenBro"); // custom error revert
        });

        it("should return false if people have not sended any money", async () => {
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);
          await network.provider.send("evm_mine");
          const { upkeepNeeded } = await lottery.callStatic.checkUpkeep([]);
          assert(!upkeepNeeded);
        });

        it("return false if lottery is closed", async () => {
          await lottery.enter({ value: lottery_fee });
          // evm increase time function documentation in github and hardhat site watch it!!!
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);
          await network.provider.send("evm_mine");
          await lottery.performUpkeep(0);
          const { upkeepNeeded } = await lottery.callStatic.checkUpkeep([]);
          assert(!upkeepNeeded);
        });

        //TODO : can add two test to check the other left conditions of upkeep
      });

      describe("Perform Upkeep", async () => {
        it("should run only if upkeep is true", async () => {
          await lottery.enter({ value: lottery_fee });
          // evm increase time function documentation in github and hardhat site watch it!!!
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);
          await network.provider.send("evm_mine");
          const flag = await lottery.performUpkeep([]);
          assert(flag);
        });

        it("should not run only if upkeep is false (no fund)", async () => {
          //   await lottery.enter({ value: lottery_fee });
          await expect(lottery.performUpkeep([])).to.be.revertedWithCustomError(
            lottery,
            "Lottery__UpkeepNotNeeded"
          );
        });

        it("should not run only if upkeep is false (fund is there but not enough time has passed)", async () => {
          await lottery.enter({ value: lottery_fee });
          await expect(lottery.performUpkeep([])).to.be.revertedWithCustomError(
            lottery,
            "Lottery__UpkeepNotNeeded"
          );
        });

        it("should update the lottery state to closed , event and vrf done", async () => {
          await lottery.enter({ value: lottery_fee });
          // evm increase time function documentation in github and hardhat site watch it!!!
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);
          await network.provider.send("evm_mine");
          const response = await lottery.performUpkeep([]);
          const receipt = await response.wait(1);
          const req_id = receipt.events[1].args.requestId; // here 1 becuase main function also emits event
          const lottery_state = await lottery.getLotteryState();
          assert(req_id.toNumber() > 0);
          assert(lottery_state.toString() == "1");
        });
      });

      describe("fulfillRandomWords check", async () => {
        beforeEach(async () => {
          await lottery.enter({ value: lottery_fee });
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);
          await network.provider.send("evm_mine");
        });

        it("can only be called by vrf coordinator after performUpkeep", async () => {
          await expect(mock_contract.fulfillRandomWords(0, lottery.address)).to
            .be.reverted;
        });
      });

      // Massive test getting error fixed it
      // TODO : fix this test -> Done👍
      describe("Massive test", async () => {
        it("Should distribute the prize money to the winner", async () => {
          const total_players = 5;
          const starting_account_index = 1; // beacuse 0th account is deployer
          const accounts = await ethers.getSigners();
          for (
            let i = starting_account_index;
            i < starting_account_index + total_players;
            i++
          ) {
            const player = await lottery.connect(accounts[i]);
            await player.enter({ value: lottery_fee });
          }
          const start_time = await lottery.getLastTimeStemp();
          const starting_balance = await accounts[1].getBalance();

          //perform upkeep mock it -> keeper contract
          // fullfillRandomWords mock it -> VRF
          // simulating listerner for event using Promise
          await new Promise(async (resolve, reject) => {
            lottery.once("WinnerPicked", async () => {
              console.log("Event emmited");
              try {
                const lottery_state = await lottery.getLotteryState();
                const ending_time = await lottery.getLastTimeStemp();
                const num_player = await lottery.getPlayerCount();
                const ending_balance = await accounts[1].getBalance();

                await expect(lottery.getPlayer(0)).to.be.reverted;
                assert(num_player.toString() == "0");
                assert(lottery_state.toString() == "0"); // should be OPEN
                assert(ending_time.toNumber() > start_time.toNumber());
                // check this
                // console.log(ending_balance.toString());
                assert.equal(
                  ending_balance.toString(),
                  starting_balance // startingBalance + ( (raffleEntranceFee * additionalEntrances) + raffleEntranceFee )
                    .add(lottery_fee.mul(num_player))
                    .toString()
                );

                resolve();
              } catch (error) {
                reject(error);
              }
            }); // listen for event

            // will go from here to up

            // this part should be working  without evm increase time todo : check it
            await ethers.provider.send("evm_increaseTime", [
              interval.toNumber() + 1,
            ]);
            await ethers.provider.send("evm_mine");

            const response = await lottery.performUpkeep([]);
            const receipt = await response.wait(1);
            await mock_contract.fulfillRandomWords(
              // fulfillRandomWords is a function of VRF (req_id , consumer)
              receipt.events[1].args.requestId,
              lottery.address
            );
          });
        });
      });
    });
