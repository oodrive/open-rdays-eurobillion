const OneEther = 1000000000000000000; // Value of one Ether in Wei

App = {
  web3Provider: null,
  contracts: {},

  init: async function() {
    return await App.initWeb3();
  },

  initWeb3: async function() {
    if (typeof web3 !== 'undefined') {
      // If a web3 instance is already provided by Meta Mask.
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else {
      // Specify default instance if no web3 instance provided
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
      web3 = new Web3(App.web3Provider);
    }

    App.initEasterEgg();
    return App.initContract();
  },

  initEasterEgg: function() {
    // Konami code for hacking!
    //Up, up, down, down, left, right, left, right, B, A
    var k = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65],
    n = 0;
    App.HackerMode = false;
    var cheatButton = $("#cheatButton");
    cheatButton.click( function() {
      App.cheatCasino();
    });

    $(document).keydown(function (e) {
        if (e.keyCode === k[n++]) {
            if (n === k.length) {
              App.HackerMode = !App.HackerMode;
              if (App.HackerMode) {
                cheatButton.css('background-color','red')
                cheatButton.show();
              }
              else {
                cheatButton.hide();
              }
              n = 0;
              return false;
            }
        }
        else {
            n = 0;
        }
    });
  },

  initContract: function() {
    $("#betResults").empty();
   
    $.getJSON("HackEuroBillions.json", function(hackEuroBillions) {
      // Instantiate a new truffle contract from the artifact
      App.contracts.HackEuroBillions = TruffleContract(hackEuroBillions);

      // Connect provider to interact with contract
      App.contracts.HackEuroBillions.setProvider(App.web3Provider);
    }).then(function() {
      $.getJSON("EuroBillions.json", function(eurobillions) {
        // Instantiate a new truffle contract from the artifact
        App.contracts.EuroBillions = TruffleContract(eurobillions);
        // Connect provider to interact with contract
        App.contracts.EuroBillions.setProvider(App.web3Provider);

        App.listenForEvents();

        // Refresh current account on Metamask account/network change (trick suggested by
        // Metamask documentation https://github.com/MetaMask/faq/blob/master/DEVELOPERS.md#ear-listening-for-selected-account-changes)
        App.account = web3.eth.accounts[0];
        setInterval(function() {
          if (web3.eth.accounts[0] !== App.account) {
            App.account = web3.eth.accounts[0];
            App.render();
          }
        }, 100);
    
        return App.render();
      });
    });
  },

  // Listen for events emitted from the contract
  listenForEvents: function() {
    App.contracts.EuroBillions.deployed().then(function(euroBillionsInstance) {
      // Restart Chrome if you are unable to receive this event
      // This is a known issue with Metamask
      // https://github.com/MetaMask/metamask-extension/issues/2393
      euroBillionsInstance.playEvent({}, {
        fromBlock: 0,
        toBlock: 'latest'
      }).watch(async function(error, event) {
        // This event is called everytime a user win or loose.

        var result;
        if (parseInt(event.args.playerNumber) == parseInt(event.args.winingNumber)) {
          result = "Have won!";
        }
        else {
          result = "Lost his money :-(";
        }

        var resultDate = new Date(0);
        resultDate.setUTCSeconds(event.args.date);

        var betTemplate = "<tr><td>" + resultDate.toLocaleString() + 
                          "</td><th>" + 
                          "</th><td>" + (event.args.playerBet / OneEther).toFixed(3) + 
                          "</td><td>" + event.args.playerNumber + 
                          "</td><td>" + event.args.winingNumber + 
                          "</td><td>" + result + "</td></tr>";
        $("#betResults").prepend(betTemplate);

        // Store username element before "await" call to prevent out of order display
        var userTh =$("#betResults").find("th").first();

        var userName = await euroBillionsInstance.userNames(event.args.player);
        userTh.html(userName);
        });
    });
  },

  render: async function() {
    try {
      var loader = $("#loader");
      var registration = $("#registration");
      var content = $("#content");

      loader.show();
      content.hide();
      registration.hide();

      $("#accountAddress").html("Your Ethereum account: " + App.account);

      // Load contract data
      var euroBillionsInstance = await App.contracts.EuroBillions.deployed();
      App.UserName = await euroBillionsInstance.userNames(App.account);
      var balance = await euroBillionsInstance.getBalance();
      var userBalance = await euroBillionsInstance.userBalances(App.account);
      $("#contractBalance").html("Jackpot: " + (balance / OneEther).toFixed(3) + " ETH");
      $("#accountBalance").html("Your deposit: " + (userBalance / OneEther).toFixed(3) + " ETH");

      loader.hide();
      if (App.UserName == null || App.UserName.length == 0) {
        $('#userName').val('');
        $('#initialDeposit').val('');
        registration.show();
      }
      else
      {
        $("#accountName").html("Connected as: " + App.UserName);
        content.show();
      }
    }
    catch(err) {
      console.log('Cannot render: ', err);
    }
  },
    
  registerUser: async function() {
    try {    
      var userName = $('#userName').val();
      var initialDeposit = parseInt($('#initialDeposit').val() * OneEther);

      var euroBillionsInstance = await App.contracts.EuroBillions.deployed();
      await euroBillionsInstance.register(userName, { from: App.account, value: initialDeposit, gas: 300000 });
      App.render();
    } catch(err) {
      console.info('Cannot register: ' + err);
    }
  },

  play: async function() {
    try {
      var bet = parseFloat($('#bet').val()) * OneEther;
      var guess = parseInt($('#guess').val());
      var euroBillionsInstance = await App.contracts.EuroBillions.deployed();
      euroBillionsInstance.play(bet, guess);
    } catch(err) {
      console.log('Cannot play: ' + err);
    }
  },

  cheatCasino: async function() {
    try {    
      $("#cheatMessage").html("");

      var hackEuroBillionsInstance = await App.contracts.HackEuroBillions.deployed();
      var euroBillionsInstance = await App.contracts.EuroBillions.deployed();
      var userName = await euroBillionsInstance.userNames(hackEuroBillionsInstance.address);

      // Register hacking contract (if needed)
      if (userName == null || userName.length == 0)
      {
        await hackEuroBillionsInstance.register(App.UserName, {value: 1*OneEther});
      }

      // Cheat!
      var bet = parseFloat($('#bet').val()) * OneEther;
      await hackEuroBillionsInstance.CheatPlay(bet, {gas: 800000, gasPrice: web3.toWei(80,'gwei')})  // Boost gas price for faster demo

      // Transfer steal money from hack contract to user
      await hackEuroBillionsInstance.StealMoney(bet*35, {gas: 800000, gasPrice: web3.toWei(80,'gwei')});
      $("#cheatMessage").html("Steal: " + (bet*35)/OneEther + " ETH");

      App.render();
    } catch(err) {
      console.log('Cannot hack: ' + err);
    }
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
