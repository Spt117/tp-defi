// SPDX-License-Identifier: MIT
pragma solidity 0.8.14;

contract StackingPool {
    struct Staker {
        uint128 amount; // Amount token stake
        uint256 date; // Date of stake start
    }
    // address token => address Staker => Informations Staker
    mapping(address => mapping(address => Staker)) public stakers;

    // Save total amount with timestamp
    struct majStackingPool {
        uint256 blockDate;
        uint128 stakingTotalPool;
    }
    //address token => array majStackingPool
    mapping(address => majStackingPool[]) stakingTimes;

    /**
     * @notice Update Staker Struct when he stake
     * @dev called in function stake
     * @param _amount is the amount to stake
     * @param _token is token address
     */
    function upAmountStaker(uint128 _amount, address _token) internal {
        stakers[_token][msg.sender] = Staker(
            stakers[_token][msg.sender].amount + _amount,
            block.timestamp
        );
    }

    /**
     * @notice Update Staker Struct when he withdraw
     * @dev called in function withdraw
     * @param _amount is the amount to stake
     * @param _token is token address
     */
    function downAmountStaker(uint128 _amount, address _token) internal {
        stakers[_token][msg.sender] = Staker(
            stakers[_token][msg.sender].amount - _amount,
            block.timestamp
        );
    }

    /**
     * @notice Update majStackingPool when there is a stake
     * @dev called in function stake
     * @param _amount is the amount to stake
     * @param _token is token address
     */
    function upStackingPool(uint128 _amount, address _token) internal {
        uint128 lastTotalStake;
        if (stakingTimes[_token].length == 0) {
            lastTotalStake = 0;
        } else {
            lastTotalStake = stakingTimes[_token][
                stakingTimes[_token].length - 1
            ].stakingTotalPool;
        }
        majStackingPool memory maj = majStackingPool(
            block.timestamp,
            lastTotalStake + _amount
        );
        stakingTimes[_token].push(maj);
    }

    /**
     * @notice Update majStackingPool when there is a withdraw
     * @dev called in function withdrawF
     * @param _amount is the amount to stake
     * @param _token is token address
     */
    function downStackingPool(uint128 _amount, address _token) internal {
        uint128 lastTotalStake = stakingTimes[_token][
            stakingTimes[_token].length - 1
        ].stakingTotalPool;
        majStackingPool memory maj = majStackingPool(
            block.timestamp,
            lastTotalStake - _amount
        );
        stakingTimes[_token].push(maj);
    }
}
