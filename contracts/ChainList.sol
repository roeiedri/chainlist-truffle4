// SPDX-License-Identifier: MIT
pragma solidity ^0.4.18;

import "./Ownable.sol";

contract ChainList is Ownable {
    // custom types
    struct Article {
        uint256 id;
        address seller;
        address buyer;
        string name;
        string description;
        uint256 price;
    }

    // state variables
    uint256 articleCounter;
    mapping(uint256 => Article) public articles;

    // events
    event LogSellArticle(
        uint256 indexed _id,
        address indexed _seller,
        string _name,
        uint256 _price
    );
    event LogBuyArticle(
        uint256 indexed _id,
        address indexed _seller,
        address indexed _buyer,
        string _name,
        uint256 _price
    );

        // deactivate the contract
    function kill() public onlyOwner {
        selfdestruct(owner);
    }

    // sell an article
    function sellArticle(
        string _name,
        string _description,
        uint256 _price
    ) public {
        // a new article
        articleCounter++;

        // store this article
        articles[articleCounter] = Article(
            articleCounter,
            msg.sender,
            0x0,
            _name,
            _description,
            _price
        );

        LogSellArticle(articleCounter, msg.sender, _name, _price);
    }

    // fetch the number of articles in the contract
    function getNumberOfArticles() public view returns (uint256) {
        return articleCounter;
    }

    // fetch and return all article IDs for article still for sale
    function getArticlesForSale() public view returns (uint256[]) {
        // prepare output array
        uint256[] memory articleIds = new uint256[](articleCounter);

        uint256 numberOfArticlesForSale = 0;

        // iterate over articles
        for (uint256 i = 1; i <= articleCounter; i++) {
            // keep the ID if the article is still for sale
            if (articles[i].buyer == 0x0) {
                articleIds[numberOfArticlesForSale] = articles[i].id;
                numberOfArticlesForSale++;
            }
        }

        // copy the articlesIds array into a smaller forSale array
        uint256[] memory forSale = new uint256[](numberOfArticlesForSale);
        for (uint256 j = 0; j < numberOfArticlesForSale; j++) {
            forSale[j] = articleIds[j];
        }

        return forSale;
    }

    // buy an article
    function buyArticle(uint256 _id) public payable {
        // we check wether there is an article for sale
        require(articleCounter > 0);

        // we check that the article exists
        require(_id > 0 && _id <= articleCounter);

        // we retrieve the article
        Article storage article = articles[_id];

        // we check that the article has not been sold yet
        require(article.buyer == 0x0);

        // we don't allow the seller to buy it's own article
        require(msg.sender != article.seller);

        // we check that the value sent corresponds to the price of the article
        require(msg.value == article.price);

        // keep buyer's information
        article.buyer = msg.sender;

        // the buyer can pay the seller
        article.seller.transfer(msg.value);

        // trigger the event
        LogBuyArticle(
            article.id,
            article.seller,
            article.buyer,
            article.name,
            article.price
        );
    }
}
