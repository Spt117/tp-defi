// SPDX-License-Identifier: MIT
pragma solidity 0.8.14;

import '../node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol';

contract StakingE {

	IERC20 public stakingToken;

	// How much they staked
	mapping(address => uint256) public balances;
	
	uint256 private totalStake;
	uint256 public rewardPerTokenStake;

	constructor (address _stakingToken) {
		stakingToken = IERC20(_stakingToken);
	}
	
	/**
	 * @notice Stake fund into this contract
	 * @param _amount to stake
	 */
	function stake (uint256 _amount) external {
		require (_amount > 0, 'The amount must be greater than zero.');
		bool result = stakingToken.transferFrom(msg.sender, address(this), _amount);
		require (result, 'Transfer from error');
		balances[msg.sender] += _amount;
		totalStake += _amount;
	}

	/**
	 * @notice Withdraw fund into this contract
	 * @param _amount to stake
	 */
	function withdraw (uint _amount) external {
		require (_amount > 0, 'The amount must be greater than zero.');
		bool result = stakingToken.transfer(msg.sender, _amount);
		require (result, 'Transfer from error');
		balances[msg.sender] -= _amount;
		totalStake -= _amount;
	}
}
