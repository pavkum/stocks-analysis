const config = require("../config/config");
const Promise = require("bluebird");
const _ = require("underscore-node");
const Connection = require("../database/connection");
const Collection = require("../database/collection");
const moment = require("moment");
const CONSTANTS = require("../utils/constants");
const Stocks = require("../fetch/stocks");
const Logger = require("../utils/logger");

const watchlist = config.watchlist;
Logger.info("Initiating sync: ", watchlist);

const connectionPromise = Connection.connect();

const collectionPromise = connectionPromise.then(function (client) {
  return Collection.getCollection(client);
}).catch(function (error) {
  Logger.fatal("Error establishing mongo connection", error);
  return null;
});

const datePromises = collectionPromise.then(function (collection) {
  return _.map(watchlist, function (symbol) {
    return Collection.getLastInsertedDate(collection, symbol)
  });
}).catch(function (error) {
 connectionPromise.then(function(connection) {
   Connection.close(connection);

   Logger.fatal("An error occurred while obtaining collection", error)
  }); 
})

Promise.map(datePromises, function (obj, index) {
  const symbol = watchlist[index];
  const to = moment().format(CONSTANTS.YFINANCE_DATE_FORMAT);

  let from;
  if (obj) {
    from = moment(obj.date).add(1, "days")
      .format(CONSTANTS.YFINANCE_DATE_FORMAT);
  } else {
    from = moment().subtract(CONSTANTS.HISTORICAL_LENGTH, "days")
      .format(CONSTANTS.YFINANCE_DATE_FORMAT);
  }
 
  Logger.debug("Last fetched snapshot for: ", symbol, obj);

  return Stocks.historical(symbol, from, to);
}).map(function (array) {
  // already resolved
  return collectionPromise.then(function (collection) {
    return Collection.insert(collection, array);
  });
}).then(function () {
  // close connection
  connectionPromise.then(function(connection) {
    Connection.close(connection);

    Logger.info("Sync successfully completed for: ", watchlist);
  });
}).catch(function (error) {
  // close connection
  connectionPromise.then(function(connection) {
    Connection.close(connection);

    Logger.error("An error occured while syncing", error);
  });
})
