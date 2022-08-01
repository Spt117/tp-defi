const Staking = artifacts.require("Staking");
const TokenTest = artifacts.require("TokenTest");

module.exports = function (deployer) {
  deployer.deploy(Staking);
  deployer.deploy(TokenTest);
};
