var Hapi = require('hapi');
var assert = require('assert');

describe('Hapi server', function() {
  var server = null;

  beforeEach(function() {
    server = new Hapi.Server();
  });

  afterEach(function () {
    server = null;
  });

  it('should be able to register plugin with just URL', function(done) {
    server.pack.register({
        plugin: require('../'),
        options: {
            url: 'mongodb://localhost:27017'
        }
     }, function (err) {
         assert(err === undefined, 'An error was thrown but should not have been.');
         done();
     });
  });

  it('should be able to register plugin with URL and settings', function(done) {
    server.pack.register({
        plugin: require('../'),
        options: {
            url: 'mongodb://localhost:27017',
            settings: {
              db : {
                native_parser : false
              }
            }
        }
     }, function (err) {
         assert(err === undefined, 'An error was thrown but should not have been.');
         done();
     });
  });

  it('should not be able to register the plugin without URL', function(done) {
    assert.throws(function () {
        server.pack.register({
            plugin: require('../')
        }, function () {

        });
      },
      /MongoDB URL is required/
    );

    done();
  });

  it('should be able to find the plugin exposed objects', function(done) {
    server.pack.register({
      plugin: require('../'),
      options: {
        url: 'mongodb://localhost:27017'
      }
    }, function (err) {
      server.route({ method: 'GET', path: '/', handler: function(request, reply) {
        assert(request.server.plugins['hapi-mongodb'].db, 'Could not find db object');
        assert(request.server.plugins['hapi-mongodb'].lib, 'Could not find mongodb library');
        assert(request.server.plugins['hapi-mongodb'].ObjectID, 'Could not find mongodb ObjectID');

        done();
      }});

      server.inject({ method: 'GET', url: '/' }, function() {});
    });
  });
});
