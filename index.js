var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
var ObjectID = mongodb.ObjectID;

exports.register = function (plugin, options, next) {
  options.url = options.url || 'mongodb://localhost:27017';

  MongoClient.connect(options.url, options.settings, function (err, db) {
    if (err) {
      plugin.log([ 'hapi-mongodb', 'error' ], 'Error connecting to MongoDB');
      return next(err);
    }

    plugin.expose('db', db);
    plugin.expose('lib', mongodb);
    plugin.expose('ObjectID', ObjectID);

    plugin.log([ 'hapi-mongodb', 'info' ], 'MongoClient connection created');

    next();
  });
};

exports.register.attributes = {
  pkg: require('./package.json')
};
