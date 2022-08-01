const { BN, expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const TokenTestInstance = artifacts.require('TokenTest');
const CrowdVInstance = artifacts.require('CrowdV');
const StackingInstance = artifacts.require('Staking');

contract("Staking", function (accounts) {
    const owner = accounts[0]; // Owner
    const stacker1 = accounts[1]; // Stacker
    const ownerTokenTest = accounts[2]; // Celui qui a déployé TokenTest.sol
    const otherAdress = accounts[3]; // adresse d'un inconnu.
    let approvedAmount1 = 100000000;
    let transferredAmount1 = 10000000;
    let stakedAmount0 = 0;
    let stakedAmount1 = 1000;
    let stakedAPR1 = 50; // Annual Percentage Rate.
    const Chainlink1 = '0xbF7A18ea5DE0501f7559144e702b29c55b055CcB'; // BUSD / ETH
    let TokenTesting,
        TokenTestAddress, // TokenTestInstance = adresse du contrat du token de test.
        CrowdVing,
        CrowdVingAddress, // CrowdVingAddress = adresse du contrat du token de reward.
        Stacking,
        StackingAddress; // StackingAddress = adresse du contrat de staking.


            // console.log("owner ==> ", owner)
            // console.log("stacker1 ==> ", stacker1)
            // console.log("TokenTestAddress ==> ", TokenTestAddress)
            // console.log("CrowdVingAddress ==> ", CrowdVingAddress)
            // console.log("StackingAddress ==> ", StackingAddress)
            // console.log("approvedAmount1 ==> ", approvedAmount1)
            // console.log("stakedAmount1 ==> ", stakedAmount1)
            // console.log("stakedAPR1 ==> ", stakedAPR1)
            // console.log("Chainlink1 ==> ", Chainlink1)
    beforeEach(async function () {
        TokenTesting = await TokenTestInstance.new({from: ownerTokenTest});
        TokenTestAddress = TokenTesting.address;

        Stacking = await StackingInstance.new({from: owner});
        StackingAddress = Stacking.address;
        })

    context("addPool()", function() {
        it('Test on addPool() : only Owner', async function () {
            await expectRevert(Stacking.addPool(TokenTestAddress, stakedAPR1, Chainlink1, {from: stacker1}), "Ownable: caller is not the owner")
        });

        it('Test on addPool() : twice same token', async function () {
            let pools = await Stacking.pools.call(TokenTestAddress);
            // console.log("pools.activePool ==> ", pools.activePool)
            expect(pools.activePool).to.equal(false); // This pool/token doesn't already exist.
        });

        it('Test on addPool() : test event', async function () {
            let receipt = await Stacking.addPool(TokenTestAddress, stakedAPR1, Chainlink1, {from: owner});
            expectEvent(receipt, "NewPool", {tokenAddress: TokenTestAddress, APR: new BN(stakedAPR1)});
        });
    })


    context("stopPool()", function() {

        it('Test on stopPool() : only Owner', async function () {
            await Stacking.addPool(TokenTestAddress, stakedAPR1, Chainlink1, {from: owner})
            await expectRevert(Stacking.stopPool(TokenTestAddress, {from: stacker1}), "Ownable: caller is not the owner")
        });

        it('Test on stopPool() : pool is active', async function () {
            await Stacking.addPool(TokenTestAddress, stakedAPR1, Chainlink1, {from: owner})

            let pools = await Stacking.pools.call(TokenTestAddress);
            // console.log("pools.activePool ==> ", pools.activePool)
            expect(pools.activePool).to.equal(true); // Pool is not active or doesn't exist.
        });

        it('Test on stopPool() : test event', async function () {
            await Stacking.addPool(TokenTestAddress, stakedAPR1, Chainlink1, {from: owner});
            let receipt = await Stacking.stopPool(TokenTestAddress, {from: owner});

            let blockNum = await web3.eth.getBlockNumber()
            let block = await web3.eth.getBlock(blockNum)
            // console.log("blockNum ==> ", blockNum)
            // console.log("block ==> ", block)
            // console.log("block['timestamp'] ==> ", block['timestamp'])
            expectEvent(receipt, "StopPool", {tokenAddress: TokenTestAddress, date: new BN(block['timestamp'])});
        });
    })

    context("Stake", function() {
        beforeEach(async function () {
            // let stakerID_0 = await TokenTesting.balanceOf(stacker1, {from: stacker1});
            // console.log("stakerID_0A ==> ", stakerID_0)
            await TokenTesting.transfer(stacker1, transferredAmount1, {from: ownerTokenTest});
            // stakerID_0 = await TokenTesting.balanceOf(stacker1, {from: stacker1});
            // console.log("stakerID_0B ==> ", stakerID_0)

            await Stacking.addPool(TokenTestAddress, stakedAPR1, Chainlink1, {from: owner});
            await TokenTesting.approve(StackingAddress, approvedAmount1, {from: stacker1}); // l.136 dans https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/ERC20.sol
        })

        it('Test on stacker1 : already staker', async function () {
            await Stacking.stake(stakedAmount1, TokenTestAddress, {from: stacker1})
            await expectRevert(Stacking.stake(stakedAmount1, TokenTestAddress, {from: stacker1}), "You already stake this pool")
        });

        it('Test on stacker1 : amount stacked = 0', async function () {
            await expectRevert(Stacking.stake(stakedAmount0, TokenTestAddress, {from: stacker1}), "The amount must be greater than zero.")
        });

        it('Test on stacker1 : check availability of the token', async function () {
            let pools = await Stacking.pools.call(TokenTestAddress);
            expect(pools.activePool).to.equal(true); // This token isn't available.
        });

        // it('Test on stacker1 : TransferFrom', async function () { // @todo
        //     // let recipient = await Stacking.stake(stakedAmount0, TokenTestAddress, {from: stacker1}).call(); // ??? POSSIBLE DE LE RECUPERER ???
        //     // console.log("recipient ==> ", recipient)
        //     // expect(recipient).to.equal(true); // Transfer from error
        //     await expectRevert(Stacking.stake(stakedAmount1, otherAdress, {from: stacker1}), "Transfer from error")
        // });

        it('Test on stacker1 : test event', async function () {
            let receipt = await Stacking.stake(stakedAmount1, TokenTestAddress, {from: stacker1});
            // console.log("receipt ==> ", receipt)

            let blockNum = await web3.eth.getBlockNumber()
            let block = await web3.eth.getBlock(blockNum)
            // console.log("blockNum ==> ", blockNum)
            // console.log("block ==> ", block)
            // console.log("block['timestamp'] ==> ", block['timestamp'])
            expectEvent(receipt, "Stake", {sender: stacker1, tokenAddress: TokenTestAddress, amount: new BN(stakedAmount1), date: new BN(block['timestamp'])});
        });
    })

    context("addStake", function() {
        beforeEach(async function () {
            // let stakerID_0 = await TokenTesting.balanceOf(stacker1, {from: stacker1});
            // console.log("stakerID_0A ==> ", stakerID_0)
            await TokenTesting.transfer(stacker1, transferredAmount1, {from: ownerTokenTest});
            // stakerID_0 = await TokenTesting.balanceOf(stacker1, {from: stacker1});
            // console.log("stakerID_0B ==> ", stakerID_0)

            await Stacking.addPool(TokenTestAddress, stakedAPR1, Chainlink1, {from: owner});
            await TokenTesting.approve(StackingAddress, approvedAmount1, {from: stacker1}); // l.136 dans https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/ERC20.sol
        })

        it('Test on stacker1 : already staker', async function () {
            await Stacking.stake(stakedAmount1, TokenTestAddress, {from: stacker1})
            await expectRevert(Stacking.addStake(stakedAmount1, TokenTestAddress, {from: otherAdress}), "You are not a staker")
        });

        it('Test on stacker1 : amount stacked = 0', async function () {
            await expectRevert(Stacking.stake(stakedAmount0, TokenTestAddress, {from: stacker1}), "The amount must be greater than zero.")
        });

        it('Test on stacker1 : check availability of the token', async function () {
            await Stacking.stake(stakedAmount1, TokenTestAddress, {from: stacker1});
            let receipt = await Stacking.addStake(stakedAmount1, TokenTestAddress, {from: stacker1});

            let pools = await Stacking.pools.call(TokenTestAddress);
            expect(pools.activePool).to.equal(true); // This token isn't available.
        });

        // it('Test on stacker1 : TransferFrom', async function () { // @todo
        //     // let recipient = await Stacking.stake(stakedAmount0, TokenTestAddress, {from: stacker1}).call(); // ??? POSSIBLE DE LE RECUPERER ???
        //     // console.log("recipient ==> ", recipient)
        //     // expect(recipient).to.equal(true); // Transfer from error
        //     await expectRevert(Stacking.stake(stakedAmount1, otherAdress, {from: stacker1}), "Transfer from error")
        // });

        // it('Test on stacker1 : test event', async function () {
        //     let receipt = await Stacking.stake(stakedAmount1, TokenTestAddress, {from: stacker1});
        //     // console.log("receipt ==> ", receipt)

        //     let blockNum = await web3.eth.getBlockNumber()
        //     let block = await web3.eth.getBlock(blockNum)
        //     // console.log("blockNum ==> ", blockNum)
        //     // console.log("block ==> ", block)
        //     // console.log("block['timestamp'] ==> ", block['timestamp'])
        //     expectEvent(receipt, "Stake", {sender: stacker1, tokenAddress: TokenTestAddress, amount: new BN(stakedAmount1), date: new BN(block['timestamp'])});
        // });

        it('Test on stacker1 : test event', async function () {
            let receipt = await Stacking.stake(stakedAmount1, TokenTestAddress, {from: stacker1});
            // console.log("receipt ==> ", receipt)

            let blockNum = await web3.eth.getBlockNumber()
            let block = await web3.eth.getBlock(blockNum)
            // console.log("blockNum ==> ", blockNum)
            // console.log("block ==> ", block)
            // console.log("block['timestamp'] ==> ", block['timestamp'])
            expectEvent(receipt, "Stake", {sender: stacker1, tokenAddress: TokenTestAddress, amount: new BN(stakedAmount1), date: new BN(block['timestamp'])});
        });
    })

    context("withdraw", function() {
        beforeEach(async function () {
            // let stakerID_0 = await TokenTesting.balanceOf(stacker1, {from: stacker1});
            // console.log("stakerID_0A ==> ", stakerID_0)
            await TokenTesting.transfer(stacker1, transferredAmount1, {from: ownerTokenTest});
            // stakerID_0 = await TokenTesting.balanceOf(stacker1, {from: stacker1});
            // console.log("stakerID_0B ==> ", stakerID_0)

            await Stacking.addPool(TokenTestAddress, stakedAPR1, Chainlink1, {from: owner});
            await TokenTesting.approve(StackingAddress, approvedAmount1, {from: stacker1}); // l.136 dans https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/ERC20.sol
            await Stacking.stake(stakedAmount1, TokenTestAddress, {from: stacker1})
        })

        it('Test on stacker1 : already staker', async function () {
            await expectRevert(Stacking.withdraw(stakedAmount1, TokenTestAddress, {from: otherAdress}), "You are not a staker")
        });

        it('Test on stacker1 : amount stacked = 0', async function () {
            await expectRevert(Stacking.withdraw(stakedAmount0, TokenTestAddress, {from: stacker1}), "The amount must be greater than zero.")
        });

        it('Test on stacker1 : check availability of the token', async function () {
            let pools = await Stacking.pools.call(TokenTestAddress);
            expect(pools.activePool).to.equal(true); // This token isn't available.
        });

        // it('Test on stacker1 : TransferFrom', async function () { // @todo
        //     // let recipient = await Stacking.stake(stakedAmount0, TokenTestAddress, {from: stacker1}).call(); // ??? POSSIBLE DE LE RECUPERER ???
        //     // console.log("recipient ==> ", recipient)
        //     // expect(recipient).to.equal(true); // Transfer from error
        //     await expectRevert(Stacking.stake(stakedAmount1, otherAdress, {from: stacker1}), "Transfer from error")
        // });

        it('Test on stacker1 : test event', async function () {
            let receipt = await Stacking.withdraw(stakedAmount1, TokenTestAddress, {from: stacker1});
            // console.log("receipt ==> ", receipt)

            let blockNum = await web3.eth.getBlockNumber()
            let block = await web3.eth.getBlock(blockNum)
            // console.log("blockNum ==> ", blockNum)
            // console.log("block ==> ", block)
            // console.log("block['timestamp'] ==> ", block['timestamp'])
            expectEvent(receipt, "Unstake", {sender: stacker1, tokenAddress: TokenTestAddress, amount: new BN(stakedAmount1), date: new BN(block['timestamp'])});
        });
    })

    // @todo : PAS BESOIN DU BeforeEach. Mettre cette fonction tout en haut ???
    // context("getLatestPrice", function() {
    //     it('Test on Chainlink : get last price of a pair', async function () {
    //         console.log("StackingAddress ==> ", StackingAddress)
    //         let lastPrice = await Stacking.getLatestPrice(Chainlink1, {from: StackingAddress});
    //         console.log("lastPrice ==> ", lastPrice)
    //         // expect(lastPrice.description).to.be.equal("proposalVoter1");
    //     });
    // })

    context("calculateReward", function() {
        beforeEach(async function () {
            // let stakerID_0 = await TokenTesting.balanceOf(stacker1, {from: stacker1});
            // console.log("stakerID_0A ==> ", stakerID_0)
            await TokenTesting.transfer(stacker1, transferredAmount1, {from: ownerTokenTest});
            // stakerID_0 = await TokenTesting.balanceOf(stacker1, {from: stacker1});
            // console.log("stakerID_0B ==> ", stakerID_0)

            await Stacking.addPool(TokenTestAddress, stakedAPR1, Chainlink1, {from: owner});
            await TokenTesting.approve(StackingAddress, approvedAmount1, {from: stacker1}); // l.136 dans https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/ERC20.sol
            await Stacking.stake(stakedAmount1, TokenTestAddress, {from: stacker1})
        })

        it('Test on calculateReward : already staker', async function () {
            await expectRevert(Stacking.calculateReward(TokenTestAddress, {from: otherAdress}), "You are not a staker")
        });

        // it('Test on calculateReward : check availability of the token', async function () { // @todo
        //     let pools = await Stacking.pools.call(TokenTestAddress);
        //     expect(pools.activePool).to.equal(true); // This token isn't available.
        // });

        // it('Test on calculateReward : TransferFrom', async function () { // @todo
        //     // let recipient = await Stacking.stake(stakedAmount0, TokenTestAddress, {from: stacker1}).call(); // ??? POSSIBLE DE LE RECUPERER ???
        //     // console.log("recipient ==> ", recipient)
        //     // expect(recipient).to.equal(true); // Transfer from error
        //     await expectRevert(Stacking.stake(stakedAmount1, otherAdress, {from: stacker1}), "Transfer from error")
        // });

        it('Test on calculateReward : get reward', async function () {
            // console.log("StackingAddress ==> ", StackingAddress)
            let receipt = await Stacking.calculateReward(TokenTestAddress, {from: stacker1});
            console.log("receipt ==> ", receipt)
            // expect(lastPrice.description).to.be.equal("proposalVoter1");
        });
    })

})