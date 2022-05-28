// contract to be tested
var ChainList = artifacts.require('./ChainList.sol');

// test suite
contract('ChainList', accounts => {
    var chainListInstance;
    var seller = accounts[1];
    var buyer = accounts[2];
    var articlePrice1 = 10;
    var articleName1 = 'article 1';
    var articleDescription1 = 'Description for article 1';
    var articlePrice2 = 20;
    var articleName2 = 'article 2';
    var articleDescription2 = 'Description for article 2';
    var sellerBalanceBeforeBuy, sellerBalanceAfterBuy;
    var buyerBalanceBeforeBuy, buyerBalanceAfterBuy;

    it('should be initialized with empty values', () => {
        return ChainList.deployed().then(instance => {
            chainListInstance = instance;
            return chainListInstance.getNumberOfArticles();
        }).then(data => {
            assert.equal(parseInt(data), 0, 'numbers of articles must be 0');
            return chainListInstance.getArticlesForSale();
        }).then(data => {
            assert.equal(data.length, 0, 'tehre shouldn\'t be any articles for sale');
        });
    });

    // sell a first article
    it('should let us sell a first article', () => {
        return ChainList.deployed().then(instance => {
            chainListInstance = instance;
            return chainListInstance.sellArticle(articleName1, articleDescription1, web3.toWei(articlePrice1, 'ether'), { from: seller })
        }).then(receipt => {
            // check event
            assert.equal(receipt.logs.length, 1, 'one event should have been triggered');
            assert.equal(receipt.logs[0].event, 'LogSellArticle', 'event should be LogSellArticle');
            assert.equal(parseInt(receipt.logs[0].args._id), 1, 'id must be 1');
            assert.equal(receipt.logs[0].args._seller, seller, 'event seller must be ' + seller);
            assert.equal(receipt.logs[0].args._name, articleName1, 'event article name must be ' + articleName1);
            assert.equal(parseInt(web3.fromWei(receipt.logs[0].args._price, 'ether')), articlePrice1, 'event article price must be ' + web3.fromWei(articlePrice1, 'ether'));

            return chainListInstance.getNumberOfArticles();
        }).then(data => {
            assert.equal(data, 1, 'number of articles must be 1');

            return chainListInstance.getArticlesForSale();
        }).then(data => {
            assert.equal(data.length, 1, 'there must only one article for sale');
            assert.equal(parseInt(data[0]), 1, 'article id must be 1');

            return chainListInstance.articles(data[0]);
        }).then(data => {
            assert.equal(parseInt(data[0]), 1, 'article id must be 1');
            assert.equal(data[1], seller, 'seller must be ' + seller);
            assert.equal(data[2], 0x0, 'buyer must be empty');
            assert.equal(data[3], articleName1, 'article name must be ' + articleName1);
            assert.equal(data[4], articleDescription1, 'article description must be ' + articleDescription1);
            assert.equal(parseInt(data[5]), web3.toWei(articlePrice1, 'ether'), 'article price must be ' + articlePrice1 + ' ETH');
        });
    });

    // sell a second article
    it('should let us sell a second article', () => {
        return ChainList.deployed().then(instance => {
            chainListInstance = instance;
            return chainListInstance.sellArticle(articleName2, articleDescription2, web3.toWei(articlePrice2, 'ether'), { from: seller })
        }).then(receipt => {
            // check event
            assert.equal(receipt.logs.length, 1, 'one event should have been triggered');
            assert.equal(receipt.logs[0].event, 'LogSellArticle', 'event should be LogSellArticle');
            assert.equal(parseInt(receipt.logs[0].args._id), 2, 'id must be 2');
            assert.equal(receipt.logs[0].args._seller, seller, 'event seller must be ' + seller);
            assert.equal(receipt.logs[0].args._name, articleName2, 'event article name must be ' + articleName2);
            assert.equal(parseInt(web3.fromWei(receipt.logs[0].args._price, 'ether')), articlePrice2, 'event article price must be ' + web3.fromWei(articlePrice2, 'ether'));

            return chainListInstance.getNumberOfArticles();
        }).then(data => {
            assert.equal(data, 2, 'number of articles must be 2');

            return chainListInstance.getArticlesForSale();
        }).then(data => {
            assert.equal(data.length, 2, 'there must only one article for sale');
            assert.equal(parseInt(data[1]), 2, 'article id must be 2');

            return chainListInstance.articles(data[1]);
        }).then(data => {
            assert.equal(parseInt(data[0]), 2, 'article id must be 2');
            assert.equal(data[1], seller, 'seller must be ' + seller);
            assert.equal(data[2], 0x0, 'buyer must be empty');
            assert.equal(data[3], articleName2, 'article name must be ' + articleName2);
            assert.equal(data[4], articleDescription2, 'article description must be ' + articleDescription2);
            assert.equal(parseInt(data[5]), web3.toWei(articlePrice2, 'ether'), 'article price must be ' + articlePrice2 + ' ETH');
        });
    });

    // buy the first article
    it('should buy an article', () => {
        return ChainList.deployed().then(instance => {
            chainListInstance = instance;
            // record balances of seller and buyer before the buy
            sellerBalanceBeforeBuy = parseInt(web3.fromWei(web3.eth.getBalance(seller), 'ether'));
            buyerBalanceBeforeBuy = parseInt(web3.fromWei(web3.eth.getBalance(buyer), 'ether'));
            return chainListInstance.buyArticle(1, {
                from: buyer,
                value: web3.toWei(articlePrice1, 'ether')
            }).then(receipt => {
                assert.equal(receipt.logs.length, 1, 'one event should have been triggered');
                assert.equal(receipt.logs[0].event, 'LogBuyArticle', 'event should be LogBuyArticle');
                assert.equal(receipt.logs[0].args._id, 1, 'article id must be 1');
                assert.equal(receipt.logs[0].args._seller, seller, 'event seller must be ' + seller);
                assert.equal(receipt.logs[0].args._buyer, buyer, 'event buyer must be ' + buyer);
                assert.equal(receipt.logs[0].args._name, articleName1, 'event article name must be ' + articleName1);
                assert.equal(parseInt(receipt.logs[0].args._price), web3.toWei(articlePrice1, 'ether'), 'event article price must be ' + articlePrice1 + ' ETH');

                // record balances of buyer and seller after the buy
                sellerBalanceAfterBuy = parseInt(web3.fromWei(web3.eth.getBalance(seller), 'ether'));
                buyerBalanceAfterBuy = parseInt(web3.fromWei(web3.eth.getBalance(buyer), 'ether'));

                // check the effect of buy on balances of buyer and seller, accounting for gas
                assert(sellerBalanceAfterBuy == sellerBalanceBeforeBuy + articlePrice1, 'seller should have earned ' + articlePrice1 + ' ETH');
                assert(buyerBalanceAfterBuy <= buyerBalanceBeforeBuy - articlePrice1, 'buyer should have spent ' + articlePrice1 + ' ETH');

                return chainListInstance.getArticlesForSale();
            }).then(data => {
                assert.equal(data.length, 1, 'there should now be only 1 article left for sale');
                assert.equal(parseInt(data[0]), 2, 'article 2 should be the only article left for sale');

                return chainListInstance.getNumberOfArticles();
            }).then(data => {
                assert.equal(parseInt(data), 2, 'there should still be 2 articles in total');
            });
        });
    });
});