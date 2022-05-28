App = {
     account: 0x0,
     contracts: {},
     web3Provider: null,
     loading: false,

     init: () => {
          return App.initWeb3();
     },

     initWeb3: async () => {
          // initialize web3
          if (typeof web3 !== 'undefined') {
               // reuse provider of the web3 object injected by metamask
               App.web3Provider = web3.currentProvider;
          } else {
               // create a new provider and plug it directly into our local node
               App.web3Provider = new Web3.providers.HttpProvider('http://172.18.80.1:7545');
          }

          web3 = new Web3(App.web3Provider);
          web3.currentProvider.enable().then(acc => {
               App.displayAccountInfo();
               return App.initContract();
          })
     },

     displayAccountInfo: async () => {
          web3.eth.getCoinbase((err, account) => {
               console.log("ACCOUNT " + account)
               if (err == null) {
                    App.account = account;
                    $('#account').text(account);
                    web3.eth.getBalance(account, (err, balance) => {
                         if (err == null) {
                              $('#accountBalance').text(web3.fromWei(balance.toString(), 'ether') + " ETH");
                         }
                    })
               }
          });
     },

     initContract: () => {
          $.getJSON('ChainList.json', chainListArtifact => {
               // get the contract artifact file and use it to instantiate a truffle contract abstruction
               App.contracts.ChainList = TruffleContract(chainListArtifact);
               // set the provider for our contract
               App.contracts.ChainList.setProvider(App.web3Provider);
               // listen to events
               App.listenToEvents();
               // retrieve the article from the contract
               return App.reloadArticles();
          })
     },

     reloadArticles: () => {
          // avoid reentry
          if (App.loading) {
               return;
          }
          App.loading = true;

          // refresh account information because the balance might have changed
          App.displayAccountInfo();

          var chainListInstance;

          App.contracts.ChainList.deployed().then(instance => {
               chainListInstance = instance;
               return chainListInstance.getArticlesForSale();
          }).then(articleIds => {
               // retrieve the article placeholder and clear it
               $('#articlesRow').empty();

               for (var i = 0; i < articleIds.length; i++) {
                    var articleId = articleIds[i];
                    chainListInstance.articles(parseInt(articleId)).then(article => {
                         App.displayArticle(article[0], article[1], article[3], article[4], article[5]);
                    });
               }
               App.loading = false;
          }).catch(err => {
               console.error(err);
               App.loading = false;
          });
     },

     displayArticle: (id, seller, name, description, price) => {
          var articlesRow = $('#articlesRow');
          var etherPrice = web3.fromWei(price, 'ether');
          var articleTemplate = $('#articleTemplate');

          articleTemplate.find('.panel-title').text(name);
          articleTemplate.find('.article-description').text(description);
          articleTemplate.find('.article-price').text(etherPrice + ' ETH');
          articleTemplate.find('.btn-buy').attr('data-id', id);
          articleTemplate.find('.btn-buy').attr('data-value', etherPrice);

          // seller 
          if (seller == App.account) {
               articleTemplate.find('.article-seller').text('You');
               articleTemplate.find('.btn-buy').hide();
          } else {
               articleTemplate.find('.article-seller').text(seller);
               articleTemplate.find('.btn-buy').show();
          }

          // add this new article
          articlesRow.append(articleTemplate.html());
     },

     sellArticle: () => {
          // retrieve the details of the article 
          var _article_name = $('#article_name').val();
          var _description = $('#article_description').val();
          var _price = web3.toWei(parseFloat($('#article_price').val() || 0), 'ether')

          if ((_article_name.trim() == '') || (_price == 0)) {
               // nothing to sell
               return false;
          }

          App.contracts.ChainList.deployed().then(instance => {
               return instance.sellArticle(_article_name, _description, _price, {
                    from: App.account,
                    gas: 500000,
               });
          }).then(result => {
          }).catch(err => {
               console.error(err);
          });
     },

     listenToEvents: () => {
          App.contracts.ChainList.deployed().then(instance => {
               instance.LogSellArticle({}, {}).watch((error, event) => {
                    if (!error) {
                         $('#events').append('<li class="list-group-item">' + event.args._name + ' is now for sale</li>')
                    } else {
                         console.error(err);
                    }
                    App.reloadArticles();
               })

               instance.LogBuyArticle({}, {}).watch((error, event) => {
                    if (!error) {
                         $('#events').append('<li class="list-group-item">' + event.args._buyer + ' bought ' + event.args._name + '</li>')
                    } else {
                         console.error(err);
                    }
                    App.reloadArticles();
               })

          });
     },

     buyArticle: () => {
          event.preventDefault();

          // retrieve the article price
          var _articleId = $(event.target).data('id');
          var _price = parseFloat($(event.target).data('value'));

          App.contracts.ChainList.deployed().then(instance => {
               return instance.buyArticle(_articleId, {
                    from: App.account,
                    value: web3.toWei(_price, 'ether'),
                    gas: 500000
               });
          }).catch(error => {
               console.error(error)
          });
     }
};

$(() => {
     $(window).load(() => {
          App.init();
     });
});
