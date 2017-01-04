var auth = require('basic-auth')
var moment = require('moment-timezone');

exports.basicAuth = function(users) {
    return function(req, res, next) {
        var user = auth(req);

        if (!user || !users[user.name] || users[user.name].password !== user.pass) {
            res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
            return res.sendStatus(401);
        }

        req.remoteUser = user.name;
        return next();
    }
};

exports.now = function() {
    return moment().tz("America/New_York").format("dddd, MMMM Do YYYY, h:mm:ss a");
};
