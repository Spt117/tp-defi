// SPDX-License-Identifier: MIT
pragma solidity 0.8.14;

import "../node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../node_modules/@openzeppelin/contracts/access/Ownable.sol";
import "../node_modules/@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./CrowdV.sol";

/**
 * @title Staking : a Staking Plateforme !
 *
 * @author Anthony - Etienne - Jean-Baptiste
 *
 */

contract StakingJB is Ownable, CrowdV {
    uint256 priceTokenRewardInDollar = 1;
    // uint256 private totalStake;

    struct Token {
        bool activePool;
        uint256 APR;
        address addressPrice; //Chainlink Pool
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
    mapping(address => uint256) public totalStakes;

    // Events
    event NewPool(address tokenAddress, uint256 APR);
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
     * @dev Alyra
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

    // function stopPool(address _token) external onlyOwner {
    //     require(pools[_token].activePool, "Pool is not active or doesn't exist.");
    //     pools[_token].activePool = false;
    // }

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

        Staker memory staker;
        staker.addrStaker = msg.sender;
        staker.token = _token;
        staker.amount = _amount;
        staker.date = block.timestamp;
        stakers.push(staker);

        totalStakes[_token] += _amount;

        emit Stake(msg.sender, _token, _amount, block.timestamp);
    }

    /**
     * @notice Withdraw fund into this contract
     * @param _token to unstake
     * @param _amount number of token to unstake
     */
    function withdraw(address _token, uint256 _amount) external {
        require(isStaker(_token), "You are not a staker");
        require(pools[_token].activePool, "This token isn't available."); //pas sûr que ce soit nécessaire

        uint256 id;
        for (uint256 i = 0; i < stakers.length; i++) {
            if (
                stakers[i].addrStaker == msg.sender &&
                _token == stakers[i].token
            ) {
                i = id;
            }
        }
        require(stakers[id].amount >= _amount, "You don't have this amount");

        bool result = IERC20(_token).transfer(msg.sender, _amount);
        require(result, "Transfer from error");

        claimRewards(_token); // Récupérer les rewards en même temps

        stakers[id].amount -= _amount;
        
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
     * @param _id is stakers id
     */
    function calculateReward(uint256 _id) public view returns (uint256) {
        // require(0<stakers[id].amount, "You have not stake this token")
        uint256 rewardsperseconds = ((pools[stakers[_id].token].APR) * 10**8) /
            (365 * 24 * 3600);

        uint256 rewardsperstakers = (stakers[_id].amount * 100) /
            totalStakes[stakers[_id].token];

        uint256 rewardsearnedperseconds = rewardsperseconds * rewardsperstakers;

        uint256 tokenPrice = getLatestPrice(
            pools[stakers[_id].token].addressPrice
        );

        uint256 rewardsInDollar = tokenPrice * rewardsearnedperseconds;

        uint256 rewardstoclaim = (block.timestamp - stakers[_id].date) *
            rewardsInDollar; // il faudra prendre en compte le 10**8 et le 10**X de Chainlink

        return rewardstoclaim;
    }

    /**
     * @notice Claim your rewards
     * @dev Available only for stakers who have rewards to claim
     * @param _token is token of the pool to claim rewards
     */
    function claimRewards(address _token) public {
        uint256 id;
        for (uint256 i = 0; i < stakers.length; i++) {
            if (
                stakers[i].addrStaker == msg.sender &&
                _token == stakers[i].token
            ) {
                i = id;
            }
        }

        uint256 amoutToClaim = calculateReward(id) / priceTokenRewardInDollar;
        stakers[id].date = block.timestamp; //Remettre à 0 le timestamp
        CrowdV.mint(amoutToClaim);
    }

    /**
     * @notice Check if msg.sender is a staker of a pool
     * @dev Can be used to show the staked pools on the Dapp
     * @param _token is address token of a pool
     */
    function isStaker(address _token) public view returns (bool) {
        for (uint256 i = 0; i < stakers.length; i++) {
            if (
                stakers[i].addrStaker == msg.sender &&
                _token == stakers[i].token
            ) {
                return true;
            }
        }
        return false;
    }

    /**
     * @notice Add more token to a staking pool
     * @param _amount is the amount of token to add
     * @param _token is address token of the pool
     */
    function addStake(uint256 _amount, address _token) external {
        require(isStaker(_token), "You are not a staker");

        uint256 id;
        for (uint256 i = 0; i < stakers.length; i++) {
            if (
                stakers[i].addrStaker == msg.sender &&
                _token == stakers[i].token
            ) {
                i = id;
            }
        }

        bool result = IERC20(_token).transferFrom(
            msg.sender,
            address(this),
            _amount
        );
        require(result, "Transfer from error");

        stakers[id].amount += _amount;
        totalStakes[_token] += _amount;

        claimRewards(_token);

        emit Stake(msg.sender, _token, _amount, block.timestamp);
    }
}
