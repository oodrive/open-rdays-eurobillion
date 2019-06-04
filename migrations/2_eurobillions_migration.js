var EuroBillions = artifacts.require("./EuroBillions.sol");
var HackEuroBillions = artifacts.require("./HackEuroBillions.sol");

module.exports = function(deployer) {
  deployer.deploy(EuroBillions)
    .then( () => deployer.deploy(HackEuroBillions, EuroBillions.address));
};
