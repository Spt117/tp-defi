// SPDX-License-Identifier: MIT
pragma solidity >=0.8.1 <0.9.0;

import "../node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title CrowdV : an ERC20 reward Token for Staking Plateforme !
 *
 * @author Anthony - Etienne - Jean-Baptiste
 *
 */

contract CrowdV is ERC20 {
    constructor() ERC20("CrowdV", "CRDV") {}

    /**
     * @dev Stakers mint their rewards
     * @param _staker is staker's address
     * @param _amount is amout's rewards
     */
    function mint(address _staker, uint256 _amount) public {
        _mint(_staker, _amount);
    }
}
