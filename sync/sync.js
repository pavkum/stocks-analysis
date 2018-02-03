const fse = require("fs-extra");
const YFinance = require("yahoo-finance");
const _ = require("underscore-node");
const moment = require("moment");
const config = require("../config/config.js");

const processData = function(data) {
    _.each(config.watchlist, function(symbol) {
	const resp = _.indexBy(data[symbol], function(obj) {
	    return moment(obj.date).format("YYYY-MM-DD");
	});
	console.log(resp);
    });
};

YFinance.historical({
    symbols: config.watchlist,
    from: config.startDate,
    to: "2018-01-10"
}).then(function (data) {
    processData(data);
});


/*
var util = require('util');



require('colors');

var googleFinance = require('google-finance');

var SYMBOL = 'NASDAQ:AAPL';
var FROM = '2014-01-01';
var TO = '2014-12-31';

googleFinance.historical({
  symbol: SYMBOL,
  from: FROM,
  to: TO
}).then(function (quotes) {
  console.log(util.format(
    '=== %s (%d) ===',
    SYMBOL,
    quotes.length
  ).cyan);
  if (quotes[0]) {
    console.log(
      '%s\n...\n%s',
      JSON.stringify(quotes[0], null, 2),
      JSON.stringify(quotes[quotes.length - 1], null, 2)
    );
  } else {
    console.log('N/A');
  }
});
*/
