// SPDX-License-Identifier: MIT
pragma solidity >=0.8.1 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CrowdV : an ERC20 reward Token for Staking Plateforme !
 *
 * @author Anthony - Etienne - Jean-Baptiste
 *
 */

contract CrowdV is ERC20, Ownable {

    constructor() ERC20("CrowdV", "CRDV") {}

}