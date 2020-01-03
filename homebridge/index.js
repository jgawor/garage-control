var Service;
var Characteristic;
var http_client = require("request");


module.exports = function (homebridge) {
	Service = homebridge.hap.Service;
	Characteristic = homebridge.hap.Characteristic;
	homebridge.registerAccessory('homebridge-garage-control', 'GarageControl', GarageCmdAccessory);
};

function GarageCmdAccessory(log, config) {
	this.log = log;
	this.name = config.name;
	this.url = config.url;
	this.garageId = config.garageId;
	this.garagePin = config.garagePin;
	this.statusUpdateDelay = config.status_update_delay || 15;
	this.pollStateDelay = config.poll_state_delay || 0;
	this.ignoreErrors = config.ignore_errors || false;
}

GarageCmdAccessory.prototype.setState = function (isClosed, callback, context) {
	if (context === 'pollState') {
		// The state has been updated by the pollState command - don't run the open/close command
		callback(null);
		return;
	}

	var accessory = this;
	url = this.url + "/api/door/activate"
	console.log('Invoking:', url);
	var options = {
		timeout: 1000 * 30,
		strictSSL: false,
		auth: {
			user: accessory.garageId,
			pass: accessory.garagePin
		}
	}
	accessory.log('Current status: ' + isClosed);
	http_client.post(url, options, function (error, res, body) {
		if (error) {
			accessory.log('Error: ' + error);
			callback(error || new Error('Error setting state of ' + accessory.name));
		} else {
			console.log('Status code:', res.statusCode);
			if (res.statusCode == 401) {
				callback(new Error("Code is incorrect."));
			} else if (res.statusCode == 204) {
				// stop auto-refresh
				if (accessory.stateTimer) {
					clearTimeout(accessory.stateTimer);
					accessory.stateTimer = null;
				}

				if (isClosed) {
					accessory.garageDoorService.setCharacteristic(Characteristic.CurrentDoorState, Characteristic.CurrentDoorState.OPENING);
					setTimeout(
						function () {
							accessory.garageDoorService.setCharacteristic(Characteristic.CurrentDoorState, Characteristic.CurrentDoorState.OPEN);
							accessory.refreshState();
							accessory.pollState();
						},
						accessory.statusUpdateDelay * 1000
					);
				} else {
					accessory.garageDoorService.setCharacteristic(Characteristic.CurrentDoorState, Characteristic.CurrentDoorState.CLOSING);
					setTimeout(
						function () {
							accessory.garageDoorService.setCharacteristic(Characteristic.CurrentDoorState, Characteristic.CurrentDoorState.CLOSED);
							accessory.refreshState();
							accessory.pollState();
						},
						accessory.statusUpdateDelay * 1000
					);
				}
				callback(null);
			} else {
				callback(new Error("Unexpected status code (" + res.statusCode + ")"));
			}

		}
	});
};

GarageCmdAccessory.prototype.getState = function (callback) {
	var accessory = this;

	url = this.url + "/api/door/status";
	var options = {
		timeout: 1000 * 30,
		strictSSL: false
	}
	http_client.get(url, options, function (error, res, body) {
		if (error) {
			accessory.log('Error: ' + error);
			callback(error || new Error('Error getting state of ' + accessory.name));
		} else {
			console.log('Status code:', res.statusCode);
			if (res.statusCode == 200) {
				console.log(body);
				jsonObject = JSON.parse(body);
				if (jsonObject.status == 0) {
					state = 'CLOSED'
				} else if (jsonObject.status == 1) {
					state = 'OPEN'
				}
				accessory.log('State of ' + accessory.name + ' is: ' + state);
				callback(null, Characteristic.CurrentDoorState[state]);
			} else {
				callback(new Error("Unexpected status code (" + res.statusCode + ")"));
			}
		}

		if (accessory.pollStateDelay > 0) {
			accessory.pollState();
		}
	});
};

GarageCmdAccessory.prototype.refreshState = function () {
	var accessory = this;
	accessory.getState(function (err, currentDeviceState) {
		if (err) {
			accessory.log(err);
			return;
		}

		if (currentDeviceState === Characteristic.CurrentDoorState.OPEN || currentDeviceState === Characteristic.CurrentDoorState.CLOSED) {
			// Set the target state to match the actual state
			// If this isn't done the Home app will show the door in the wrong transitioning state (opening/closing)
			accessory.garageDoorService.getCharacteristic(Characteristic.TargetDoorState)
				.setValue(currentDeviceState, null, 'pollState');
		}
		accessory.garageDoorService.setCharacteristic(Characteristic.CurrentDoorState, currentDeviceState);
	})
};

GarageCmdAccessory.prototype.pollState = function () {
	var accessory = this;

	// Clear any existing timer
	if (accessory.stateTimer) {
		clearTimeout(accessory.stateTimer);
		accessory.stateTimer = null;
	}

	accessory.stateTimer = setTimeout(
		function () {
			accessory.refreshState()
		},
		accessory.pollStateDelay * 1000
	);
};

GarageCmdAccessory.prototype.getServices = function () {
	this.informationService = new Service.AccessoryInformation();
	this.garageDoorService = new Service.GarageDoorOpener(this.name, this.name);

	this.informationService
		.setCharacteristic(Characteristic.Manufacturer, 'Garage Control')
		.setCharacteristic(Characteristic.Model, 'Homebridge Plugin')
		.setCharacteristic(Characteristic.SerialNumber, '001');

	this.garageDoorService.getCharacteristic(Characteristic.TargetDoorState)
		.on('set', this.setState.bind(this));

	this.garageDoorService.getCharacteristic(Characteristic.CurrentDoorState)
		.on('get', this.getState.bind(this));
	this.garageDoorService.getCharacteristic(Characteristic.TargetDoorState)
		.on('get', this.getState.bind(this));


	return [this.informationService, this.garageDoorService];
};
