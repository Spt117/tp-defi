// SPDX-License-Identifier: MIT
pragma solidity 0.8.14;

import "../node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../node_modules/@openzeppelin/contracts/access/Ownable.sol";
import "../node_modules/@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract StakingE is Ownable {
	
	uint256 private totalStake;

	// Token address => active pool
	mapping (address => bool) pools;

	struct Staker {
		address addrStaker; // Address of wallet want stake
		address token; // Address of token stake
		uint256 amount; // Amount token stake
		uint256 date; // Date of stake start
	}
	Staker[] public stakers;

	// Save total amount stake by token address
	struct TotalStake { uint256 amount; }
	mapping (address => TotalStake) totalStakes;

	// Events
	event NewPool(address tokenAddress); 

	
	/**
	 * @notice Stake fund into this contract
	 * @param _amount to stake
	 * @param _token to stake
	 */
	function stake (uint256 _amount, address _token) external {
		require (_amount > 0, "The amount must be greater than zero.");
		require (pools[_token], "This token isn't available.");
		
		bool resultApprove = IERC20(_token).approve(address(this), _amount);
        require (resultApprove, "Approve from error");
		bool result = IERC20(_token).transferFrom(msg.sender, address(this), _amount);
		require (result, "Transfer from error");

		Staker memory staker;
		staker.addrStaker = msg.sender;
		staker.token = _token;
		staker.amount = _amount;
		staker.date = block.timestamp;

		stakers.push(staker);

		totalStakes[_token].amount += _amount;
	}


	function approveForStake (address _token, uint256 _amount) external returns(bool) {
       bool resultApprove = IERC20(_token).approve(address(this), _amount);
       require (resultApprove, "Approve from error");

       return resultApprove;
    }


	/**
	 * @notice Withdraw fund into this contract
	 * @param _amount to stake
	 */
	function withdraw (uint256 _id, uint _amount, address _token) external {
		require (_amount > 0, "The amount must be greater than zero.");
		bool result = stakingToken.transfer(msg.sender, _amount);
		require (result, "Transfer from error");

		delete stakers[_id];

		totalStakes[_token].amount -= _amount;
	}


	/**
	 * @notice Make available token address to add pool
	 * @dev Available only for owner
	 * @param _token is token address
	 * @dev Alyra
	 */
	function addPool (address _token) external onlyOwner {
		require (!pools[_token], "This token already exist.");
		pools[_token] = true;

		emit NewPool(_token);
	}
}
