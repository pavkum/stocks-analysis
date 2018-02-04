const MongoClient = require('mongodb').MongoClient;
const config = require("../config/config");
const Promise = require("bluebird");
const Logger = require("../utils/logger");

module.exports = {
  connect: function() {
    return new Promise(function (resolve, reject) {
      Logger.debug("Establishing mongo connection", config.mongo.url);
      
      MongoClient.connect(config.mongo.url, function(error, client) {
        if (error) {
          reject(error);
          return;
        }

        Logger.info("Mongo connection established successfully");
        
        resolve(client);
      });
    });
  },

  close: function(client) {
    Logger.info("Closing mongo connection");
    client.close();
  }
};

