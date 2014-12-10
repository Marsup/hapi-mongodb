var Hapi = require('hapi');
var Lab = require('lab');
var lab = exports.lab = Lab.script();
var describe = lab.describe;
var it = lab.it;
var beforeEach = lab.beforeEach;
var expect = require('code').expect;

describe('Hapi server', function() {

  var server;

  beforeEach(function(done) {
    server = new Hapi.Server();
    done();
  });

  it('should reject invalid options', function(done) {
    server.register({
      register: require('../'),
      options: {
        urll: 'mongodb://localhost:27017'
      }
    }, function(err) {
      expect(err).to.exist();
      done();
    });
  });

  it('should fail with no mongodb listening', function(done) {
    server.register({
      register: require('../'),
      options: {
        url: 'mongodb://localhost:27018'
      }
    }, function(err) {
      expect(err).to.exist();
      done();
    });
  });

  it('should be able to register plugin with just URL', function(done) {
    server.register({
      register: require('../'),
      options: {
        url: 'mongodb://localhost:27017'
      }
    }, function(err) {
      expect(err).to.not.exist();
      done();
    });
  });

  it('should be able to register plugin with URL and settings', function(done) {
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
    }, function(err) {
      expect(err).to.not.exist();
      done();
    });
  });

  it('should be able to find the plugin exposed objects', function(done) {
    server.connection();
    server.register({
      register: require('../'),
      options: {
        url: 'mongodb://localhost:27017'
      }
    }, function(err) {
      expect(err).to.not.exist();

      server.route({
        method: 'GET',
        path: '/',
        handler: function(request, reply) {
          var plugin = request.server.plugins['hapi-mongodb'];
          expect(plugin.db).to.exist();
          expect(plugin.lib).to.exist();
          expect(plugin.ObjectID).to.exist();

          done();
        }
      });

      server.inject({
        method: 'GET',
        url: '/'
      }, function() {});
    });
  });

  it('should use the correct default mongodb url in options', function(done) {
    server.register({
      register: require('../')
    }, function(err) {
      expect(err).to.not.exist();

      expect(server.plugins['hapi-mongodb'].db.options.url).to.equal('mongodb://localhost:27017');
      done();
    });
  });

  it('should be able to have multiple connections', function(done) {
    server.register({
      register: require('../'),
      options: [{}, {}] // 2 default connections
    }, function(err) {
      expect(err).to.not.exist();

      var plugin = server.plugins['hapi-mongodb'];
      expect(plugin.db).to.be.an.array().and.to.have.length(2);
      plugin.db.forEach(function (db) {
        expect(db.options.url).to.equal('mongodb://localhost:27017');
      });
      done();
    });
  });
});
