const program = require("commander");
const Connection = require("./database/connection");
const Collection = require("./database/collection");
const Logger = require("./utils/logger");

// operations
const sync = require("./commands/sync");
const report = require("./commands/report");

const OPERATIONS_MAP = {
  "sync": sync,
  "report": report
};

program
  .version("1.0.0")
  .option("-o, --operation [value]", "Pass required operation")
  .option("-p, --params [value]", "Pass arguments to operation")
  .parse(process.argv);

const operation = program.operation;
const args = program.params || "";

Logger.debug("Operation: ", operation);
Logger.debug("params: ", args);

const currentOperation = OPERATIONS_MAP[operation];

if (!currentOperation) {
  Logger.fatal("Invalid operation passed. Please refer to config for valid operations");
  process.exit(1);
}

// prepare args map
// format: abc:one,efg:two..
const argsMap = {};
const argsList = args.split(",");

for (let i = 0; i < argsList.length; i++) {
  const item = argsList[i].split(":");
  argsMap[item[0]] = item[1];
}

const connectionPromise = Connection.connect();

const closeConnection = function() {
  connectionPromise.then(function (connection) {
    Connection.close(connection);
    process.exit(1);
  });
};

const collectionPromise = connectionPromise.then(function (client) {
  return Collection.getCollection(client)
}).catch(function (error) {
  Logger.fatal("Error establishing mongo connection", error);
  return null;
});

const operationPromise = collectionPromise.then(function (collection) {
  Logger.info("Executing operation: ", operation);
  
  return currentOperation.execute(collection, argsMap)
}).catch(function (error) {
  Logger.error("An error occured while generating report", error);

  // close connection
  closeConnection();
});

operationPromise.then(function(obj) {
  closeConnection();
}).catch(function () {
  closeConnection();
});

