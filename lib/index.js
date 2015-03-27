var mongodb = require('mongodb');
var joi = require('joi');
var async = require('async');

var MongoClient = mongodb.MongoClient;
var ObjectID = mongodb.ObjectID;

var singleOption = joi.object({
  url: joi.string().default('mongodb://localhost:27017'),
  settings: joi.object()
});
var optionsSchema = joi.array().items(singleOption).min(1).single();

exports.register = function (plugin, options, next) {
  optionsSchema.validate(options, function (err, options) {
    if (err) {
      return next(err);
    }

    plugin.expose('lib', mongodb);
    plugin.expose('ObjectID', ObjectID);

    var connect = function (options, done) {
      MongoClient.connect(options.url, options.settings, function (err, db) {
        if (err) {
          return done(err);
        }

        plugin.log([ 'hapi-mongodb', 'info' ], 'MongoClient connection created for ' + JSON.stringify(options));
        done(null, db);
      });
    };

    async.map(options, connect, function (err, dbs) {
      if (err) {
        plugin.log([ 'hapi-mongodb', 'error' ], err);
        return next(err);
      }

      plugin.expose('db', options.length === 1 ? dbs[0] : dbs);
      next();
    });
  });
};

exports.register.attributes = {
  pkg: require('../package.json')
};
