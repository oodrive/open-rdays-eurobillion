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
    App.contracts.EuroBillions.deployed().then(function(instance) {
      // Restart Chrome if you are unable to receive this event
      // This is a known issue with Metamask
      // https://github.com/MetaMask/metamask-extension/issues/2393
      instance.playEvent({}, {
        fromBlock: 0,
        toBlock: 'latest'
      }).watch(function(error, event) {
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

        App.contracts.EuroBillions.deployed().then(function(instance) {
          euroBillionsInstance = instance;
          return euroBillionsInstance.userNames(event.args.player);
        }).then(function(userName) {
          var betTemplate = "<tr><td>" + resultDate.toLocaleString() + 
                            "</td><th>" + userName + 
                            "</th><td>" + (event.args.playerBet / OneEther).toFixed(3) + 
                            "</td><td>" + event.args.playerNumber + 
                            "</td><td>" + event.args.winingNumber + 
                            "</td><td>" + result + "</td></tr>";
          $("#betResults").prepend(betTemplate);

          App.render();
      });
          });
    });
  },

  render: function() {
    var euroBillionsInstance;
    var loader = $("#loader");
    var registration = $("#registration");
    var content = $("#content");

    loader.show();
    content.hide();
    registration.hide();

    $("#accountAddress").html("Your Ethereum account: " + App.account);

    // Load contract data
    App.contracts.EuroBillions.deployed().then(function(instance) {
      euroBillionsInstance = instance;
      return euroBillionsInstance.userNames(App.account);
    }).then(function(userName) {
      App.UserName = userName;
      return euroBillionsInstance.getBalance();
    }).then(function(balance) {
      $("#contractBalance").html("Jackpot: " + (balance / OneEther).toFixed(3) + " ETH");
      return euroBillionsInstance.userBalances(App.account);
    }).then(function(userBalance) {
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

    }).catch(function(error) {
      console.warn(error);
    });
  },
    
  registerUser: function() {
    var userName = $('#userName').val();
    var initialDeposit = parseInt($('#initialDeposit').val() * OneEther);

    App.contracts.EuroBillions.deployed().then(function(instance) {
      instance.register(userName, { from: App.account, value: initialDeposit, gas: 300000 })
      .then(function(result) {
        App.render();
      });
    }).catch(function(err) {
      console.error(err);
    });
  },

  play: function() {   
    var bet = parseFloat($('#bet').val()) * OneEther;
    var guess = parseInt($('#guess').val());
    App.contracts.EuroBillions.deployed().then(function(instance) {
        instance.play(bet, guess);
      })
  },

  cheatCasino: function() {
    var appEuroBillions;
    var appHackEuroBillions;
    $("#cheatMessage").html("");
    App.contracts.HackEuroBillions.deployed()
    .then(function(instance) {
      appHackEuroBillions = instance;
    }).then(function() {
      App.contracts.EuroBillions.deployed()
      .then(function(instance) {
        appEuroBillions = instance;
        return appEuroBillions.userNames(appHackEuroBillions.address);
      }).then(function(userName) {
        // Register hacking contract (if needed)
        if (userName == null || userName.length == 0)
        {
          appHackEuroBillions.register(App.UserName, {value: 1*OneEther});
        }
      }).then(function() {
        // Cheat!
        var bet = parseFloat($('#bet').val()) * OneEther;
        appHackEuroBillions.CheatPlay(bet, {gas: 800000, gasPrice: web3.toWei(80,'gwei')})  // Boost gas price for faster demo
        .then(function(){
          return appEuroBillions.userBalances(appHackEuroBillions.address);
        }).then(function(hackBalance){
          // Withdraw money on hack contract address
          appHackEuroBillions.StealMoney(hackBalance-OneEther, {gas: 800000, gasPrice: web3.toWei(80,'gwei')}).then(function(){
            $("#cheatMessage").html("Steal: " + (hackBalance-OneEther)/OneEther + " ETH");
            App.render();
          })
        });
      })
    });
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
