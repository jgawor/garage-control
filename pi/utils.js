var auth = require('basic-auth')

exports.basicAuth = function(users) {
    return function(req, res, next) {
        var creds = auth(req);
        if (creds && users[creds.name] && (users[creds.name].password === creds.pass || users[creds.name].access_token === creds.pass)) {
            req.remoteUser = creds.name;
            return next();
        } else {
            res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
            return res.sendStatus(401);
        }
    }
};
