module.exports = {
     networks: {
          ganache: {
               port: 7545,
               host: "172.20.208.1",
               network_id: "*" // match any network id
          },
          chainskills: {
               host: 'localhost',
               port: 8545,
               network_id: "4224",
               gas: 4700000
          }
     }
};
