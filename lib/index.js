'use strict';

const Mongodb = require('mongodb');
const Joi = require('joi');
const Async = require('async');

const MongoClient = Mongodb.MongoClient;
const ObjectID = Mongodb.ObjectID;

const singleOption = Joi.object({
    url: Joi.string().default('mongodb://localhost:27017/test'),
    settings: Joi.object(),
    decorate: [true, Joi.string()]
}).strict();
const optionsSchema = Joi.array().items(singleOption).min(1).single();

exports.register = function (server, pluginOptions, next) {

    optionsSchema.validate(pluginOptions, (err, options) => {

        if (err) {
            return next(err);
        }

        const decorationTypes = new Set(options.map((option) => typeof option.decorate));
        if (decorationTypes.size > 1) {
            return next(new Error('You cannot mix different types of decorate options'));
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

                const connectionOptionsToLog = Object.assign({}, connectionOptions, {
                    url: connectionOptions.url.replace(/mongodb:\/\/([^/]+):([^@]+)@/, 'mongodb://$1:******@')
                });
                server.log(['hapi-mongodb', 'info'], 'MongoClient connection created for ' + JSON.stringify(connectionOptionsToLog));

                if (typeof connectionOptions.decorate === 'string') {
                    const decoration = Object.assign({ db }, expose);
                    server.decorate('server', connectionOptions.decorate, decoration);
                    server.decorate('request', connectionOptions.decorate, decoration);
                }

                done(null, db);
            });
        };

        Async.map(options, connect, (err, dbs) => {

            if (err) {
                server.log(['hapi-mongodb', 'error'], err);
                return next(err);
            }

            expose.db = options.length === 1 ? dbs[0] : dbs;

            if (decorationTypes.has('boolean')) {
                server.decorate('server', 'mongo', expose);
                server.decorate('request', 'mongo', expose);
            }
            else if (decorationTypes.has('undefined')) {
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
