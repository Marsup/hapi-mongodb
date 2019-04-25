'use strict';

const Hapi = require('@hapi/hapi');
const Hoek = require('@hapi/hoek');
const Lab = require('@hapi/lab');
const Mongodb = require('mongodb');

const { describe, it, beforeEach, expect } = exports.lab = Lab.script();

describe('Hapi server', () => {

    let server;

    beforeEach(() => {

        server = Hapi.Server();
    });

    it('should reject invalid options', async () => {

        try {
            await server.register({
                plugin: require('../'),
                options: {
                    urll: 'mongodb://localhost:27017'
                }
            });
        }
        catch (err) {

            expect(err).to.exist();
        }
    });

    it('should reject invalid decorate', async () => {

        try {
            await server.register({
                plugin: require('../'),
                options: {
                    decorate: 1
                }
            });
        }
        catch (err) {
            expect(err).to.exist();
        }
    });

    it('should fail with no mongodb listening', async () => {

        try {
            await server.register({
                plugin: require('../'),
                options: {
                    url: 'mongodb://localhost:27018'
                }
            });
        }
        catch (err) {

            expect(err).to.exist();
        }
    });

    it('should be able to register plugin with just URL', async () => {

        await server.register({
            plugin: require('../'),
            options: {
                url: 'mongodb://localhost:27017'
            }
        });
    });

    it('should log configuration upon successful connection', async () => {

        let logEntry;
        server.events.once('log', (entry) => {

            logEntry = entry;
        });

        await server.register({
            plugin: require('../'),
            options: {
                url: 'mongodb://localhost:27017'
            }
        });

        expect(logEntry).to.equal({
            channel: 'app',
            timestamp: logEntry.timestamp,
            tags: ['hapi-mongodb', 'info'],
            data: 'MongoClient connection created for {"url":"mongodb://localhost:27017"}'
        });
    });

    it('should log configuration upon successfull connection, obscurifying DB password', async () => {

        let logEntry;
        server.events.once('log', (entry) => {

            logEntry = entry;
        });

        const originalConnect = Mongodb.MongoClient.connect;
        let connected = false;
        Mongodb.MongoClient.connect = (url, options) => {

            Mongodb.MongoClient.connect = originalConnect;
            expect(url).to.equal('mongodb://user:abcdefg@example.com:27017');
            expect(options).to.equal({ poolSize: 11 });
            connected = true;
            return Promise.resolve({ db: () => 'test-db' });
        };

        await server.register({
            plugin: require('../'),
            options: {
                url: 'mongodb://user:abcdefg@example.com:27017',
                settings: {
                    poolSize: 11
                }
            }
        });

        expect(connected).to.be.true();
        expect(logEntry).to.equal({
            channel: 'app',
            timestamp: logEntry.timestamp,
            tags: ['hapi-mongodb', 'info'],
            data: 'MongoClient connection created for {"url":"mongodb://user:******@example.com:27017","settings":{"poolSize":11}}'
        });
    });

    it('should be able to register plugin with URL and settings', async () => {

        await server.register({
            plugin: require('../'),
            options: {
                url: 'mongodb://localhost:27017',
                settings: {
                    poolSize: 10
                }
            }
        });
    });

    it('should be able to find the plugin exposed objects', async () => {

        await server.register({
            plugin: require('../'),
            options: {
                url: 'mongodb://localhost:27017'
            }
        });

        server.route({
            method: 'GET',
            path: '/',
            handler(request) {

                const plugin = request.server.plugins['hapi-mongodb'];
                expect(plugin.db).to.exist();
                expect(plugin.client).to.exist();
                expect(plugin.lib).to.exist();
                expect(plugin.ObjectID).to.exist();
                return Promise.resolve(null);
            }
        });

        await server.inject({ method: 'GET', url: '/' });
    });

    it('should be able to find the plugin on decorated objects', async () => {

        await server.register({
            plugin: require('../'),
            options: {
                url: 'mongodb://localhost:27017',
                decorate: true
            }
        });

        expect(server.mongo.db).to.exist();
        expect(server.mongo.client).to.exist();
        expect(server.mongo.lib).to.exist();
        expect(server.mongo.ObjectID).to.exist();

        server.route({
            method: 'GET',
            path: '/',
            handler(request) {

                expect(request.mongo.db).to.exist();
                expect(request.mongo.client).to.exist();
                expect(request.mongo.lib).to.exist();
                expect(request.mongo.ObjectID).to.exist();
                return Promise.resolve(null);
            }
        });

        await server.inject({ method: 'GET', url: '/' });
    });

    it('should be able to find the plugin on custom decorated objects', async () => {

        await server.register({
            plugin: require('../'),
            options: {
                url: 'mongodb://localhost:27017',
                decorate: 'db'
            }
        });

        expect(server.db.db).to.exist();
        expect(server.db.client).to.exist();
        expect(server.db.lib).to.exist();
        expect(server.db.ObjectID).to.exist();

        server.route({
            method: 'GET',
            path: '/',
            handler(request) {

                expect(request.db.db).to.exist();
                expect(request.db.client).to.exist();
                expect(request.db.lib).to.exist();
                expect(request.db.ObjectID).to.exist();
                return Promise.resolve(null);
            }
        });

        await server.inject({ method: 'GET', url: '/' });
    });

    it('should fail to mix different decorations', async () => {

        try {
            await server.register({
                plugin: require('../'),
                options: [{
                    url: 'mongodb://localhost:27017',
                    decorate: true
                }, {
                    url: 'mongodb://localhost:27017',
                    decorate: 'foo'
                }]
            });
        }
        catch (err) {

            expect(err).to.be.an.error('You cannot mix different types of decorate options');
        }
    });

    it('should connect to a mongodb instance without providing plugin settings', async () => {

        await server.register({ plugin: require('../') });

        const db = server.plugins['hapi-mongodb'].db;
        expect(db).to.be.instanceof(Mongodb.Db);
        expect(db.databaseName).to.equal('test');
    });

    it('should use the correct default mongodb url in options', async () => {

        const originalConnect = Mongodb.MongoClient.connect;
        let connected = false;
        Mongodb.MongoClient.connect = (url, options) => {

            Mongodb.MongoClient.connect = originalConnect;
            expect(url).to.equal('mongodb://localhost:27017/test');
            connected = true;
            return Promise.resolve({ dbInstance: true, db: () => 'test-db' });
        };

        await server.register({ plugin: require('../') });

        expect(connected).to.be.true();
        const db = server.plugins['hapi-mongodb'].db;
        expect(db).to.equal('test-db');
    });

    it('should be able to have multiple connections', async () => {

        await server.register({
            plugin: require('../'),
            options: [{ url: 'mongodb://localhost:27017/test0' }, { url: 'mongodb://localhost:27017/test1' }]
        });

        const plugin = server.plugins['hapi-mongodb'];
        expect(plugin.db).to.be.an.array().and.to.have.length(2);
        plugin.db.forEach((db, i) => {

            expect(db).to.be.instanceof(Mongodb.Db);
            expect(db.databaseName).to.equal('test' + i);
        });
    });

    it('should require the "promiseLibrary" before passing it to mongodb', async () => {

        await server.register({
            plugin: require('../'),
            options: {
                settings: {
                    promiseLibrary: 'bluebird'
                }
            }
        });
    });

    it('should disconnect if the server stops', async () => {

        await server.register({
            plugin: require('../'),
            options: {
                settings: {
                    promiseLibrary: 'bluebird'
                }
            }
        });

        await server.initialize();
        await server.stop();
        await Hoek.wait(100); // Let the connections end.
    });

    it('should be able to find the plugin exposed objects', async () => {

        await server.register({
            plugin: require('../'),
            options: {
                url: 'mongodb://localhost:27017'
            }
        });

        const res = await server.plugins['hapi-mongodb'].db.collection('test').find().toArray();
        expect(res).to.equal([]);
    });
});
