pragma solidity ^0.4.0;

contract EuroBillions {
    // Contract members will be store in "Storage"
    address public _owner;

    // Store user names and user balances.
    mapping(address => string) public userNames;
    mapping(address => uint) public userBalances;

    // Event raised when a player win or loose.
    event playEvent(uint date, address player, uint playerBet, uint playerNumber, uint winingNumber);

    // Constructor code is executed only once when the contract is deployed.
    constructor () public {
        _owner = msg.sender;
    }

    // Modifier are used to decorate a function with a pre/post processing code.
    modifier ownerOnly {
        require(msg.sender == _owner, "This function can be called only by the contract owner.");
        _;  // flow of execution to the original function code
    }

    // Casino money can be withdraw only by the owner.
    function ownerWithdraw(uint value) public ownerOnly {
        msg.sender.transfer(value);
    }

    // Player can withdraw money.
    function userWithdraw(uint value) public {
        require(userBalances[msg.sender] >= value, "Not enough money on user account.");
        userBalances[msg.sender] -= value;
        msg.sender.transfer(value);
    }

    // Return all money send by all users.
    function getBalance() public view returns (uint) {
        return address(this).balance;
    }

    // This function is used to register a new user and deposit initial funds.
    function register(string memory pseudo) public payable {
        require(bytes(pseudo).length > 0, "Pseudo cannot be empty.");
        require(bytes(userNames[msg.sender]).length == 0, "Cannot register twice.");
        require(msg.value > 0.1 ether, "Registration deposit is too small.");
        
        userBalances[msg.sender] = msg.value;
        userNames[msg.sender] = pseudo;
    }

    // Let's play!
    function play(uint playerBet, uint playerNumber) public {
        require(userBalances[msg.sender] >= playerBet, "Not enough money on user account.");
        require(playerNumber <= 36, "Guessed value should be between 0 and 36.");

        // Smart contract execution is deterministic (needed to validate blocks by peers). Random is "simulated" with previous block hash.
        uint256 blockValue = uint256(blockhash(block.number-1));
        uint winingNumber = (blockValue % 37);
        
        if (winingNumber == playerNumber) {
            userBalances[msg.sender] += 35 * playerBet; // Player wins!
        }
        else {
            userBalances[msg.sender] -= playerBet;      // Player looses! Too bad, the contract will keep the money!
        }

        // Raise an event with game results.
        emit playEvent(now, msg.sender, playerBet, playerNumber, winingNumber);
    }
    
    // Callback function receives the Ether and transfers to the contract address.
    function () public payable {
        userBalances[msg.sender] += msg.value;
    }
}