'use strict';

const Hapi = require('hapi');
const Lab = require('lab');
const Mongodb = require('mongodb');
const lab = exports.lab = Lab.script();
const describe = lab.describe;
const it = lab.it;
const beforeEach = lab.beforeEach;
const expect = lab.expect;

describe('Hapi server', () => {

    let server;

    beforeEach((done) => {

        server = new Hapi.Server();
        done();
    });

    it('should reject invalid options', (done) => {

        server.register({
            register: require('../'),
            options: {
                urll: 'mongodb://localhost:27017'
            }
        }, (err) => {

            expect(err).to.exist();
            done();
        });
    });

    it('should reject invalid decorate', (done) => {

        server.register({
            register: require('../'),
            options: {
                decorate: 1
            }
        }, (err) => {

            expect(err).to.exist();
            done();
        });
    });

    it('should fail with no mongodb listening', (done) => {

        server.register({
            register: require('../'),
            options: {
                url: 'mongodb://localhost:27018'
            }
        }, (err) => {

            expect(err).to.exist();
            done();
        });
    });

    it('should be able to register plugin with just URL', (done) => {

        server.register({
            register: require('../'),
            options: {
                url: 'mongodb://localhost:27017'
            }
        }, done);
    });

    it('should log configuration upon successfull connection', (done) => {

        let logEntry;
        server.once('log', (entry) => {

            logEntry = entry;
        });

        server.register({
            register: require('../'),
            options: {
                url: 'mongodb://localhost:27017'
            }
        }, (err) => {

            if (err)  {
                return done(err);
            }
            expect(logEntry).to.equal({
                timestamp: logEntry.timestamp,
                tags: ['hapi-mongodb', 'info'],
                data: 'MongoClient connection created for {"url":"mongodb://localhost:27017"}',
                internal: false
            });
            done();
        });
    });

    it('should log configuration upon successfull connection, obscurifying DB password', (done) => {

        let logEntry;
        server.once('log', (entry) => {

            logEntry = entry;
        });

        const originalConnect = Mongodb.MongoClient.connect;
        let connected = false;
        Mongodb.MongoClient.connect = (url, options, callback) => {

            Mongodb.MongoClient.connect = originalConnect;
            expect(url).to.equal('mongodb://user:abcdefg@example.com:27017');
            expect(options).to.equal({ poolSize: 11 });
            connected = true;
            callback(null, { });
        };
        server.register({
            register: require('../'),
            options: {
                url: 'mongodb://user:abcdefg@example.com:27017',
                settings: {
                    poolSize: 11
                }
            }
        }, (err) => {

            if (err)  {
                return done(err);
            }
            expect(connected).to.be.true();
            expect(logEntry).to.equal({
                timestamp: logEntry.timestamp,
                tags: ['hapi-mongodb', 'info'],
                data: 'MongoClient connection created for {"url":"mongodb://user:******@example.com:27017","settings":{"poolSize":11}}',
                internal: false
            });
            done();
        });
    });

    it('should be able to register plugin with URL and settings', (done) => {

        server.register({
            register: require('../'),
            options: {
                url: 'mongodb://localhost:27017',
                settings: {
                    poolSize: 10
                }
            }
        }, done);
    });

    it('should be able to find the plugin exposed objects', (done) => {

        server.connection();
        server.register({
            register: require('../'),
            options: {
                url: 'mongodb://localhost:27017'
            }
        }, (err) => {

            expect(err).to.not.exist();

            server.route({
                method: 'GET',
                path: '/',
                handler: (request, reply) => {

                    const plugin = request.server.plugins['hapi-mongodb'];
                    expect(plugin.db).to.exist();
                    expect(plugin.lib).to.exist();
                    expect(plugin.ObjectID).to.exist();

                    done();
                }
            });

            server.inject({
                method: 'GET',
                url: '/'
            }, () => {});
        });
    });

    it('should be able to find the plugin on decorated objects', (done) => {

        server.connection();
        server.register({
            register: require('../'),
            options: {
                url: 'mongodb://localhost:27017',
                decorate: true
            }
        }, (err) => {

            expect(err).to.not.exist();
            expect(server.mongo.db).to.exist();
            expect(server.mongo.lib).to.exist();
            expect(server.mongo.ObjectID).to.exist();

            server.route({
                method: 'GET',
                path: '/',
                handler: (request, reply) => {

                    expect(request.mongo.db).to.exist();
                    expect(request.mongo.lib).to.exist();
                    expect(request.mongo.ObjectID).to.exist();

                    done();
                }
            });

            server.inject({
                method: 'GET',
                url: '/'
            }, () => {});
        });
    });

    it('should be able to find the plugin on custom decorated objects', (done) => {

        server.connection();
        server.register({
            register: require('../'),
            options: {
                url: 'mongodb://localhost:27017',
                decorate: 'db'
            }
        }, (err) => {

            expect(err).to.not.exist();
            expect(server.db.db).to.exist();
            expect(server.db.lib).to.exist();
            expect(server.db.ObjectID).to.exist();

            server.route({
                method: 'GET',
                path: '/',
                handler: (request, reply) => {

                    expect(request.db.db).to.exist();
                    expect(request.db.lib).to.exist();
                    expect(request.db.ObjectID).to.exist();

                    done();
                }
            });

            server.inject({
                method: 'GET',
                url: '/'
            }, () => {});
        });
    });

    it('should fail to mix different decorations', (done) => {

        server.connection();
        server.register({
            register: require('../'),
            options: [{
                url: 'mongodb://localhost:27017',
                decorate: true
            }, {
                url: 'mongodb://localhost:27017',
                decorate: 'foo'
            }]
        }, (err) => {

            expect(err).to.be.an.error('You cannot mix different types of decorate options');
            done();
        });
    });

    it('should connect to a mongodb instance without providing plugin settings', (done) => {

        server.register({
            register: require('../')
        }, (err) => {

            expect(err).to.not.exist();
            const db = server.plugins['hapi-mongodb'].db;
            expect(db).to.be.instanceof(Mongodb.Db);
            expect(db.databaseName).to.equal('test');
            done();
        });
    });

    it('should use the correct default mongodb url in options', (done) => {

        const originalConnect = Mongodb.MongoClient.connect;
        let connected = false;
        Mongodb.MongoClient.connect = (url, options, callback) => {

            Mongodb.MongoClient.connect = originalConnect;
            expect(url).to.equal('mongodb://localhost:27017/test');
            connected = true;
            callback(null, { dbInstance: true });
        };
        server.register({
            register: require('../')
        }, (err) => {

            expect(err).to.not.exist();
            expect(connected).to.be.true();
            const db = server.plugins['hapi-mongodb'].db;
            expect(db).to.equal({ dbInstance: true });
            done();
        });
    });

    it('should be able to have multiple connections', (done) => {

        server.register({
            register: require('../'),
            options: [{ url: 'mongodb://localhost:27017/test0' }, { url: 'mongodb://localhost:27017/test1' }]
        }, (err) => {

            expect(err).to.not.exist();

            const plugin = server.plugins['hapi-mongodb'];
            expect(plugin.db).to.be.an.array().and.to.have.length(2);
            plugin.db.forEach((db, i) => {

                expect(db).to.be.instanceof(Mongodb.Db);
                expect(db.databaseName).to.equal('test' + i);
            });
            done();
        });
    });

    it('should require the "promiseLibrary" before passing it to mongodb', (done) => {

        server.register({
            register: require('../'),
            options: {
                settings: {
                    promiseLibrary: 'bluebird'
                }
            }
        }, done);
    });

    it('should disconnect if the server stops', (done) => {

        server.register({
            register: require('../'),
            options: {
                settings: {
                    promiseLibrary: 'bluebird'
                }
            }
        }, (err) => {

            expect(err).not.to.exist();
            server.initialize(() => {

                server.stop(() => {

                    setTimeout(done, 100); // Let the connections end.
                });
            });
        });
    });
});
