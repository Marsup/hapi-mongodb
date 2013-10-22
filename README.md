# Hapi-MongoDB

This is a plugin to share a common MongoDB connection pool across the whole Hapi server.

The versioning of this lib shares the major/minor versions of the mongodb library.

It takes 2 options :

- url: MongoDB connection string (eg. `mongodb://user:pass@localhost:27017`),
- settings: *Optional.* Provide extra settings to the connection, see [documentation](http://mongodb.github.io/node-mongodb-native/driver-articles/mongoclient.html#mongoclient-connect-options).

Huge thanks to [@dypsilon](https://github.com/dypsilon) for his help into the making of this plugin.
