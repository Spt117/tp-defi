// SPDX-License-Identifier: MIT
pragma solidity 0.8.14;

import "../node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TokenTest is ERC20 {

    constructor() ERC20("TokenTest", "TT") {
        _mint(msg.sender, 1000000000000000000000);
    }
}