# Hapi-MongoDB

This is a plugin to share a common MongoDB connection pool across the whole Hapi server.

The versioning of this lib shares the major/minor versions of the mongodb library.

It takes 2 options :

- url: MongoDB connection string (eg. `mongodb://user:pass@localhost:27017`),
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
    "options": {
        "db": {
            "native_parser": false
        }
    }
};

var server = new Hapi.Server(8080);

server.pack.require('hapi-mongodb', dbOpts, function(err) {
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

function usersHandler(request) {
    var db = this.server.plugins['hapi-mongodb'].db;
    var ObjectID = this.server.plugins['hapi-mongodb'].ObjectID;

    db.collection('users').findOne({  "_id" : new ObjectID(request.params.id) }, function(err, result) {
        if (err) return request.reply(Hapi.error.internal('Internal MongoDB error', err));
        request.reply(result);
    });
};

server.start(function() {
    console.log("Server started at " + server.info.uri);
});
```

Huge thanks to [@dypsilon](https://github.com/dypsilon) for his help into the making of this plugin.
