// contract to be tested
var ChainList = artifacts.require('./ChainList.sol');

// test suite
contract('ChainList', accounts => {
    var chainListInstance;
    var seller = accounts[1];
    var buyer = accounts[2];
    var articleName = 'article 1';
    var articleDescription = 'Description for article 1';
    var articlePrice = 10;

    // no article for sale yet
    it('should throw an exception if you\'re trying to buy an article when there is no article for sale yet', () => {
        return ChainList.deployed().then(instance => {
            chainListInstance = instance;
            return chainListInstance.buyArticle(1, {
                from: buyer,
                value: web3.toWei(articlePrice, 'ether')
            });
        }).then(
            assert.fail
        ).catch(() => {
            assert(true);
        }).then(() => {
            return chainListInstance.getNumberOfArticles();
        }).then(data => {
            assert.equal(parseInt(data), 0, 'number of articles must be 0')
        });
    });

    // buy an article that doesn't exist
    it('should throw an exception if your\'e trying to buy an article that doesn\'t exist', () => {
        return ChainList.deployed().then(instance => {
            chainListInstance = instance;
            return chainListInstance.sellArticle(articleName, articleDescription, web3.toWei(articlePrice, 'ether'), { from: seller });
        }).then(receipt => {
            return chainListInstance.buyArticle(2, { from: seller, value: web3.toWei(articlePrice, 'ether') })
        }).then(
            assert.fail
        ).catch(error => {
            assert(true);
        }).then(() => {
            return chainListInstance.articles(1);
        }).then(data => {
            assert.equal(parseInt(data[0]), 1, 'article id must be 1');
            assert.equal(data[1], seller, 'seller must be ' + seller);
            assert.equal(data[2], 0x0, 'buyer must be empty');
            assert.equal(data[3], articleName, 'article name must be ' + articleName);
            assert.equal(data[4], articleDescription, 'article description must be ' + articleDescription);
            assert.equal(parseInt(data[5]), web3.toWei(articlePrice, 'ether'), 'article price must be ' + articlePrice + ' ETH');
        })
    })

    // buying an article you are selling
    it('should throw exception if you try to buy your own article', () => {
        return ChainList.deployed().then(instance => {
            chainListInstance = instance;
            return chainListInstance.buyArticle(1, { from: seller, value: web3.toWei(articlePrice, 'ether') });
        }).then(
            assert.fail
        ).catch(() => {
            assert(true);
        }).then(() => {
            return chainListInstance.articles(1);
        }).then(data => {
            assert.equal(parseInt(data[0]), 1, 'article id must be 1');
            assert.equal(data[1], seller, 'seller must be empty.');
            assert.equal(data[2], 0x0, 'buyer must be empty.');
            assert.equal(data[3], articleName, 'article name must ' + articleName);
            assert.equal(data[4], articleDescription, 'article description must be ' + articleDescription);
            assert.equal(parseInt(data[5]), web3.toWei(articlePrice, 'ether'), 'article price must be ' + articlePrice + ' ETH');
        });
    });

    // incorrect value
    it('should throw exception if you try to buy an article for a value different from it\'s price', () => {
        return ChainList.deployed().then(instance => {
            chainListInstance = instance;
            return chainListInstance.buyArticle(1, { from: buyer, value: web3.toWei(articlePrice + 1, 'ether') });
        }).then(
            assert.fail
        ).catch(() => {
            assert(true);
        }).then(() => {
            return chainListInstance.articles(1);
        }).then(data => {
            assert.equal(parseInt(data[0]), 1, 'article id must be 1');
            assert.equal(data[1], seller, 'seller must be empty.');
            assert.equal(data[2], 0x0, 'buyer must be empty.');
            assert.equal(data[3], articleName, 'article name must ' + articleName);
            assert.equal(data[4], articleDescription, 'article description must be ' + articleDescription);
            assert.equal(parseInt(data[5]), web3.toWei(articlePrice, 'ether'), 'article price must be ' + articlePrice + ' ETH');
       });
    });

    // article has already been sold
    it('should throw exception if you try to buy an article that has already been sold', () => {
        return ChainList.deployed().then(instance => {
            chainListInstance = instance;
            return chainListInstance.buyArticle(1, { from: buyer, value: web3.toWei(articlePrice, 'ether') });
        }).then(() => {
            return chainListInstance.buyArticle(1, { from: web3.eth.accounts[0], value: web3.toWei(articlePrice, 'ether') });
        }).then(
            assert.fail
        ).catch(() => {
            assert(true);
        }).then(() => {
            return chainListInstance.articles(1);
        }).then(data => {
            assert.equal(parseInt(data[0]), 1, 'article id must be 1');
            assert.equal(data[1], seller, 'seller must be empty.');
            assert.equal(data[2], buyer, 'buyer must be ' + buyer);
            assert.equal(data[3], articleName, 'article name must ' + articleName);
            assert.equal(data[4], articleDescription, 'article description must be ' + articleDescription);
            assert.equal(parseInt(data[5]), web3.toWei(articlePrice, 'ether'), 'article price must be ' + articlePrice + ' ETH');
        });
    });
});