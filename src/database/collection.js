const Promise = require("bluebird");
const config = require("../config/config");
const Logger = require("../utils/logger");

module.exports = {
  getCollection: function(client) {
    return new Promise(function (resolve, reject) {
      Logger.debug("Opening collection: ", config.mongo.collection);

      const db = client.db(config.mongo.db);
      
      db.collection(config.mongo.collection, function(error, collection) {
        if (error) {
          reject(error);
          return;
        }

        Logger.info("Obtained mongo collection: ", config.mongo.collection);

        const indexes = {date: 1, symbol: 1};

        // check indexes
        const indexPromise = collection.indexExists(indexes);

        indexPromise.then(function () {
          Logger.debug("Indexes exists");
          
          resolve(collection);
        }).catch(function () {
          // create index
          Logger.info("Creating indexes");

          return collection.createIndex(indexes, {unique: true});
        }).then(function () {
          Logger.info("Indexes created successfully");

          resolve(collection);
        }).catch(function (error) {
          Logger.fatal("Index creation failed", error);
          reject(error);
        });
      });
    });
  },
  
  getLastInsertedDate: function(collection, symbol) {
    Logger.debug("Getting last insertion date for: ", symbol);
    return collection.findOne({symbol: symbol}, {sort: {$natural: 1}});
  },

  insert: function(collection, array) {
    Logger.debug("Inserting data to collection", array);
    if (array.length === 0) {
      return;
    }
    return collection.insertMany(array);
  }
};
