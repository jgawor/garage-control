var fs = require('fs');
var express = require("express")
var bodyParser = require('body-parser');
var http_client = require("request");
var dateFormat = require('dateformat');
var utils = require('./utils');

var config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

var data = {
  'david': { ip: '127.0.0.1', port: 9090, updated: "unknown", status: 1 }
};

app = express();

function ensureSecure(req, res, next) {
    protocol = req.get("x-forwarded-proto")
    if (protocol === "https") {
        return next();
    };
    res.redirect('https://'+req.hostname+req.url);
};

function now() {
    return dateFormat(new Date(), "default");
}

if (process.env.VCAP_SERVICES) {
    app.all('*', ensureSecure);
}

app.set('view engine', 'pug');
app.use('/static', express.static(__dirname + '/static'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }))

// index page
app.get("/", function (request, response) {
    response.render("index");
});

// register garage & update status
app.post("/status", utils.basicAuth(config.users), function (request, response) {
    client_ip = request.get("x-client-ip")

    console.log("client ip %s", client_ip)
    console.log("user is %s", request.remoteUser)
    console.log(request.body)
    
    status = request.body.status

    piInfo = {
        'ip': client_ip,
        'port': 9090,
        'status': status,
        'updated': now()
    }

    data[request.remoteUser] = piInfo

    response.sendStatus(204)
});



app.get("/:garageId", function (request, response) {
    piInfo = data[request.params.garageId];
    if (piInfo == null) {
        response.sendStatus(404);
    } else {
        response.render("status", { garageId: request.params.garageId, 'pi': piInfo, error: request.query.error} );
    }
});

app.get("/:garageId/refresh", function (request, response) {
    piInfo = data[request.params.garageId];
    if (piInfo == null) {
        response.sendStatus(404);
    } else {
        url = "https://" + piInfo.ip + ":" +  piInfo.port + "/api/door/status";
        console.log('Invoking:', url);
        var options = {
            timeout: 1000 * 30,
            strictSSL: false
        }
        http_client.get(url, options, function (error, res, body) {
            if (error) {
                console.log('Error:', error);
                redirectWithError(response, request.params.garageId, "Error connecting to garage door controller (" + error.code + ")");
            } else {
                console.log('Status code:', res.statusCode);
                if (res.statusCode == 200) {
                    console.log(body);
                    jsonObject = JSON.parse(body);
                    piInfo.status = jsonObject.status;
                    piInfo.updated = now();
                    response.redirect("/" + request.params.garageId)
                } else {
                    redirectWithError(response, request.params.garageId, "Unexpected status code (" + res.statusCode + ")");
                }
            }
        });
    }
});

function redirectWithError(response, garageId, errorMsg) {
    var encodedMsg = encodeURIComponent(errorMsg);
    response.redirect("/" + garageId + "?error=" + encodedMsg);
}

app.post("/:garageId/activate", function (request, response) {
    piInfo = data[request.params.garageId];
    if (piInfo == null) {
        response.sendStatus(404);
    } else {
        pin = request.body.pin;
        if (!pin) {
            redirectWithError(response, request.params.garageId, "Code is required to activate the door.");
            return;
        }
        url = "https://" + piInfo.ip + ":" +  piInfo.port + "/api/door/activate";
        console.log('Invoking:', url);
        var options = {
            timeout: 1000 * 30,
            strictSSL: false,
            auth: {
                user: request.params.garageId,
                pass: pin
            }
        }
        http_client.post(url, options, function (error, res, body) {
            if (error) {
                console.log('Error:', error);
                redirectWithError(response, request.params.garageId, "Error connecting to garage door controller (" + error.code + ")");
            } else {
                console.log('Status code:', res.statusCode);
                if (res.statusCode == 401) {
                    redirectWithError(response, request.params.garageId, "Code is incorrect.");
                } else if (res.statusCode == 204) {
                    response.render("toggle", { garageId: request.params.garageId });
                } else if (res.statusCode == 200) {
                    console.log(body);
                    jsonObject = JSON.parse(body);
                    piInfo.status = jsonObject.status;
                    piInfo.updated = now();
                    response.redirect("/" + request.params.garageId)
                } else {
                    redirectWithError(response, request.params.garageId, "Unexpected status code (" + res.statusCode + ")");
                }
            }
        });
    }
});

var port = process.env.VCAP_APP_PORT || 7070;
app.listen(port);
