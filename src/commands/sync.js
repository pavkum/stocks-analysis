const config = require("../config/config");
const Promise = require("bluebird");
const _ = require("underscore-node");
const Connection = require("../database/connection");
const Collection = require("../database/collection");
const moment = require("moment");
const CONSTANTS = require("../utils/constants");
const Stocks = require("../fetch/stocks");
const Logger = require("../utils/logger");

module.exports = {
  execute: function(collection, args) {
    const watchlist = config.watchlist;

    Logger.info("Initiating sync: ", watchlist);

    const datePromises = _.map(watchlist, function (symbol) {
      return Collection.getLastInsertedDate(collection, symbol)
    });

    return Promise.map(datePromises, function (obj, index) {
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
      return Collection.insert(collection, array);
    }).then(function () {
      Logger.info("Sync successfully completed for: ", watchlist);
      return true;
    }).catch(function (error) {
      Logger.error("An error occured while syncing", error);
      return false;
    });
  }
};

