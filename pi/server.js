var fs = require('fs');
var express = require("express");
var https = require('https');
var utils = require('./utils');

var config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

/*
 * Remote app REST API
 */
remote_app = express();
var remote_app_port = 9090;
https.createServer({
    key: fs.readFileSync('server.key'),
    cert: fs.readFileSync('server.cert')
}, remote_app).listen(remote_app_port);

remote_app.post("/api/door/activate", utils.basicAuth(config.users), function (request, response) {
    response.setHeader('Content-Type', 'application/json');
    activate_door();
    response.sendStatus(204);
});

remote_app.get("/api/door/status", function (request, response) {
    response.setHeader('Content-Type', 'application/json');
    status = door_status()
    response.json({ status: status });
});

/*
 * Local app
 */
local_app = express();
var local_app_port = 8080;
local_app.listen(local_app_port);

local_app.set('view engine', 'pug');
local_app.use('/static', express.static(__dirname + '/static'));

local_app.get("/", function (request, response) {
    status = door_status()
    response.render("status", { status: status });
});

local_app.post("/door/activate", function (request, response) {
    activate_door();
    response.render("toggle");
});


function door_status() {
    console.log("getting door status");
    return 0
}

function activate_door() {
    console.log("activating door");
}
