var fs = require('fs');
var express = require("express");
var https = require('https');
var process = require('child_process');
var utils = require('./utils');
var crypto = require('crypto');
var http_client = require("request");
var bodyParser = require('body-parser');

var config = JSON.parse(fs.readFileSync('conf/config.json', 'utf8'));

var users = {}
users[config.id] = {
    "password": config.door_password
}

const HOUR_DELAY = 60 * 60 * 1000;
const RETRY_DELAY = 30 * 1000;

var registerRetry = 0;

function retry_register() {
    if (registerRetry > 3) {
        registerRetry = 0;
        console.log("Giving up retrying.");
        setTimeout(register, HOUR_DELAY)
    } else {
        console.log("Retrying in %s", RETRY_DELAY * registerRetry);
        setTimeout(register, RETRY_DELAY * registerRetry);
    }
}

var register = function() {
    var access_token = crypto.randomBytes(32).toString('hex')
    var registerData = {
        status: door_status(),
        door_delay: config.door_delay,
        alexa_app_id: config.alexa_app_id,
        access_token: access_token
    }
    var registerOptions = {
        json: registerData,
        timeout: 1000 * 30,
        auth: {
            user: config.id,
            pass: config.register_password
        }
    };
    registerRetry++;
    url = config.register_url;
    http_client.post(url, registerOptions, function (error, res, body) {
        if (error) {
            console.log('Error:', error);
            retry_register();
        } else {
            console.log('Status code:', res.statusCode);
            if (res.statusCode == 204) {
                users[config.id]["access_token"] = access_token
                setTimeout(register, HOUR_DELAY)
            } else {
                retry_register();
            }
        }
    });
}

/*
 * Remote app REST API
 */
remote_app = express();
remote_app.use(bodyParser.json());

var remote_app_port = 9090;
https.createServer({
    key: fs.readFileSync('conf/server.key'),
    cert: fs.readFileSync('conf/server.cert')
}, remote_app).listen(remote_app_port);

remote_app.post("/api/door/activate", utils.basicAuth(users), function (request, response) {
    response.setHeader('Content-Type', 'application/json');
    var req_status = request.body.status;
    if (typeof req_status !== "undefined") {
        if (req_status == 0 || req_status == 1) {
            if (req_status == door_status()) {
                response.sendStatus(202);
            } else {
                door_activate();
                response.sendStatus(204);
            }
        } else {
            response.sendStatus(400);
        }
    } else {
        door_activate();
        response.sendStatus(204);
    }
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
    door_activate();
    response.render("toggle", { door_delay: config.door_delay || 15 });
});

function door_status() {
    console.log("getting door status");
    var output = process.execSync("./scripts/control.sh status");
    console.log("door status", output.toString());
    var status = parseInt(output.toString().trim());
    return status;
}

function door_activate() {
    console.log("activating door");
    var output = process.execSync("./scripts/control.sh activate");
    console.log("door activate", output.toString());
}

function door_init() {
    console.log("door init");
    var output = process.execSync("./scripts/control.sh init");
    console.log("door inited", output.toString());
}

door_init();
register();
