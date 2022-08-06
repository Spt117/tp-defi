// SPDX-License-Identifier: MIT
pragma solidity 0.8.14;

import "../node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../node_modules/@openzeppelin/contracts/access/Ownable.sol";
import "../node_modules/@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./CrowdV.sol";

/**
 * @title Staking : a Staking Plateform !
 * @author Anthony - Etienne - Jean-Baptiste
 */

contract Staking is Ownable, CrowdV {
    //Information about the token
    struct Token {
        bool activePool;
        address addressPrice; //Chainlink Pool
        uint256 dateStop;
        uint128 APR;
        uint128 totalStakes;
    }

    // Token address => active pool
    mapping(address => Token) pools;

    struct Staker {
        uint128 amount; // Amount token stake
        uint256 date; // Date of stake start
    }

    // address token => address Staker => Informations Staker
    mapping(address => mapping(address => Staker)) stakers;

    // Save total amount with timestamp
    struct majStackingPool {
        uint256 blockDate;
        uint128 stakingTotalPool;
    }
    mapping(address => majStackingPool[]) stakingTimes;

    // Events
    event NewPool(address tokenAddress, uint256 APR);
    event StopPool(address tokenAddress, uint256 date);
    event Stake(
        address sender,
        address tokenAddress,
        uint128 amount,
        uint256 date
    );
    event Unstake(
        address sender,
        address tokenAddress,
        uint128 amount,
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
        uint128 _apr,
        address _addressPrice
    ) external onlyOwner {
        require(!pools[_token].activePool, "Pool active");

        pools[_token] = Token(true, _addressPrice, 0, _apr, 0);

        emit NewPool(_token, _apr);
    }

    /**
     * @notice disable a pool
     * @dev Available only for owner
     * @param _token is token address
     */
    function stopPool(address _token) external onlyOwner {
        require(pools[_token].activePool, "Pool not active");
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
    function stake(uint128 _amount, address _token) external {
        require(_amount > 0, "Amount can't be zero");
        require(pools[_token].activePool, "Pool not active");

        bool result = IERC20(_token).transferFrom(
            msg.sender,
            address(this),
            _amount
        );
        require(result, "Transfer from error");

        if (isStaker(_token)){claimRewards(_token);} // Récupérer les rewards en même temps

        stakers[_token][msg.sender]= Staker(stakers[_token][msg.sender].amount + _amount, block.timestamp);

        majStackingPool memory maj = majStackingPool(
            block.timestamp,
            pools[_token].totalStakes + _amount
        );
        stakingTimes[_token].push(maj);

        pools[_token].totalStakes += _amount;

        emit Stake(msg.sender, _token, _amount, block.timestamp);
    }

    /**
     * @notice Withdraw fund into this contract
     * @param _token to unstake
     * @param _amount number of token to unstake
     */
    function withdraw(uint128 _amount, address _token) external {
        require(isStaker(_token), "Not a staker");
        require(_amount > 0, "Amount can't be zero");
        require(
            _amount <= stakers[_token][msg.sender].amount,
            "Don't have so many tokens"
        );
        require(pools[_token].activePool, "Pool not active");

        bool result = IERC20(_token).transfer(msg.sender, _amount);
        require(result, "Transfer from error");

        claimRewards(_token); // Récupérer les rewards en même temps

        stakers[_token][msg.sender]= Staker(stakers[_token][msg.sender].amount - _amount, block.timestamp);

        majStackingPool memory maj = majStackingPool(
            block.timestamp,
            pools[_token].totalStakes - _amount
        );
        stakingTimes[_token].push(maj);

        pools[_token].totalStakes -= _amount;

        emit Unstake(msg.sender, _token, _amount, block.timestamp);
    }

    /**
     * @notice Get price of token with Chainlink
     * @param _pairChainlinkAddress is the pool adress in $
     */
    function _getLatestPrice(address _pairChainlinkAddress)
        private
        view
        returns (uint256)
    {
        AggregatorV3Interface priceFeed = AggregatorV3Interface(
            _pairChainlinkAddress
        );
        (, int256 price, , , ) = priceFeed.latestRoundData();

        return uint256(price);
    }

    /**
     * @notice Calculate rewards
     * @dev tokenPrice use Chainlink Oracle
     * @param _token is the token of pool to calculate rewards
     * @return rewards in dollars
     */
    function calculateReward(address _token) public view returns (uint256) {
        require(isStaker(_token), "Not a staker");
        uint256 tokenPrice = _getLatestPrice(pools[_token].addressPrice);
        uint256 aprPerSeconds = ((pools[_token].APR) * 10**8) /
            (365 * 24 * 3600);
        uint256 rewardspartoOfPool;
        uint256 x = stakingTimes[_token].length;
        uint256 blockIndex;
        for (uint256 i = 0; i < x; i++) {
            if (
                stakingTimes[_token][i].blockDate ==
                stakers[_token][msg.sender].date
            ) {
                blockIndex = i;
            }
        }

        if (pools[_token].activePool) {
            if (x == 1) {
                rewardspartoOfPool += (block.timestamp -
                    stakers[_token][msg.sender].date);
            } else {
                for (uint256 i = blockIndex; i < x - 1; i++) {
                    rewardspartoOfPool +=
                        ((stakingTimes[_token][i + 1].blockDate -
                            stakingTimes[_token][i].blockDate) *
                            stakers[_token][msg.sender].amount) /
                        stakingTimes[_token][i].stakingTotalPool;
                }
                rewardspartoOfPool +=
                    ((block.timestamp - stakingTimes[_token][x - 1].blockDate) *
                        stakers[_token][msg.sender].amount) /
                    pools[_token].totalStakes;
            }
        } else {
            if (x == 1) {
                rewardspartoOfPool += (pools[_token].dateStop -
                    stakers[_token][msg.sender].date);
            } else {
                for (uint256 i = blockIndex; i < x - 1; i++) {
                    rewardspartoOfPool +=
                        ((stakingTimes[_token][i + 1].blockDate -
                            stakingTimes[_token][i].blockDate) *
                            stakers[_token][msg.sender].amount) /
                        stakingTimes[_token][i].stakingTotalPool;
                }
                rewardspartoOfPool +=
                    ((pools[_token].dateStop -
                        stakingTimes[_token][x - 1].blockDate) *
                        stakers[_token][msg.sender].amount) /
                    pools[_token].totalStakes;
            }
        }

        return rewardspartoOfPool * tokenPrice * aprPerSeconds;
    }

    /**
     * @notice Claim your rewards
     * @dev Available only for stakers who have rewards to claim
     * @param _token is token of the pool to claim rewards
     */
    function claimRewards(address _token) public {
        require(isStaker(_token), "Not a staker");

        uint256 priceReward = 1; //fixé pour le contrat

        uint256 amoutToClaim = calculateReward(_token) / priceReward;
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

    /**
     * @notice Check total amount of a stacked pool
     * @param _token is address token
     */
    function getTotalStaking(address _token) external view returns (uint256) {
        return pools[_token].totalStakes;
    }
}