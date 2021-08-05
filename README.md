[![npm version](https://badge.fury.io/js/hapi-mongodb.svg)](http://badge.fury.io/js/hapi-mongodb)
[![Build Status](https://github.com/Marsup/hapi-mongodb/actions/workflows/ci.yml/badge.svg)](https://github.com/Marsup/hapi-mongodb/actions?query=workflow%3Aci)

# Hapi-MongoDB

This is a plugin to share a common MongoDB connection pool across the whole Hapi server.

Options can be a single object with the following keys or an array of the same kind if you need multiple connections :

- url: *Optional.* MongoDB connection string (eg. `mongodb://user:pass@localhost:27017`).
    - defaults to `mongodb://localhost:27017`
- settings: *Optional.* Provide extra settings to the connection, see [documentation](http://mongodb.github.io/node-mongodb-native/3.1/api/MongoClient.html#.connect).
- decorate: *Optional.* Rather have exposed objects accessible through server and request decorations. You cannot mix different types of decorations.
    - If `true`, `server.mongo` or `request.mongo`
    - If it's a string, `server.<string>` or `request.<string>`

Several objects are exposed by this plugin :

- `client` : [`MongoClient`](http://mongodb.github.io/node-mongodb-native/3.1/api/MongoClient.html) for that connection. If an array was provided for the configuration, it will be an array of `MongoClient`s in the same order
- `db` : [`Db`](http://mongodb.github.io/node-mongodb-native/3.1/api/Db.html) for that connection. If an array was provided for the configuration, it will be an array of `Db`s in the same order
- `lib` : mongodb library in case you need to use it
- `ObjectID` : mongodb ObjectID constructor in case you need to use it

Usage example :
```js
const Hapi = require('hapi');
const Boom = require('boom');

const launchServer = async function() {
    
    const dbOpts = {
        url: 'mongodb://localhost:27017/test',
        settings: {
            poolSize: 10
        },
        decorate: true
    };
    
    const server = Hapi.server();
    
    await server.register({
        plugin: require('hapi-mongodb'),
        options: dbOpts
    });

   server.route( {
        method: 'GET',
        path: '/users/{id}',
        async handler(request) {

            const db = request.mongo.db;
            const ObjectID = request.mongo.ObjectID;

            try {
                const result = await db.collection('users').findOne({  _id: new ObjectID(request.params.id) });
                return result;
            }
            catch (err) {
                throw Boom.internal('Internal MongoDB error', err);
            }
        }
    });

    await server.start();
    console.log(`Server started at ${server.info.uri}`);
};

launchServer().catch((err) => {
    console.error(err);
    process.exit(1);
});
```

## Compatibility level

* Hapi >= 17
* Node.js >= 8

Ships with `mongodb` 3.x.
