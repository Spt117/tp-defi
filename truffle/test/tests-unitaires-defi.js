const { BN, expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const TokenTestInstance = artifacts.require('TokenTest');
const StakingInstance = artifacts.require('Staking');

contract("Staking", function (accounts) {
    const owner = accounts[0]; // Owner
    const stacker1 = accounts[1]; // Stacker 1
    const stacker2 = accounts[2]; // Stacker 2
    const ownerTokenTest = accounts[3]; // Celui qui a déployé TokenTest.sol
    const nonStacker = accounts[4]; // adresse d'un inconnu.
    let approvedAmount1 = 100000000;
    let transferredAmount1 = 10000000;
    let stakedAmount0 = 0;
    let stakedAmount = 1000;
    let stakedAPR1 = 50; // Annual Percentage Rate.
    const Chainlink1 = '0xbF7A18ea5DE0501f7559144e702b29c55b055CcB'; // BUSD / ETH
    let TokenTesting_i,
        TokenTestAddress, // TokenTestInstance = adresse du contrat du token de test.
        Staking_i,
        StakingAddress; // StakingAddress = adresse du contrat de staking.

    describe('Light beforeEach', function () {
        beforeEach(async function () {
            TokenTesting_i = await TokenTestInstance.new({from: ownerTokenTest});
            TokenTestAddress = TokenTesting_i.address;

            Staking_i = await StakingInstance.new({from: owner});
        })

        context("addPool()", function() {
            it('Test on addPool() : only Owner', async function () {
                await expectRevert(Staking_i.addPool(TokenTestAddress, stakedAPR1, Chainlink1, {from: stacker1}), "Ownable: caller is not the owner")
            });

            it('Test on addPool() : twice same token', async function () {
                await Staking_i.addPool(TokenTestAddress, stakedAPR1, Chainlink1, {from: owner})
                await expectRevert(Staking_i.addPool(TokenTestAddress, stakedAPR1, Chainlink1, {from: owner}), "Pool active")
            });

            it('Test on addPool() : test event', async function () {
                let receipt = await Staking_i.addPool(TokenTestAddress, stakedAPR1, Chainlink1, {from: owner});
                await expectEvent(receipt, "NewPool", {tokenAddress: TokenTestAddress, APR: new BN(stakedAPR1)});
            });
        })

        context("stake()", function() {
            it('Test on stacker1 : check availability of the token', async function () {
                await expectRevert(Staking_i.stake(stakedAmount, TokenTestAddress, {from: stacker1}), "Pool not active")
            });
        })

        context("stopPool()", function() {
            it('Test on stopPool() : only Owner', async function () {
                await Staking_i.addPool(TokenTestAddress, stakedAPR1, Chainlink1, {from: owner})
                await expectRevert(Staking_i.stopPool(TokenTestAddress, {from: stacker1}), "Ownable: caller is not the owner")
            });

            it('Test on stopPool() : pool is active', async function () {
                await expectRevert(Staking_i.stopPool(TokenTestAddress, {from: owner}), "Pool not active")
            });

            it('Test on stopPool() : test event', async function () {
                await Staking_i.addPool(TokenTestAddress, stakedAPR1, Chainlink1, {from: owner});
                let receipt = await Staking_i.stopPool(TokenTestAddress, {from: owner});
                let blockNum = await web3.eth.getBlockNumber()
                let block = await web3.eth.getBlock(blockNum)

                await expectEvent(receipt, "StopPool", {tokenAddress: TokenTestAddress, date: new BN(block['timestamp'])});
            });
        })
    })

    describe('Big beforeEach', function () {

        beforeEach(async function () {
            TokenTesting_i = await TokenTestInstance.new({from: ownerTokenTest});
            TokenTestAddress = TokenTesting_i.address;

            Staking_i = await StakingInstance.new({from: owner});
            StakingAddress = Staking_i.address;

            await TokenTesting_i.transfer(stacker1, transferredAmount1, {from: ownerTokenTest});
            await Staking_i.addPool(TokenTestAddress, stakedAPR1, Chainlink1, {from: owner});
            await TokenTesting_i.approve(StakingAddress, approvedAmount1, {from: stacker1}); // l.136 dans https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/ERC20.sol
        })

        context("Stake()", function() {
            it('Test on stacker1 : amount stacked = 0', async function () {
                await expectRevert(Staking_i.stake(stakedAmount0, TokenTestAddress, {from: stacker1}), "Amount can't be zero")
            });

            it('Test on stacker1 : test event', async function () {
                let receipt = await Staking_i.stake(stakedAmount, TokenTestAddress, {from: stacker1});
                let blockNum = await web3.eth.getBlockNumber()
                let block = await web3.eth.getBlock(blockNum)

                await expectEvent(receipt, "Stake", {sender: stacker1, tokenAddress: TokenTestAddress, amount: new BN(stakedAmount), date: new BN(block['timestamp'])});
            });

            it('Test on stacker2 : test event', async function () {
                await Staking_i.stake(stakedAmount, TokenTestAddress, {from: stacker1});

                await TokenTesting_i.transfer(stacker2, transferredAmount1, {from: ownerTokenTest});
                await TokenTesting_i.approve(StakingAddress, approvedAmount1, {from: stacker2}); // l.136 dans https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/ERC20.sol
                let receipt = await Staking_i.stake(stakedAmount, TokenTestAddress, {from: stacker2});
                let blockNum = await web3.eth.getBlockNumber()
                let block = await web3.eth.getBlock(blockNum)

                await expectEvent(receipt, "Stake", {sender: stacker2, tokenAddress: TokenTestAddress, amount: new BN(stakedAmount), date: new BN(block['timestamp'])});
            });
        })

        context("withdraw()", function() {
            beforeEach(async function () {
                await Staking_i.stake(stakedAmount, TokenTestAddress, {from: stacker1})
            })

            it('Test on stacker1 : already staker', async function () {
                await expectRevert(Staking_i.withdraw(stakedAmount, TokenTestAddress, {from: nonStacker}), "Not a staker")
            });

            it('Test on stacker1 : amount stacked = 0', async function () {
                await expectRevert(Staking_i.withdraw(stakedAmount0, TokenTestAddress, {from: stacker1}), "Amount can't be zero")
            });

            // it('Test on stacker1 : test event', async function () {
            //     let receipt = await Staking_i.withdraw(stakedAmount, TokenTestAddress, {from: stacker1});
            //     let blockNum = await web3.eth.getBlockNumber()
            //     let block = await web3.eth.getBlock(blockNum)

            //     await expectEvent(receipt, "Unstake", {sender: stacker1, tokenAddress: TokenTestAddress, amount: new BN(stakedAmount), date: new BN(block['timestamp'])});
            // });
        })

        context("calculateReward()", function() {
            beforeEach(async function () {
                await Staking_i.stake(stakedAmount, TokenTestAddress, {from: stacker1})
            })

            it('Test on calculateReward : already staker', async function () {
                await expectRevert(Staking_i.calculateReward(TokenTestAddress, {from: nonStacker}), "Not a staker")
            });

            // it('Test on calculateReward : get reward', async function () {
            //     let receipt = await Staking_i.calculateReward(TokenTestAddress, {from: stacker1});
            //     await expect(new BN(receipt)).to.be.bignumber.equal(new BN(0));
            // });
        })

        context("claimRewards()", function() {
            it('Test on stacker1 : already staker', async function () {
                await Staking_i.stake(stakedAmount, TokenTestAddress, {from: stacker1})

                await expectRevert(Staking_i.claimRewards(TokenTestAddress, {from: nonStacker}), "Not a staker")
            });
        })

        context("getStaking()", function() {
            it('Check amount of a stacked pool from msg.sender', async function () {
                await Staking_i.stake(stakedAmount, TokenTestAddress, {from: stacker1})

                let receipt = await Staking_i.getStaking(TokenTestAddress , {from: stacker1});
                await expect(new BN(receipt)).to.be.bignumber.equal(new BN(stakedAmount));
            });
        })

        context("getTotalStaking()", function() {
            it('Check total amount of a stacked pool', async function () {
                await Staking_i.stake(stakedAmount, TokenTestAddress, {from: stacker1})

                await TokenTesting_i.transfer(stacker2, transferredAmount1, {from: ownerTokenTest});
                await TokenTesting_i.approve(StakingAddress, approvedAmount1, {from: stacker2}); // l.136 dans https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/ERC20.sol
                await Staking_i.stake(stakedAmount, TokenTestAddress, {from: stacker2})

                let receipt = await Staking_i.getTotalStaking(TokenTestAddress , {from: stacker1});
                await expect(new BN(receipt)).to.be.bignumber.equal(new BN(stakedAmount * 2));
            });
        })
    })
})