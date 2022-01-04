'use strict';

const Mongodb = require('mongodb');
const Joi = require('joi');

const MongoClient = Mongodb.MongoClient;
const ObjectID = Mongodb.ObjectId;

const singleOption = Joi.object({
    url: Joi.string().default('mongodb://localhost:27017/test'),
    settings: Joi.object(),
    decorate: [true, Joi.string()]
}).strict();
const optionsSchema = Joi.array().items(singleOption).min(1).single();

exports.plugin = {

    async register(server, pluginOptions) {

        const { value: options } = await optionsSchema.validate(pluginOptions);

        const decorationTypes = new Set(options.map((option) => typeof option.decorate));
        if (decorationTypes.size > 1) {
            throw new Error('You cannot mix different types of decorate options');
        }

        const expose = {
            lib: Mongodb,
            ObjectID,
            ObjectId: ObjectID
        };

        const connect = async function (connectionOptions) {

            if (connectionOptions.settings && typeof connectionOptions.settings.promiseLibrary === 'string') {
                connectionOptions.settings.promiseLibrary = require(connectionOptions .settings.promiseLibrary);
            }

            const client = await MongoClient.connect(connectionOptions.url, connectionOptions.settings);
            const db = await client.db();
            const connectionOptionsToLog = Object.assign({}, connectionOptions, {
                url: connectionOptions.url.replace(/mongodb(\+srv)?:\/\/([^/]+?):([^@]+)@/, 'mongodb$1://$2:******@')
            });

            server.log(['hapi-mongodb', 'info'], 'MongoClient connection created for ' + JSON.stringify(connectionOptionsToLog));

            if (typeof connectionOptions.decorate === 'string') {
                const decoration = Object.assign({ client, db }, expose);
                server.decorate('server', connectionOptions.decorate, decoration);
                server.decorate('request', connectionOptions.decorate, decoration);
            }

            return { client, db };
        };

        try {
            const results = await Promise.all(options.map(connect));
            expose.db = options.length === 1 ? results[0].db : results.map((r) => r.db);
            expose.client = options.length === 1 ? results[0].client : results.map((r) => r.client);
        }
        catch (err) {
            server.log(['hapi-mongodb', 'error'], err);
            throw err;
        }

        if (decorationTypes.has('boolean')) {
            server.decorate('server', 'mongo', expose);
            server.decorate('request', 'mongo', expose);
        }
        else if (decorationTypes.has('undefined')) {
            for (const key of Object.keys(expose)) {

                server.expose(key, expose[key]);
            }
        }

        server.events.on('stop', () => {

            for (const client of [].concat(expose.client)) {

                client.close((err) => {

                    if (err) {
                        server.log(['hapi-mongodb', 'error'], err);
                    }
                });
            }
        });
    },

    pkg: require('../package.json')

};
