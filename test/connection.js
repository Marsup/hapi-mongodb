var Hapi = require('hapi');
var assert = require('assert');

describe('Hapi server', function() {
  before(function() {
    this.server = new Hapi.Server();
  });
  it('should be able to register plugin', function(done) {
    this.server.pack.require({
      '..': {
        url: 'mongodb://localhost:27017'
      }
    }, done);
  });
  it('should be able to find the plugin exposed objects', function(done) {
    this.server.route({ method: 'GET', path: '/', handler: function() {
      assert(this.server.plugins['hapi-mongodb'].db, 'Could not find db object');
      assert(this.server.plugins['hapi-mongodb'].lib, 'Could not find mongodb library');
      assert(this.server.plugins['hapi-mongodb'].ObjectID, 'Could not find mongodb ObjectID');
      done();
    }});
    this.server.inject({ method: 'GET', url: '/' }, function() {});
  });
});
