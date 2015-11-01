'use strict';

const mongodb = require('mongodb');
const joi = require('joi');
const async = require('async');

const MongoClient = mongodb.MongoClient;
const ObjectID = mongodb.ObjectID;

const singleOption = joi.object({
    url: joi.string().default('mongodb://localhost:27017'),
    settings: joi.object()
});
const optionsSchema = joi.array().items(singleOption).min(1).single();

exports.register = function (plugin, pluginOptions, next) {

    optionsSchema.validate(pluginOptions, (err, options) => {

        if (err) {
            return next(err);
        }

        plugin.expose('lib', mongodb);
        plugin.expose('ObjectID', ObjectID);

        const connect = (connectionOptions, done) => {

            if (connectionOptions.settings && typeof connectionOptions.settings.promiseLibrary === 'string') {
                connectionOptions.settings.promiseLibrary = require(connectionOptions.settings.promiseLibrary);
            }

            MongoClient.connect(connectionOptions.url, connectionOptions.settings, (err, db) => {

                if (err) {
                    return done(err);
                }

                plugin.log(['hapi-mongodb', 'info'], 'MongoClient connection created for ' + JSON.stringify(connectionOptions));
                done(null, db);
            });
        };

        async.map(options, connect, (err, dbs) => {

            if (err) {
                plugin.log(['hapi-mongodb', 'error'], err);
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
