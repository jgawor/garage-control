var express = require("express")
var auth = require('basic-auth')
var bodyParser = require('body-parser');
var http_client = require("request");

var users = {
  'david': { password: 'davidpwd' },
  'jarek': { password: 'jarekpwd' },
};

var data = {
  'david': { ip: '0.0.0.0', updated: "unknown", status: 1 }
};

basicAuth = function(req, res, next) {
    var user = auth(req);

    if (!user || !users[user.name] || users[user.name].password !== user.pass) {
      res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
      return res.send(401);
    }

    req.remoteUser = user.name;
    return next();
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

app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));

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

app.post("/status", basicAuth, function (request, response) {
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
        port = "8080";
        url = "http://" + piInfo.ip + ":" + port + "/door/status";
        console.log(url);
        http_client.get(url, {timeout: 1000 * 30}, function (error, res, body) {
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

var port = process.env.VCAP_APP_PORT || 8080;
app.listen(port);
