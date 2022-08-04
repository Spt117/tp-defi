const { BN, expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const TokenTestInstance = artifacts.require('TokenTest');
const StackingInstance = artifacts.require('Staking');

contract("Staking", function (accounts) {
    const owner = accounts[0]; // Owner
    const stacker1 = accounts[1]; // Stacker
    const stacker2 = accounts[2]; // Stacker
    const ownerTokenTest = accounts[3]; // Celui qui a déployé TokenTest.sol
    const otherAdress = accounts[4]; // adresse d'un inconnu.
    let approvedAmount1 = 100000000;
    let transferredAmount1 = 10000000;
    let stakedAmount0 = 0;
    let stakedAmount1 = 1000;
    let stakedAPR1 = 50; // Annual Percentage Rate.
    const Chainlink1 = '0xbF7A18ea5DE0501f7559144e702b29c55b055CcB'; // BUSD / ETH
    let TokenTesting,
        TokenTestAddress, // TokenTestInstance = adresse du contrat du token de test.
        Stacking,
        StackingAddress; // StackingAddress = adresse du contrat de staking.

    describe('Light beforeEach', function () {
        beforeEach(async function () {
            TokenTesting = await TokenTestInstance.new({from: ownerTokenTest});
            TokenTestAddress = TokenTesting.address;

            Stacking = await StackingInstance.new({from: owner});
        })

        context("addPool()", function() {
            it('Test on addPool() : only Owner', async function () {
                await expectRevert(Stacking.addPool(TokenTestAddress, stakedAPR1, Chainlink1, {from: stacker1}), "Ownable: caller is not the owner")
            });

            it('Test on addPool() : twice same token', async function () {
                await Stacking.addPool(TokenTestAddress, stakedAPR1, Chainlink1, {from: owner})
                await expectRevert(Stacking.addPool(TokenTestAddress, stakedAPR1, Chainlink1, {from: owner}), "This token already exist")
            });

            it('Test on addPool() : test event', async function () {
                let receipt = await Stacking.addPool(TokenTestAddress, stakedAPR1, Chainlink1, {from: owner});
                await expectEvent(receipt, "NewPool", {tokenAddress: TokenTestAddress, APR: new BN(stakedAPR1)});
            });
        })

        context("stopPool()", function() {
            it('Test on stopPool() : only Owner', async function () {
                await Stacking.addPool(TokenTestAddress, stakedAPR1, Chainlink1, {from: owner})
                await expectRevert(Stacking.stopPool(TokenTestAddress, {from: stacker1}), "Ownable: caller is not the owner")
            });

            it('Test on stopPool() : pool is active', async function () {
                await Stacking.addPool(TokenTestAddress, stakedAPR1, Chainlink1, {from: owner});
                await expectRevert(Stacking.stopPool(TokenTestAddress, {from: owner}), "Pool is not active")
            });

            it('Test on stopPool() : test event', async function () {
                await Stacking.addPool(TokenTestAddress, stakedAPR1, Chainlink1, {from: owner});
                let receipt = await Stacking.stopPool(TokenTestAddress, {from: owner});
                let blockNum = await web3.eth.getBlockNumber()
                let block = await web3.eth.getBlock(blockNum)

                await expectEvent(receipt, "StopPool", {tokenAddress: TokenTestAddress, date: new BN(block['timestamp'])});
            });
        })
    })

    describe('Big beforeEach', function () {

        beforeEach(async function () {
            TokenTesting = await TokenTestInstance.new({from: ownerTokenTest});
            TokenTestAddress = TokenTesting.address;

            Stacking = await StackingInstance.new({from: owner});
            StackingAddress = Stacking.address;

            await TokenTesting.transfer(stacker1, transferredAmount1, {from: ownerTokenTest});
            await Stacking.addPool(TokenTestAddress, stakedAPR1, Chainlink1, {from: owner});
            await TokenTesting.approve(StackingAddress, approvedAmount1, {from: stacker1}); // l.136 dans https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/ERC20.sol
        })

        context("Stake()", function() {
            it('Test on stacker1 : already staker', async function () {
                await Stacking.stake(stakedAmount1, TokenTestAddress, {from: stacker1})
                await expectRevert(Stacking.stake(stakedAmount1, TokenTestAddress, {from: stacker1}), "You already stake this pool")
            });

            it('Test on stacker1 : amount stacked = 0', async function () {
                await expectRevert(Stacking.stake(stakedAmount0, TokenTestAddress, {from: stacker1}), "The amount must be greater than zero.")
            });

            it('Test on stacker1 : check availability of the token', async function () {
                let pools = await Stacking.pools.call(TokenTestAddress);
                await expect(pools.activePool).to.equal(true); // This token isn't available.
            });

            it('Test on stacker1 : test event', async function () {
                let receipt = await Stacking.stake(stakedAmount1, TokenTestAddress, {from: stacker1});
                let blockNum = await web3.eth.getBlockNumber()
                let block = await web3.eth.getBlock(blockNum)

                await expectEvent(receipt, "Stake", {sender: stacker1, tokenAddress: TokenTestAddress, amount: new BN(stakedAmount1), date: new BN(block['timestamp'])});
            });

            it('Test on stacker2 : test event', async function () {
                await Stacking.stake(stakedAmount1, TokenTestAddress, {from: stacker1});

                await TokenTesting.transfer(stacker2, transferredAmount1, {from: ownerTokenTest});
                await TokenTesting.approve(StackingAddress, approvedAmount1, {from: stacker2}); // l.136 dans https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/ERC20.sol
                let receipt = await Stacking.stake(stakedAmount1, TokenTestAddress, {from: stacker2});
                let blockNum = await web3.eth.getBlockNumber()
                let block = await web3.eth.getBlock(blockNum)

                await expectEvent(receipt, "Stake", {sender: stacker2, tokenAddress: TokenTestAddress, amount: new BN(stakedAmount1), date: new BN(block['timestamp'])});
            });
        })

        // context("addStake()", function() {
        //     it('Test on stacker1 : already staker', async function () {
        //         // await Stacking.stake(stakedAmount1, TokenTestAddress, {from: stacker1})
        //         await expectRevert(Stacking.addStake(stakedAmount1, TokenTestAddress, {from: otherAdress}), "You are not a staker")
        //     });

        //     it('Test on stacker1 : amount stacked = 0', async function () {
        //         await Stacking.stake(stakedAmount1, TokenTestAddress, {from: stacker1})
        //         await expectRevert(Stacking.addStake(stakedAmount0, TokenTestAddress, {from: stacker1}), "The amount must be greater than zero.")
        //     });

        //     it('Test on stacker1 : check availability of the token', async function () {
        //         await Stacking.stake(stakedAmount1, TokenTestAddress, {from: stacker1});
        //         await Stacking.addStake(stakedAmount1, TokenTestAddress, {from: stacker1});

        //         let pools = await Stacking.pools.call(TokenTestAddress);
        //         expect(pools.activePool).to.equal(true); // This token isn't available.
        //     });

        //     it('Test on stacker1 : test event', async function () {
        //         await Stacking.stake(stakedAmount1, TokenTestAddress, {from: stacker1});
        //         console.log("stakedAmount1 : ", stakedAmount1);
        //         console.log("TokenTestAddress : ", TokenTestAddress);
        //         // console.log("stakedAmount1 : ", stakedAmount1);
        //         // let receipt = await Stacking.addStake(stakedAmount1, TokenTestAddress, {from: stacker1});
        //         // let blockNum = await web3.eth.getBlockNumber()
        //         // let block = await web3.eth.getBlock(blockNum)

        //         // await expectEvent(receipt, "Stake", {sender: stacker1, tokenAddress: TokenTestAddress, amount: new BN(stakedAmount1), date: new BN(block['timestamp'])});
        //     });

        //     it('Test on stacker2 : test event', async function () {
        //         await Stacking.stake(stakedAmount1, TokenTestAddress, {from: stacker1});
                
        //         await TokenTesting.transfer(stacker2, transferredAmount1, {from: ownerTokenTest});
        //         await TokenTesting.approve(StackingAddress, approvedAmount1, {from: stacker2}); // l.136 dans https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/ERC20.sol
        //         await Stacking.stake(stakedAmount1, TokenTestAddress, {from: stacker2});
        //         let receipt = await Stacking.addStake(stakedAmount1, TokenTestAddress, {from: stacker2});
        //         let blockNum = await web3.eth.getBlockNumber()
        //         let block = await web3.eth.getBlock(blockNum)

        //         await expectEvent(receipt, "Stake", {sender: stacker2, tokenAddress: TokenTestAddress, amount: new BN(stakedAmount1), date: new BN(block['timestamp'])});
        //     });
        // })

        context("withdraw()", function() {
            beforeEach(async function () {
                await Stacking.stake(stakedAmount1, TokenTestAddress, {from: stacker1})
            })

            it('Test on stacker1 : already staker', async function () {
                await expectRevert(Stacking.withdraw(stakedAmount1, TokenTestAddress, {from: otherAdress}), "You are not a staker")
            });

            it('Test on stacker1 : amount stacked = 0', async function () {
                await expectRevert(Stacking.withdraw(stakedAmount0, TokenTestAddress, {from: stacker1}), "The amount must be greater than zero.")
            });

            // it('Test on stacker1 : amount stacked = 0', async function () { // @todo 
            // require(_amount >= stakers[_token][msg.sender].amount, "You don't have this amount of token");
            //     await expectRevert(Stacking.withdraw(stakedAmount0, TokenTestAddress, {from: stacker1}), "The amount must be greater than zero.")
            // });

            it('Test on stacker1 : check availability of the token', async function () {
                let pools = await Stacking.pools.call(TokenTestAddress);
                await expect(pools.activePool).to.equal(true); // This token isn't available.
            });

            it('Test on stacker1 : test event', async function () {
                let receipt = await Stacking.withdraw(stakedAmount1, TokenTestAddress, {from: stacker1});
                let blockNum = await web3.eth.getBlockNumber()
                let block = await web3.eth.getBlock(blockNum)

                await expectEvent(receipt, "Unstake", {sender: stacker1, tokenAddress: TokenTestAddress, amount: new BN(stakedAmount1), date: new BN(block['timestamp'])});
            });
        })

        context("calculateReward()", function() {
            beforeEach(async function () {
                await Stacking.stake(stakedAmount1, TokenTestAddress, {from: stacker1})
            })

            it('Test on calculateReward : already staker', async function () {
                await expectRevert(Stacking.calculateReward(TokenTestAddress, {from: otherAdress}), "You are not a staker")
            });

            it('Test on calculateReward : get reward', async function () {
                let receipt = await Stacking.calculateReward(TokenTestAddress, {from: stacker1});
                await expect(new BN(receipt)).to.be.bignumber.equal(new BN(0));
            });
        })

        context("claimRewards()", function() {
            it('Test on stacker1 : already staker', async function () {
                await Stacking.stake(stakedAmount1, TokenTestAddress, {from: stacker1})

                await expectRevert(Stacking.claimRewards(TokenTestAddress, {from: otherAdress}), "You are not a staker")
            });
        })

        context("getStaking()", function() {
            it('Check amount of a stacked pool', async function () {
                await Stacking.stake(stakedAmount1, TokenTestAddress, {from: stacker1})

                let receipt = await Stacking.getStaking(TokenTestAddress , {from: stacker1});
                await expect(new BN(receipt)).to.be.bignumber.equal(new BN(stakedAmount1));
            });
        })
    })
})