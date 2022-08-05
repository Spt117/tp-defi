// SPDX-License-Identifier: MIT
pragma solidity 0.8.14;

import "../node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol";


/**
 * @title CrowdV : an ERC20 reward Token for Staking Plateform !
 *
 * @author Anthony - Etienne - Jean-Baptiste
 *
 */

contract CrowdV is ERC20 {

    constructor() ERC20("CrowdV", "CRDV") {}

}