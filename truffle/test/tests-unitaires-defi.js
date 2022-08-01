const { BN, expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const TokenTestInstance = artifacts.require('TokenTest');
const CrowdVInstance = artifacts.require('CrowdV');
const StackingInstance = artifacts.require('Staking');

contract("Staking", function (accounts) {
    const owner = accounts[0];
    const stacker1 = accounts[1];
    const ownerTest = accounts[2]; // Celui qui a déployé TokenTest.sol
    let approvedAmount1 = 1000000;
    let stakedAmount1 = 10000;
    let stakedAPR1 = 50; // Annual Percentage Rate.
    const Chainlink1 = '0xbF7A18ea5DE0501f7559144e702b29c55b055CcB'; // BUSD / ETH
    let TokenTesting,
        TokenTestAddress, // TokenTestInstance = adresse du contrat du token de test.
        CrowdVing,
        CrowdVingAddress, // CrowdVingAddress = adresse du contrat du token de reward.
        Stacking,
        StackingAddress; // StackingAddress = adresse du contrat de staking.

    context("addPool()", function() {
        beforeEach(async function () {
            TokenTesting = await TokenTestInstance.new({from: owner});
            CrowdVing = await CrowdVInstance.new({from: owner});
            Stacking = await StackingInstance.new({from: owner});

            TokenTestAddress = TokenTesting.address;
            CrowdVingAddress = CrowdVing.address;
            StackingAddress = Stacking.address;
        })

        it('Test on addPool() : only Owner', async function () {
            console.log("owner ==> ", owner)
            console.log("stacker1 ==> ", stacker1)
            console.log("TokenTestAddress ==> ", TokenTestAddress)
            console.log("CrowdVingAddress ==> ", CrowdVingAddress)
            console.log("StackingAddress ==> ", StackingAddress)
            console.log("approvedAmount1 ==> ", approvedAmount1)
            console.log("stakedAmount1 ==> ", stakedAmount1)
            console.log("stakedAPR1 ==> ", stakedAPR1)
            console.log("Chainlink1 ==> ", Chainlink1)

            // await TokenTesting.approve(StackingAddress, stakedAmount1); // l.136 dans https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/ERC20.sol
            // await CrowdVing.approve(StackingAddress, stakedAmount1); // l.136 dans https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/ERC20.sol
            await expectRevert(Stacking.addPool(TokenTestAddress, stakedAPR1, Chainlink1, {from: stacker1}), "Ownable: caller is not the owner")
        });

        it('Test on addPool() : twice same token', async function () {
            await Stacking.addPool(TokenTestAddress, stakedAPR1, Chainlink1, {from: owner});
            // let pools = await Stacking.addPool(TokenTestAddress, stakedAPR1, Chainlink1, {from: owner});
            // console.log("pools ==> ", pools)
            // await CrowdVing.approve(StackingAddress, stakedAmount1); // l.136 dans https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/ERC20.sol
            await expectRevert(Stacking.addPool(TokenTestAddress, stakedAPR1, Chainlink1, {from: owner}), "This token already exist.")
        });


        it('Test on addPool() : test event', async function () {
            // await CrowdVing.approve(StackingAddress, stakedAmount1); // l.136 dans https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/ERC20.sol

            let receipt = await Stacking.addPool(TokenTestAddress, stakedAPR1, Chainlink1, {from: owner});
            expectEvent(receipt, "NewPool", {tokenAddress: TokenTestAddress, APR: new BN(stakedAPR1)});
        });
    })


    context("Stake", function() {

        beforeEach(async function () {
            TokenTesting = await TokenTestInstance.new({from: ownerTest});
            // CrowdVing = await CrowdVInstance.new({from: owner});
            Stacking = await StackingInstance.new({from: owner});

            TokenTestAddress = TokenTesting.address;
            // CrowdVingAddress = CrowdVing.address;
            StackingAddress = Stacking.address;

            let stakerID_0 = await TokenTesting.balanceOf(stacker1, {from: stacker1});
            console.log("stakerID_0A ==> ", stakerID_0)

            await TokenTesting.transfer(stacker1, stakedAmount1, {from: ownerTest});

            stakerID_0 = await TokenTesting.balanceOf(stacker1, {from: stacker1});
            console.log("stakerID_0B ==> ", stakerID_0)

            await Stacking.addPool(TokenTestAddress, stakedAPR1, Chainlink1, {from: owner});
            await TokenTesting.approve(StackingAddress, approvedAmount1, {from: stacker1}); // l.136 dans https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/ERC20.sol
        })

        it('Test on stacker1 : amount stacked = 0', async function () {
            // console.log("owner ==> ", owner)
            // console.log("stacker1 ==> ", stacker1)
            // console.log("TokenTestAddress ==> ", TokenTestAddress)
            // console.log("StackingAddress ==> ", StackingAddress)
            // console.log("approvedAmount1 ==> ", approvedAmount1)
            // console.log("stakedAmount1 ==> ", stakedAmount1)
            // console.log("stakedAPR1 ==> ", stakedAPR1)
            // console.log("Chainlink1 ==> ", Chainlink1)

            stakedAmount1 = 0;
            await expectRevert(Stacking.stake(stakedAmount1, TokenTestAddress, {from: stacker1}), "The amount must be greater than zero.")
        });
        it('Test on stacker1 : check availability of the token', async function () {
            // require(pools[_token].activePool, "This token isn't available.");
            // stakedAmount1 = 1000;
            // console.log("stakedAmount1 ==> ", stakedAmount1)
            let stakerID_0 = await Stacking.stake(stakedAmount1, TokenTestAddress, {from: stacker1});
            // console.log("stakerID_0 ==> ", stakerID_0)
            // console.log("pools[TokenTestAddress] ==> ", pools[CrowdVingAddress])
            // await expect(pools[TokenTestAddress].activePool).to.equal(true);
        });
    })

            // require (pools[_token], "This token isn't available.");
            // await expectRevert(Stacking.stake(stakedAmount1, CrowdVingAddress, {from: stacker1}), "This token isn't available.")

            // let receipt = await Stacking.addVoter(voter1, {from: owner})
            // expectEvent(receipt, "VoterRegistered", {_voterAddress: voter1});

/*
  context("Add Proposal Phase", function() {
    beforeEach(async function () {
        Stacking = await StackingInstance.new({from: owner});
        await Stacking.addVoter(voter1, {from: owner})
        await Stacking.addVoter(voter2, {from: owner})
        await Stacking.addVoter(voter3, {from: owner})
    })

      it('Test on require: not proposal registration state revert', async function () {
        await expectRevert(Stacking.addProposal("voter1Proposal", {from: voter1}), "You can't do this now")
      })

      it('Test on require: non voter cant propose', async function () {
        await Stacking.startProposalsRegistering({from: owner})
        await expectRevert(Stacking.addProposal("BadOwner", {from: owner}), "You're not a voter")
      })

      it('Test on require: voter cant propose nothing', async function () {
        await Stacking.startProposalsRegistering({from: owner})
        await expectRevert(Stacking.addProposal("", {from: voter2}),
            "Vous ne pouvez pas ne rien proposer")
      })

      it("Proposal pass, test on proposal description and getter getOneProposal", async function () {
        await Stacking.startProposalsRegistering({from: owner})
        await Stacking.addProposal("proposalVoter1", {from: voter1})
        const ID = 0;
        let voter1ProposalID = await Stacking.getOneProposal(ID , {from: voter1});
        expect(voter1ProposalID.description).to.be.equal("proposalVoter1");
      })

      it("Proposal pass, test on proposalRegistered event", async function () {
        await Stacking.startProposalsRegistering({from: owner})
        let receipt  = await Stacking.addProposal("proposalVoter1", {from: voter1})
        const ID = 0;
        expectEvent(receipt, "ProposalRegistered", {_proposalId: new BN(ID)});
      })

      it("1 Proposal pass, test on revert getter getOneProposal ID 1", async function () {
        await Stacking.startProposalsRegistering({from: owner})
        await Stacking.addProposal("proposalVoter1", {from: voter1})
        const ID = 1;
        await expectRevert.unspecified( Stacking.getOneProposal(ID , {from: voter1}));
      })

      it("Multiple Proposal pass : concat", async function () {
        await Stacking.startProposalsRegistering({from: owner})
        await Stacking.addProposal("proposalVoter1", {from: voter1})
        await Stacking.addProposal("proposalVoter2", {from: voter2})
        await Stacking.addProposal("proposalVoter3", {from: voter3})

        let voter1ProposalID = await Stacking.getOneProposal(0 , {from: voter1});
        let voter2ProposalID = await Stacking.getOneProposal(1 , {from: voter2});
        let voter3ProposalID = await Stacking.getOneProposal(2 , {from: voter3});

        expect(voter1ProposalID.description).to.be.equal("proposalVoter1");
        expect(voter2ProposalID.description).to.be.equal("proposalVoter2");
        expect(voter3ProposalID.description).to.be.equal("proposalVoter3");
      })

  })

  context("Voting Phase", function() {

    it('Test on numbers of proposals registered > 0', async function () {
      Stacking = await StackingInstance.new({from: owner});
      await Stacking.addVoter(voter1, {from: owner})
      await Stacking.addVoter(voter2, {from: owner})
      await Stacking.addVoter(voter3, {from: owner})
      await Stacking.startProposalsRegistering({from: owner})
      // await Stacking.addProposal("proposal 1", {from: voter1})
      // await Stacking.addProposal("proposal 2", {from: voter2})
      await Stacking.endProposalsRegistering({from: owner})
      await Stacking.startVotingSession({from: owner});
      await expectRevert(Stacking.setVote(0, {from: voter1}), "There are no proposal already registered");
    })



    beforeEach(async function () {
      Stacking = await StackingInstance.new({from: owner});
      await Stacking.addVoter(voter1, {from: owner})
      await Stacking.addVoter(voter2, {from: owner})
      await Stacking.addVoter(voter3, {from: owner})
      await Stacking.startProposalsRegistering({from: owner})
      await Stacking.addProposal("proposal 1", {from: voter1})
      await Stacking.addProposal("proposal 2", {from: voter2})
      await Stacking.endProposalsRegistering({from: owner})
    })

    it('Test on require: vote cant be done if not in the right worfkflow status', async function () {
      await expectRevert(Stacking.setVote(1,{from: voter1}), "You can't do this now")
    })

    it('Concat : Test on requires: non voter cant propose, voter cant propose nothing, and voter cant vote twice', async function () {
        await Stacking.startVotingSession({from: owner});
        await expectRevert(Stacking.setVote(0, {from: owner}), "You're not a voter");
        await expectRevert(Stacking.setVote(5, {from: voter1}), "Proposal not found");
        await Stacking.setVote(0, {from: voter1});
        await expectRevert(Stacking.setVote(1, {from: voter1}), "You have already voted");
      })

    it("vote pass: Voter 1 vote for proposal 1: Test on event", async function () {
      await Stacking.startVotingSession({from: owner})
      let VoteID = 0;

      let receipt = await Stacking.setVote(0, {from: voter1});
      expectEvent(receipt,'Voted', {_voter: voter1, _proposalId: new BN(VoteID)})
    })

    it("vote pass: Voter 1 vote for proposal 1: Test on voter attributes", async function () {
      await Stacking.startVotingSession({from: owner})
      let VoteID = 0;
      
      let voter1Objectbefore = await Stacking.getVoter(voter1, {from: voter1});
      expect(voter1Objectbefore.hasVoted).to.be.equal(false);

      await Stacking.setVote(0, {from: voter1});
      let voter1Object = await Stacking.getVoter(voter1, {from: voter1});

      expect(voter1Object.hasVoted).to.be.equal(true);
      expect(voter1Object.votedProposalId).to.be.equal(VoteID.toString());
    })
    
    it("vote pass: Voter 1 vote for proposal 1: Test on proposal attributes", async function () {
      await Stacking.startVotingSession({from: owner})
      let VoteID = 0;

      await Stacking.setVote(0, {from: voter1});
      let votedProposalObject = await Stacking.getOneProposal(VoteID, {from: voter1});

      expect(votedProposalObject.description).to.be.equal("proposal 1");
      expect(votedProposalObject.voteCount).to.be.equal('1');
    })

    it("multiple vote pass: concat", async function () {
      await Stacking.startVotingSession({from: owner})

      let receipt1 = await Stacking.setVote(0, {from: voter1});
      let receipt2 = await Stacking.setVote(1, {from: voter2});
      let receipt3 = await Stacking.setVote(1, {from: voter3});

      expectEvent(receipt1,'Voted', {_voter: voter1, _proposalId: new BN(0)})
      expectEvent(receipt2,'Voted', {_voter: voter2, _proposalId: new BN(1)})
      expectEvent(receipt3,'Voted', {_voter: voter3, _proposalId: new BN(1)})

      /////

      let voter1Object = await Stacking.getVoter(voter1, {from: voter1});
      let voter2Object = await Stacking.getVoter(voter2, {from: voter1});
      let voter3Object = await Stacking.getVoter(voter3, {from: voter1});

      expect(voter1Object.hasVoted).to.be.equal(true);
      expect(new BN(voter1Object.votedProposalId)).to.be.bignumber.equal(new BN(0));

      expect(voter2Object.hasVoted).to.be.equal(true);
      expect(new BN(voter2Object.votedProposalId)).to.be.bignumber.equal(new BN(1));
      
      expect(voter3Object.hasVoted).to.be.equal(true);
      expect(new BN(voter3Object.votedProposalId)).to.be.bignumber.equal(new BN(1));

      /////

      let votedProposalObject1 = await Stacking.getOneProposal(0, {from: voter1});
      let votedProposalObject2 = await Stacking.getOneProposal(1, {from: voter2});

      expect(votedProposalObject1.voteCount).to.be.equal('1');
      expect(votedProposalObject2.voteCount).to.be.equal('2');
    })
  })

  context("Tallying Phase & Get Winner", function() {

    it('Test on Current status and numbers of votes registered > 0', async function () {
      Stacking = await StackingInstance.new({from: owner});
      await Stacking.addVoter(voter1, {from: owner})
      await Stacking.addVoter(voter2, {from: owner})
      await Stacking.addVoter(voter3, {from: owner})
      await Stacking.startProposalsRegistering({from: owner})
      await Stacking.addProposal("voter1Proposal", {from: voter1})
      await Stacking.addProposal("voter2Proposal", {from: voter2})
      await Stacking.addProposal("voter3Proposal", {from: voter3})
      await Stacking.endProposalsRegistering({from: owner})
      await Stacking.startVotingSession({from: owner})
      await expectRevert(Stacking.getWinner(), "You can't do this now")
      await Stacking.endVotingSession({from: owner})
      await expectRevert(Stacking.tallyVotes({from: owner}), "There was no vote registered.")
    })


    beforeEach(async function () {
      Stacking = await StackingInstance.new({from: owner});
      await Stacking.addVoter(voter1, {from: owner})
      await Stacking.addVoter(voter2, {from: owner})
      await Stacking.addVoter(voter3, {from: owner})
      await Stacking.startProposalsRegistering({from: owner})
      await Stacking.addProposal("voter1Proposal", {from: voter1})
      await Stacking.addProposal("voter2Proposal", {from: voter2})
      await Stacking.addProposal("voter3Proposal", {from: voter3})
      await Stacking.endProposalsRegistering({from: owner})
      await Stacking.startVotingSession({from: owner})
      await Stacking.setVote(1, {from: voter1})
      await Stacking.setVote(2, {from: voter2})
      await Stacking.setVote(2, {from: voter3})
      })

      it('Test on require: tally vote cant be done if not in the right worfkflow status', async function () {
        await expectRevert(Stacking.tallyVotes({from: owner}), "You can't do this now") 
      })

      it('Test on require: not the owner', async function () {
        await Stacking.endVotingSession({from: owner})
        await expectRevert(
            Stacking.tallyVotes({from: voter1}),
            "Ownable: caller is not the owner")
      })

      it('Tally pass, test on event on workflow status', async function () {
        await Stacking.endVotingSession({from: owner})
        let receipt = await Stacking.tallyVotes({from: owner});
        expectEvent(receipt,'WorkflowStatusChange', {_previousStatus: new BN(4), _newStatus: new BN(5)})
      })

      it('Tally pass, test on winning proposal description and vote count', async function () {
        await Stacking.endVotingSession({from: owner})
        let receipt = await Stacking.tallyVotes({from: owner});
        let winningID = await Stacking.winningProposalId.call();
        let winningProposal = await Stacking.getOneProposal(winningID, {from:voter1});
        expect(winningProposal.description).to.equal('voter3Proposal');
        expect(winningProposal.voteCount).to.equal('2');

        expectEvent(receipt,'Winner', {_proposalId: new BN(winningID), _description: 'voter3Proposal', _voteCount: new BN(2)})
      })

      it('Get winner', async function () {
        await Stacking.endVotingSession({from: owner})
        const storedData = await Stacking.getWinner.call();
        const {0: winningProposalId, 1: proposalDescription, 2: proposalVoteCount} = storedData;

        // console.log("winningProposalId", winningProposalId);
        // console.log("proposalDescription", proposalDescription);
        // console.log("proposalVoteCount", proposalVoteCount);
        // expect(new BN(winningProposalId)).to.equal(new BN(2));
        // expect(proposalDescription).to.equal('voter3Proposal');
        // expect(proposalVoteCount).to.equal(new BN(2));

        assert.equal(winningProposalId, 2, "The value 2 was not stored (winningProposalId).");
        assert.equal(proposalDescription, 'voter3Proposal', "The proposal description was not stored.");
        assert.equal(proposalVoteCount, 2, "The value 2 was not stored (proposalVoteCount).");
      })
  })

  context("Worfklow status tests", function() {

    beforeEach(async function () {
        Stacking = await StackingInstance.new({from: owner});
    })

    // could do both test for every worflowStatus
    it('Generalisation: test on require trigger: not owner cant change workflow status', async function () {
        await expectRevert(
        Stacking.startProposalsRegistering({from: voter2}),
        "Ownable: caller is not the owner")
    })

    it('Generalisation: test on require trigger: cant change to next next workflow status', async function () {
        await expectRevert(Stacking.endProposalsRegistering({from: owner}), "You can't do this now")
    })

    it("Test on event: start proposal registering", async() => {
        let status = await Stacking.workflowStatus.call();
        expect(status).to.be.bignumber.equal(new BN(0));
        let startProposal = await Stacking.startProposalsRegistering({from:owner});
        expectEvent(startProposal, 'WorkflowStatusChange', {_previousStatus: new BN(0),_newStatus: new BN(1)});
    });

    it("Test on event: end proposal registering", async() => {
        await Stacking.startProposalsRegistering({from:owner});
        let endProposal = await Stacking.endProposalsRegistering({from:owner});
        expectEvent(endProposal, 'WorkflowStatusChange', {_previousStatus: new BN(1),_newStatus: new BN(2)});
    });

    it("Test on event: start voting session", async() => {
        await Stacking.startProposalsRegistering({from:owner});
        await Stacking.endProposalsRegistering({from:owner});
        let startVote = await Stacking.startVotingSession({from:owner});
        expectEvent(startVote, 'WorkflowStatusChange', {_previousStatus: new BN(2),_newStatus: new BN(3)});
    });

    it("Test on event: end voting session", async() => {
        await Stacking.startProposalsRegistering({from:owner});
        await Stacking.endProposalsRegistering({from:owner});
        await Stacking.startVotingSession({from:owner});
        let endVote = await Stacking.endVotingSession({from:owner});
        expectEvent(endVote, 'WorkflowStatusChange', {_previousStatus: new BN(3),_newStatus: new BN(4)});
    });
  })
*/
})