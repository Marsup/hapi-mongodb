[![Build Status](https://secure.travis-ci.org/Marsup/hapi-mongodb.png)](http://travis-ci.org/Marsup/hapi-mongodb)
[![Dependencies Status](https://david-dm.org/Marsup/hapi-mongodb.png)](https://david-dm.org/Marsup/hapi-mongodb)
[![DevDependencies Status](https://david-dm.org/Marsup/hapi-mongodb/dev-status.png)](https://david-dm.org/Marsup/hapi-mongodb#info=devDependencies)

# Hapi-MongoDB

This is a plugin to share a common MongoDB connection pool across the whole Hapi server.

It takes 2 options :

- url: *Optional.* MongoDB connection string (eg. `mongodb://user:pass@localhost:27017`),
    - defaults to `mongodb://localhost:27017`
- settings: *Optional.* Provide extra settings to the connection, see [documentation](http://mongodb.github.io/node-mongodb-native/driver-articles/mongoclient.html#mongoclient-connect-options).

Several objects are exposed by this plugin :

- `db` : connection object to the database
- `lib` : mongodb library in case you need to use it
- `ObjectID` : mongodb ObjectID constructor in case you need to use it

Usage example :
```js
var Hapi = require("hapi");

var dbOpts = {
    "url": "mongodb://localhost:27017/test",
    "settings": {
        "db": {
            "native_parser": false
        }
    }
};

var server = new Hapi.Server(8080);

server.pack.register({
    plugin: require('hapi-mongodb'),
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
        if (err) return reply(Hapi.error.internal('Internal MongoDB error', err));
        reply(result);
    });
};

server.start(function() {
    console.log("Server started at " + server.info.uri);
});
```

Huge thanks to [@dypsilon](https://github.com/dypsilon) for his help into the making of this plugin.
