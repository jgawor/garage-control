var fs = require('fs');
var express = require("express")
var bodyParser = require('body-parser');
var http_client = require("request");
var utils = require('./utils');

var config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

var data = {
  'david': { ip: '127.0.0.1', updated: "unknown", status: 1 }
};

app = express();

function ensureSecure(req, res, next) {
    protocol = req.get("x-forwarded-proto")
    if (protocol === "https") {
        return next();
    };
    res.redirect('https://'+req.hostname+req.url);
};

// app.all('*', ensureSecure);

app.set('view engine', 'pug');
app.use('/static', express.static(__dirname + '/static'));

app.use(bodyParser.json());

app.get("/", function (request, response) {
    response.render("index");
});

app.get("/status/:username", function (request, response) {
    piInfo = data[request.params.username];
    if (piInfo == null) {
        response.sendStatus(404);
    } else {
        response.render("status", { 'user': request.params.username, 'pi': piInfo});
    }
});

app.post("/status", utils.basicAuth(config.users), function (request, response) {
    client_ip = request.get("x-client-ip")

    console.log("client ip %s", client_ip)
    console.log("user is %s", request.remoteUser)
    console.log(request.body)
    
    status = request.body.status
    updated = new Date();

    piInfo = {
        'ip': client_ip,
        'status': status,
        'updated': updated
    }

    data[request.remoteUser] = piInfo

    response.sendStatus(200)
});

app.get("/refresh/:username", function (request, response) {
    piInfo = data[request.params.username];
    if (piInfo == null) {
        response.sendStatus(404);
    } else {
        port = "9090";
        url = "https://" + piInfo.ip + ":" + port + "/door/status";
        console.log(url);
        var options = {
            timeout: 1000 * 30,
            strictSSL: false
        }
        http_client.get(url, options, function (error, res, body) {
            if (error) {
                console.log('Error:', error);
            }
            if (response.statusCode !== 200) {
                console.log('Invalid Status Code Returned:', response.statusCode);
            }
            if (!error && response.statusCode == 200) {
                console.log(body);
                jsonObject = JSON.parse(body);
                piInfo.status = jsonObject.status;
                piInfo.updated = new Date();
            }
            response.redirect("/status/" + request.params.username);
        });
    }
});

var port = process.env.VCAP_APP_PORT || 7070;
app.listen(port);
