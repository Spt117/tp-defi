// SPDX-License-Identifier: MIT
pragma solidity 0.8.14;

import "../node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../node_modules/@openzeppelin/contracts/access/Ownable.sol";
import "../node_modules/@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./CrowdV.sol";

/**
 * @title Staking : a Staking Plateform !
 *
 * @author Anthony - Etienne - Jean-Baptiste
 *
 */

contract Staking is Ownable, CrowdV {
    uint256 priceTokenRewardInDollar = 1;
    // uint256 private totalStake;

    struct Token {
        bool activePool;
        address addressPrice; //Chainlink Pool
        uint256 APR;
        uint256 dateStop;
    }

    // Token address => active pool
    mapping(address => Token) public pools;

    struct Staker {
        // address addrStaker; // Address of wallet want stake
        // address token; // Address of token stake
        uint256 amount; // Amount token stake
        uint256 date; // Date of stake start
    }
    // Staker[] public stakers;
    // address token => address Staker => Informations Staker
    mapping(address => mapping(address => Staker)) stakers;

    // Save total amount stake by token address
    mapping(address => uint256) public totalStakes;
    
    // Save total amount with timestamp
    // token => block.timestamp => totalStakes
    mapping(address => mapping(uint256 => uint256)) stakingTime;


    // Events
    event NewPool(address tokenAddress, uint256 APR);
    event StopPool(address tokenAddress, uint256 date);
    event Stake(
        address sender,
        address tokenAddress,
        uint256 amount,
        uint256 date
    );
    event Unstake(
        address sender,
        address tokenAddress,
        uint256 amount,
        uint256 date
    );

    /**
     * @notice Make available token address to add pool
     * @dev Available only for owner
     * @param _token is token address
     * @param _apr is APR of the pool
     * @param _addressPrice is Chainlink pool
     */
    function addPool(
        address _token,
        uint256 _apr,
        address _addressPrice
    ) external onlyOwner {
        require(!pools[_token].activePool, "This token already exist.");

        pools[_token].activePool = true;
        pools[_token].APR = _apr;
        pools[_token].addressPrice = _addressPrice;

        emit NewPool(_token, _apr);
    }

    /**
     * @notice disable a pool
     * @dev Available only for owner
     * @param _token is token address
     */
    function stopPool(address _token) external onlyOwner {
        require(
            pools[_token].activePool,
            "Pool is not active or doesn't exist."
        );
        pools[_token].activePool = false;
        pools[_token].dateStop = block.timestamp;

        emit StopPool(_token, block.timestamp);
    }

    /**
     * @notice Stake fund into this contract
     * @param _amount to stake
     * @param _token to stake
     * @dev Emit event after stake
     */
    function stake(uint256 _amount, address _token) external {
        require(!isStaker(_token), "You already stake this pool"); //msg.sender is already a staker, faire une boucle sur le tableau ?
        require(_amount > 0, "The amount must be greater than zero.");
        require(pools[_token].activePool, "This token isn't available.");

        bool result = IERC20(_token).transferFrom(
            msg.sender,
            address(this),
            _amount
        );
        require(result, "Transfer from error");

        stakers[_token][msg.sender] = Staker(_amount, block.timestamp);

        stakingTime[_token][block.timestamp] =  totalStakes[_token] + _amount;

        totalStakes[_token] += _amount;

        emit Stake(msg.sender, _token, _amount, block.timestamp);
    }

    /**
     * @notice Add more token to a staking pool
     * @param _amount is the amount of token to add
     * @param _token is address token of the pool
     */
    function addStake(uint256 _amount, address _token) external {
        require(isStaker(_token), "You are not a staker");
        require(_amount > 0, "The amount must be greater than zero.");
        require(pools[_token].activePool, "This token isn't available.");

        bool result = IERC20(_token).transferFrom(
            msg.sender,
            address(this),
            _amount
        );
        require(result, "Transfer from error");

        stakers[_token][msg.sender].amount += _amount;

        stakingTime[_token][block.timestamp] =  totalStakes[_token] + _amount;

        totalStakes[_token] += _amount;

        claimRewards(_token);

        emit Stake(msg.sender, _token, _amount, block.timestamp);
    }

    /**
     * @notice Withdraw fund into this contract
     * @param _token to unstake
     * @param _amount number of token to unstake
     */
    function withdraw(uint256 _amount, address _token) external {
        require(isStaker(_token), "You are not a staker");
        require(_amount > 0, "The amount must be greater than zero.");
        require(pools[_token].activePool, "This token isn't available."); //pas sûr que ce soit nécessaire

        bool result = IERC20(_token).transfer(msg.sender, _amount);
        require(result, "Transfer from error");

        claimRewards(_token); // Récupérer les rewards en même temps

        stakers[_token][msg.sender].amount -= _amount;

        stakingTime[_token][block.timestamp] =  totalStakes[_token] - _amount;

        totalStakes[_token] -= _amount;

        emit Unstake(msg.sender, _token, _amount, block.timestamp);
    }

    /**
     * @notice Get price of token with Chainlink
     * @param _pairChainlinkAddress is the pool adress in $
     */
    function getLatestPrice(address _pairChainlinkAddress)
        private
        view
        returns (uint256)
    {
        AggregatorV3Interface priceFeed = AggregatorV3Interface(
            _pairChainlinkAddress
        );
        (
            ,
            /*uint80 roundID*/
            int256 price, /*uint startedAt*/ /*uint timeStamp*/ /*uint80 answeredInRound*/
            ,
            ,

        ) = priceFeed.latestRoundData();

        return uint256(price);
    }

    /**
     * @notice Calculate rewards
     * @dev tokenPrice use Chainlink Oracle
     * @param _token is the token of pool to calculate rewards
     */
    function calculateReward(address _token) public view returns (uint256) {
        require(isStaker(_token), "You are not a staker");

        uint256 rewardsperseconds = ((pools[_token].APR) * 10**8) /
            (365 * 24 * 3600);

        uint256 rewardsperstakers = (stakers[_token][msg.sender].amount * 100) /
            totalStakes[_token];

        uint256 rewardsearnedperseconds = rewardsperseconds * rewardsperstakers;

        uint256 tokenPrice = 1; //getLatestPrice(pools[_token].addressPrice);

        uint256 rewardsInDollar = tokenPrice * rewardsearnedperseconds;

        if (pools[_token].activePool) {
            return ((block.timestamp - stakers[_token][msg.sender].date) *
                rewardsInDollar); // il faudra prendre en compte le 10**8 et le 10**X de Chainlink
        }
        return ((pools[_token].dateStop - stakers[_token][msg.sender].date) *
            rewardsInDollar); // il faudra prendre en compte le 10**8 et le 10**X de Chainlink
    }

    /**
     * @notice Claim your rewards
     * @dev Available only for stakers who have rewards to claim
     * @param _token is token of the pool to claim rewards
     */
    function claimRewards(address _token) public {
        require(isStaker(_token), "You are not a staker");

        uint256 amoutToClaim = calculateReward(_token) /
            priceTokenRewardInDollar;
        stakers[_token][msg.sender].date = block.timestamp; //Remettre à 0 le timestamp
        _mint(msg.sender, amoutToClaim);
    }

    /**
     * @notice Check amount of a stacked pool from msg.sender
     * @param _token is address token of the pool to check
     */
    function getStaking(address _token) external view returns (uint256) {
        return stakers[_token][msg.sender].amount;
    }

    /**
     * @notice Check if msg.sender is a staker of a pool
     * @dev Can be used to show the staked pools on the Dapp
     * @param _token is address token of a pool
     */
    function isStaker(address _token) public view returns (bool) {
        if (stakers[_token][msg.sender].amount > 0) {
            return true;
        }
        return false;
    }
}
