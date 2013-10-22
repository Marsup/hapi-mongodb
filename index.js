var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;

exports.register = function (plugin, options, next) {
  MongoClient.connect(options.url, options.settings || {}, function (err, db) {
    if (err) return next(err);
    plugin.expose('db', db);
    plugin.expose('lib', mongodb);
    next();
  });
}
