// SPDX-License-Identifier: MIT
pragma solidity 0.8.14;

import "../node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../node_modules/@openzeppelin/contracts/access/Ownable.sol";
import "../node_modules/@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract StakingE is Ownable {
    uint256 private totalStake;

    struct Token {
        bool activePool;
        uint256 APR;
    }

    // Token address => active pool
    mapping(address => Token) public pools;

    struct Staker {
        address addrStaker; // Address of wallet want stake
        address token; // Address of token stake
        uint256 amount; // Amount token stake
        uint256 date; // Date of stake start
    }
    Staker[] public stakers;

    // Save total amount stake by token address
    // struct TotalStake {
    //     uint256 amount;
    // }
    mapping(address => uint256) totalStakes;

    // // Save total amount stake by token address
    // struct testStakers {
    //     uint idStaker;
    //     address token;
    //      }
    // mapping (address => testStakers) ;

    // Events
    event NewPool(address tokenAddress, uint256 APR);
    event Stake(
        address sender,
        address tokenAddress,
        uint256 amount,
        uint256 date,
        uint256 id
    );

    /**
     * @notice Stake fund into this contract
     * @param _amount to stake
     * @param _token to stake
     * @dev Emit event after stake
     */
    function stake(uint256 _amount, address _token) external {
        require(_amount > 0, "The amount must be greater than zero.");
        require(pools[_token].activePool, "This token isn't available.");

        bool result = IERC20(_token).transferFrom(
            msg.sender,
            address(this),
            _amount
        );
        require(result, "Transfer from error");

        Staker memory staker;
        staker.addrStaker = msg.sender;
        staker.token = _token;
        staker.amount = _amount;
        staker.date = block.timestamp;
        stakers.push(staker);

        totalStakes[_token] += _amount;

        emit Stake(
            msg.sender,
            _token,
            _amount,
            block.timestamp,
            stakers.length - 1
        );
    }

    /**
     * @notice Withdraw fund into this contract
     * @param _token to unstake
     * @param _id from the staker
     */

    function withdraw(uint256 _id, address _token) external {
        require(
            stakers[_id].addrStaker == msg.sender,
            "You are not authorized to withdraw this funds."
        );
        require(
            stakers[_id].amount > 0,
            "The amount must be greater than zero."
        );
        require(pools[_token].activePool, "This token isn't available.");
        bool result = IERC20(_token).transfer(msg.sender, stakers[_id].amount);
        require(result, "Transfer from error");

        delete stakers[_id];

        totalStakes[_token] -= stakers[_id].amount;
    }

    /**
     * @notice Make available token address to add pool
     * @dev Available only for owner
     * @param _token is token address
     * @param _apr is APR of the pool
     * @dev Alyra
     */
    function addPool(address _token, uint256 _apr) external onlyOwner {
        require(!pools[_token].activePool, "This token already exist.");
        pools[_token].activePool = true;
        pools[_token].APR = _apr;

        emit NewPool(_token, _apr);
    }

    // function calculReward() external onlyOwner {
    //     // for (uint256 i = 0; i < stakers.length; i++) {}
    // // nombredestakeurs
    // // ((montantparstakeur * duréededépot)/fréquencedenvoiedesrewards) * montantrewards
    // // montantotalstaké
    // ((s_balances[account] * (rewardPerToken() - s_userRewardPerTokenPaid[account])) /
    //             1e18) + s_rewards[account];

    // }

    // function rewardPerToken() public view returns (uint256) {
    //     if (s_totalSupply == 0) {
    //         return s_rewardPerTokenStored;
    //     }
    //     return
    //         s_rewardPerTokenStored +
    //         (((block.timestamp - s_lastUpdateTime) * REWARD_RATE * 1e18) / s_totalSupply);
    // }

    function calculateReward(uint256 id) public view returns(uint256) {
        uint256 rewardsperseconds;
        rewardsperseconds = ( pools[stakers[id].token].APR) / (365 * 24 * 3600);
        
        uint256 rewardsperstakers;
        rewardsperstakers = stakers[id].amount * 100 / totalStakes[stakers[id].token] ;

        uint256 rewardsearnedperseconds = rewardsperseconds * rewardsperstakers ;
        
        return rewardsearnedperseconds;
    }

    
}
