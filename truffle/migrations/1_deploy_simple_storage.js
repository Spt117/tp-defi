const StakingJB = artifacts.require("StakingJB");
const TokenTest = artifacts.require("TokenTest");

module.exports = function (deployer) {
  deployer.deploy(StakingJB);
  deployer.deploy(TokenTest);
};
