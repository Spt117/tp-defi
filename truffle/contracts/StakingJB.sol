// SPDX-License-Identifier: MIT
pragma solidity 0.8.14;

import "../node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../node_modules/@openzeppelin/contracts/access/Ownable.sol";
import "../node_modules/@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./CrowdV.sol";

/**
 * @title StakingE : a Staking Plateforme !
 *
 * @author Anthony - Etienne - Jean-Baptiste
 *
 */

contract StakingE is Ownable, CrowdV {
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
        uint256 date,
        uint256 id
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
            stakers.length - 1 // id du Staker
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
        claimRewards(_id);   // Récupérer les rewards en même temps
        delete stakers[_id];

        totalStakes[_token] -= stakers[_id].amount;
    } //FONTION A VERIFIER + AJOUTER EVENEMENT

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
     * @param id is stakers id
     */
    function calculateReward(uint256 id) public view returns (uint256) {
        // require(0<stakers[id].amount, "You have not stake this token")
        uint256 rewardsperseconds = ((pools[stakers[id].token].APR) * 10**8) /
            (365 * 24 * 3600);

        uint256 rewardsperstakers = (stakers[id].amount * 100) /
            totalStakes[stakers[id].token];

        uint256 rewardsearnedperseconds = rewardsperseconds * rewardsperstakers;

        uint256 tokenPrice = getLatestPrice(
            pools[stakers[id].token].addressPrice
        );

        uint256 rewardsInDollar = tokenPrice * rewardsearnedperseconds;

        uint256 rewardstoclaim = (block.timestamp - stakers[id].date) *
            rewardsInDollar; // il faudra prendre en compte le 10**8 et le 10**X de Chainlink

        return rewardstoclaim;
    }

    /**
     * @notice Claim your rewards
     * @dev Available only for stakers who have rewards to claim
     * @param id is stakers id
     */
    function claimRewards(uint256 id) public {
        require(stakers[id].addrStaker == msg.sender, "This is not your id.");
        uint256 amoutToClaim = calculateReward(id) / priceTokenRewardInDollar;
        stakers[id].date = block.timestamp; //Remettre à 0 le timestamp
        CrowdV.mint(amoutToClaim);
    }
}
