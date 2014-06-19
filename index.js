var Hoek = require('hoek');

var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
var ObjectID = mongodb.ObjectID;

var defaults = {
  settings: {

  }
};

exports.register = function (plugin, options, next) {
  Hoek.assert(!!options.url, 'MongoDB URL is required');
  options = Hoek.applyToDefaults(defaults, options);

  MongoClient.connect(options.url, options, function (err, db) {
    if (err) {
      plugin.log([ "hapi-mongodb", "error" ], err);
      return next(err)
    }

    plugin.expose('db', db);
    plugin.expose('lib', mongodb);
    plugin.expose('ObjectID', ObjectID);

    plugin.log([ "hapi-mongodb", "info" ], "MongoClient connection created");

    next();
  });
};

exports.register.attributes = {
  pkg: require('./package.json')
};