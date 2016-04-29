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

remote_app.post("/door/activate", utils.basicAuth(config.users), function (request, response) {
    response.setHeader('Content-Type', 'application/json');
    response.send(JSON.stringify({ a: 1 }, null, 3)); 
});

remote_app.get("/door/status", function (request, response) {
    response.setHeader('Content-Type', 'application/json');
    response.send(JSON.stringify({ a: 1 }, null, 3));
});

/*
 * Local app REST API
 */
local_app = express();
var local_app_port = 8080;
local_app.listen(local_app_port);

local_app.set('view engine', 'pug');

local_app.get("/", utils.basicAuth(config.users), function (request, response) {
    response.render("status", { status: 1 });
});

local_app.post("/door/activate", function (request, response) {
    response.render("toggle");
});
