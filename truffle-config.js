var HDWalletProvider = require("truffle-hdwallet-provider");

// WARNING : never put your production mnemonic!
const MNEMONIC = 'holiday world hat parade forum february lab sibling barely curtain buddy bamboo';

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // for more about customizing your Truffle configuration!
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*" // Match any network id
    },
    ropsten: {
      provider: function() {
        return new HDWalletProvider(MNEMONIC, "https://ropsten.infura.io/dda0abb6385e4156ae075fe1ef151ca9")
      },
      network_id: 3,
      gas: 8000000,
      gasPrice: 200000000000,                 
      skipDryRun: true,
      websockets: true
    }
  },

  compilers: {
    solc: {
      version: "0.4.26"  // ex:  "0.4.20". (Default: Truffle's installed solc)
    }
 }
};
