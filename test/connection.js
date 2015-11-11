'use strict';

const Hapi = require('hapi');
const Lab = require('lab');
const lab = exports.lab = Lab.script();
const describe = lab.describe;
const it = lab.it;
const beforeEach = lab.beforeEach;
const expect = require('code').expect;

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

    it('should be able to register plugin with URL and settings', (done) => {

        server.register({
            register: require('../'),
            options: {
                url: 'mongodb://localhost:27017',
                settings: {
                    db: {
                        /* eslint-disable camelcase */
                        native_parser: false
                        /* eslint-enable camelcase */
                    }
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

    it('should use the correct default mongodb url in options', (done) => {

        server.register({
            register: require('../')
        }, (err) => {

            expect(err).to.not.exist();
            expect(server.plugins['hapi-mongodb'].db.options.url).to.equal('mongodb://localhost:27017');
            done();
        });
    });

    it('should be able to have multiple connections', (done) => {

        server.register({
            register: require('../'),
            options: [{}, {}] // 2 default connections
        }, (err) => {

            expect(err).to.not.exist();

            const plugin = server.plugins['hapi-mongodb'];
            expect(plugin.db).to.be.an.array().and.to.have.length(2);
            plugin.db.forEach((db) => expect(db.options.url).to.equal('mongodb://localhost:27017'));
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
});
