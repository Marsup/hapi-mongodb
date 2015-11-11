[![npm version](https://badge.fury.io/js/hapi-mongodb.svg)](http://badge.fury.io/js/hapi-mongodb)
[![Build Status](https://secure.travis-ci.org/Marsup/hapi-mongodb.svg)](http://travis-ci.org/Marsup/hapi-mongodb)
[![Dependencies Status](https://david-dm.org/Marsup/hapi-mongodb.svg)](https://david-dm.org/Marsup/hapi-mongodb)
[![DevDependencies Status](https://david-dm.org/Marsup/hapi-mongodb/dev-status.svg)](https://david-dm.org/Marsup/hapi-mongodb#info=devDependencies)

# Hapi-MongoDB

This is a plugin to share a common MongoDB connection pool across the whole Hapi server.

Options can be a single object with the following keys or an array of the same kind if you need multiple connections :

- url: *Optional.* MongoDB connection string (eg. `mongodb://user:pass@localhost:27017`).
    - defaults to `mongodb://localhost:27017`
- settings: *Optional.* Provide extra settings to the connection, see [documentation](http://mongodb.github.io/node-mongodb-native/driver-articles/mongoclient.html#mongoclient-connect-options).
- decorate: *Optional.* Rather have exposed objects accessible through server and request decorations.
    - If `true`, `server.mongo` or `request.mongo`
    - If it's a string, `server.<string>` or `request.<string>`

Several objects are exposed by this plugin :

- `db` : connection object to the database, if an array was provided for the configuration, it will be an array of connections in the same order
- `lib` : mongodb library in case you need to use it
- `ObjectID` : mongodb ObjectID constructor in case you need to use it

Usage example :
```js
var Hapi = require("hapi");
var Boom = require("boom");

var dbOpts = {
    "url": "mongodb://localhost:27017/test",
    "settings": {
        "db": {
            "native_parser": false
        }
    }
};

var server = new Hapi.Server();

server.register({
    register: require('hapi-mongodb'),
    options: dbOpts
}, function (err) {
    if (err) {
        console.error(err);
        throw err;
    }
});

server.route( {
    "method"  : "GET",
    "path"    : "/users/{id}",
    "handler" : usersHandler
});

function usersHandler(request, reply) {
    var db = request.server.plugins['hapi-mongodb'].db;
    var ObjectID = request.server.plugins['hapi-mongodb'].ObjectID;

    db.collection('users').findOne({  "_id" : new ObjectID(request.params.id) }, function(err, result) {
        if (err) return reply(Boom.internal('Internal MongoDB error', err));
        reply(result);
    });
};

server.start(function() {
    console.log("Server started at " + server.info.uri);
});
```
