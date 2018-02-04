const Logger = require("logger").createLogger();
const config = require("../config/config");

Logger.setLevel(config.logLevel);

module.exports = Logger;
