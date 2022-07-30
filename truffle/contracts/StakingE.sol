// SPDX-License-Identifier: MIT
pragma solidity 0.8.14;

import "../node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../node_modules/@openzeppelin/contracts/access/Ownable.sol";
import "../node_modules/@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract StakingE is Ownable {

	IERC20 public stakingToken;
	
	uint256 private totalStake;

	struct Pool {
		address token;
		uint256 yield;
		int priceFeed;
	}
	Pool[] public pools;

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

	constructor (address _stakingToken) {
		stakingToken = IERC20(_stakingToken);
	}
	
	/**
	 * @notice Stake fund into this contract
	 * @param _amount to stake
	 */
	function stake (uint256 _amount, address _token) external {
		require (_amount > 0, "The amount must be greater than zero.");
		bool result = stakingToken.transferFrom(msg.sender, address(this), _amount);
		require (result, "Transfer from error");

		Staker memory staker;
		staker.addrStaker = msg.sender;
		staker.token = _token;
		staker.amount = _amount;
		staker.date = block.timestamp;

		stakers.push(staker);

		totalStakes[_token].amount += _amount;
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


	function addPool (address _token, uint256 _yield) external onlyOwner {
		//(
		// 	/*uint80 roundID*/,
		// 	int price,
		// 	/*uint startedAt*/,
		// 	/*uint timeStamp*/,
		// 	/*uint80 answeredInRound*/
        // ) = AggregatorV3Interface(_token).latestRoundData();

		Pool memory pool;
		pool.token = _token;
		pool.yield = _yield;
		// pool.priceFeed = price;

		pools.push(pool);
	}
}
