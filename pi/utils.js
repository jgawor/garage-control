var auth = require('basic-auth')

exports.basicAuth = function(users) {
    return function(req, res, next) {
        var user = auth(req);

        if (!user || !users[user.name] || users[user.name].password !== user.pass) {
            res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
            return res.send(401);
        }

        req.remoteUser = user.name;
        return next();
    }
};
