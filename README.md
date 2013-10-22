# Hapi-MongoDB

This is a plugin to share a common MongoDB connection pool across the whole Hapi server.

The versioning of this lib shares the major/minor versions of the mongodb library.

It takes 2 options :

- url: MongoDB connection string (eg. `mongodb://user:pass@localhost:27017`),
- settings: *Optional.* Provide extra settings to the connection, see [documentation](http://mongodb.github.io/node-mongodb-native/driver-articles/mongoclient.html#mongoclient-connect-options).

Several objects are exposed by this plugin :

- `db` : connection object to the database
- `lib` : mongodb library in case you need to use it

Usage example :
```js
function handler(request) {
  var db = this.server.plugins['hapi-mongodb'].db;
  db.collection('store').findOne({ id: request.query.id }, function(err, result) {
    if (err) return request.reply(Hapi.error.internal('Internal MongoDB error', err));
    request.reply(result);
  });
}
```

Huge thanks to [@dypsilon](https://github.com/dypsilon) for his help into the making of this plugin.
