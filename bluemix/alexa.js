var alexa = require("alexa-app");
var http_client = require("request");
var utils = require('./utils');
var alexa_verifier = require('alexa-verifier');

function get_status(data, name, alexa_response) {
    piInfo = data[name];
    if (piInfo == null) {
        alexa_response.say("Unexpected error");
        alexa_response.send();
        return;
    }
    url = "https://" + piInfo.ip + ":" +  piInfo.port + "/api/door/status";
    console.log('Invoking:', url);
    var options = {
        timeout: 1000 * 30,
        strictSSL: false
    }
    http_client.get(url, options, function (error, res, body) {
        if (error) {
            console.log('Error:', error);
            alexa_response.say("Error connecting to garage door controller (" + error.code + ")");
        } else {
            console.log('Status code:', res.statusCode);
            if (res.statusCode == 200) {
                console.log(body);
                jsonObject = JSON.parse(body);
                piInfo.status = jsonObject.status;
                piInfo.updated = utils.now();
                if (piInfo.status == 0) {
                    alexa_response.say("The door is closed");
                } else {
                    alexa_response.say("The door is opened");
                }
            } else {
                alexa_response.say("Unexpected status code (" + res.statusCode + ")");
            }
        }
        alexa_response.send();
    });
}

function activate_door(data, name, alexa_response, status) {
    piInfo = data[name];
    if (piInfo == null) {
        alexa_response.say("Unexpected error");
        alexa_response.send();
        return;
    }
    url = "https://" + piInfo.ip + ":" +  piInfo.port + "/api/door/activate";
    console.log('Invoking:', url);
    var options = {
        json: {
            status: status
        },
        timeout: 1000 * 30,
        strictSSL: false,
        auth: {
            user: name,
            pass: piInfo.access_token
        }
    }
    http_client.post(url, options, function (error, res, body) {
        if (error) {
            console.log('Error:', error);
            alexa_response.say("Error connecting to garage door controller (" + error.code + ")");
        } else {
            console.log('Status code:', res.statusCode);
            if (res.statusCode == 401) {
                alexa_response.say("The access token is incorrect.");
            } else if (res.statusCode == 204) {
                if (status == 0) {
                    alexa_response.say("The door is closing");
                } else {
                    alexa_response.say("The door is opening");
                }
            } else if (res.statusCode == 202) {
                if (status == 0) {
                    alexa_response.say("The door is already closed");
                } else {
                    alexa_response.say("The door is already opened");
                }
            } else {
                alexa_response.say("Unexpected status code (" + res.statusCode + ")");
            }
        }
        alexa_response.send();
    });
}

exports.setup = function(data, name, app) {
    if (name in alexa.apps) {
        console.log("Alexa skill already setup for %s", name)
        return
    }

    applicationId = data[name].alexa_app_id;
    if (applicationId == null) {
        console.log("Alexa applicationId not set for %s", name)
        return
    }
    
    console.log("Setting up Alexa skill for %s with app id %s", name, applicationId)
    
    var alexaApp = new alexa.app(name, name + "/alexa");
    
    alexaApp.pre = function(request, response, type) {
        requestAppId = request.data.session.application.applicationId
        if (requestAppId != applicationId) {
            console.log("Invalid applicationId %s", requestAppId);
            response.fail("Invalid applicationId");
        }
    };
    
    alexaApp.intent("statusIntent", {
        "utterances": [
            "is the door open", "is the door closed"
        ]
    },
    function(request, response) {
        get_status(data, name, response);
        return false;
    }
    );

    alexaApp.intent("closeIntent", {
        "utterances": [
            "close the door", "close", "close door"
        ]
    },
    function(request, response) {
        activate_door(data, name, response, 0);
        return false;
    }
    );

    alexaApp.intent("openIntent", {
        "utterances": [
            "open the door", "open", "open door"
        ]
    },
    function(request, response) {
        activate_door(data, name, response, 1);
        return false;
    }
    );

    alexaApp.express(app, "/");
};

    
exports.verifier = function() {
    return function (req, res, next) {
        if (req.method == 'GET') {
            return next();
        }
        
        console.log("verify %s", req.headers.signaturecertchainurl);
    
	    // mark the request body as already having been parsed so it's ignored by
	    // other body parser middlewares
	    req._body = true;
	    req.rawBody = '';
	    req.on('data', function(data) {
		    return req.rawBody += data;
	    });
        
	    req.on('end', function() {
		    var cert_url, er, error, requestBody, signature;
            
		    try {
			    req.body = JSON.parse(req.rawBody);
		    } catch (error) {
			    er = error;
			    req.body = {};
		    }

		    cert_url = req.headers.signaturecertchainurl;
		    signature = req.headers.signature;
		    requestBody = req.rawBody;
            
		    alexa_verifier(cert_url, signature, requestBody, function(er) {
			    if (er) {
				    console.error('error validating the alexa cert:', er);
				    res.status(401).json({ status: 'failure', reason: er });
			    } else {
				    next();
			    }
		    });
	    });
    };
};

