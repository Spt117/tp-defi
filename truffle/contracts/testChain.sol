// SPDX-License-Identifier: MIT
pragma solidity 0.8.14;

import "../node_modules/@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";


{
        
        function getLatestPrice(address _pairChainlinkAddress) public view returns (uint256) {
        AggregatorV3Interface priceFeed = AggregatorV3Interface( _pairChainlinkAddress );
        (
            /*uint80 roundID*/,
            int price,
            /*uint startedAt*/,
            /*uint timeStamp*/,
            /*uint80 answeredInRound*/
        ) = priceFeed.latestRoundData();
        
        return uint256(price);
    }
}