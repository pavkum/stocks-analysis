const YFinance = require("yahoo-finance");
const _ = require("underscore-node");
const Promise = require("bluebird");
const Logger = require("../utils/logger");
const moment = require("moment");

module.exports = {
  historical: function(symbol, from, to) {
    Logger.info("Fetching historical data for: ", symbol, from, to);

    /*
      We could have just returned. But mongodb hates duplicate indexes
      and yahoo api returns at least last traded info even if from is 
      greater than last traded date.
    */
    return new Promise(function (resolve, reject) {
      YFinance.historical({
        symbol: symbol,
        from: from,
        to: to,
        period: 'd'
      }).then(function (data) {
        const filtered = [];
        const momentFrom = moment(from);
        
        // we need both filter and map functionality. We will use each
        _.each(data, function (obj) {
          const date = moment(obj.date);

          if (date.isAfter(momentFrom)) {
            filtered.push(_.extend(obj, {
              date: date.toDate()
            }));
          } else {
            Logger.debug("Rejecting duplicate entry: ", obj);
          }
        });

        resolve(filtered);
      }).catch(function (error) {
        reject(error);
      });
    });
  }
};
