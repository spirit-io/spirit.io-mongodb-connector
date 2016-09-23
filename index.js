var connector = require('./lib/connector').MongodbConnector;

module.exports = function() {
    return new connector();
};