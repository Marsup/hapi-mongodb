'use strict';

const Mongodb = require('mongodb');
const Joi = require('joi');
const Async = require('async');

const MongoClient = Mongodb.MongoClient;
const ObjectID = Mongodb.ObjectID;

const singleOption = Joi.object({
    url: Joi.string().default('mongodb://localhost:27017'),
    settings: Joi.object(),
    decorate: [true, Joi.string()]
});
const optionsSchema = Joi.array().items(singleOption).min(1).single();

exports.register = function (server, pluginOptions, next) {

    optionsSchema.validate(pluginOptions, (err, options) => {

        if (err) {
            return next(err);
        }

        const expose = {
            lib: Mongodb,
            ObjectID
        };

        const connect = (connectionOptions, done) => {

            if (connectionOptions.settings && typeof connectionOptions.settings.promiseLibrary === 'string') {
                connectionOptions.settings.promiseLibrary = require(connectionOptions.settings.promiseLibrary);
            }

            MongoClient.connect(connectionOptions.url, connectionOptions.settings, (err, db) => {

                if (err) {
                    return done(err);
                }

                server.log(['hapi-mongodb', 'info'], 'MongoClient connection created for ' + JSON.stringify(connectionOptions));
                done(null, db);
            });
        };

        Async.map(options, connect, (err, dbs) => {

            if (err) {
                server.log(['hapi-mongodb', 'error'], err);
                return next(err);
            }

            expose.db = options.length === 1 ? dbs[0] : dbs;

            if (pluginOptions.decorate) {
                const decorate = pluginOptions.decorate === true ? 'mongo' : pluginOptions.decorate;
                server.decorate('server', decorate, expose);
                server.decorate('request', decorate, expose);
            }
            else {
                Object.keys(expose).forEach((key) => {

                    server.expose(key, expose[key]);
                });
            }

            server.on('stop', () => {

                [].concat(expose.db).forEach((db) => {

                    db.close((err) => server.log(['hapi-mongodb', 'error'], err));
                });
            });

            next();
        });
    });
};

exports.register.attributes = {
    pkg: require('../package.json')
};
