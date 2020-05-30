var Service, Characteristic;
var pjson = require('./package.json');
var config = require('./sample-config.json');
var request = require('request');
var path = require('path');

module.exports = function (homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;

    homebridge.registerAccessory('homebridge-rf433-without-server', 'RF433', RF433Accessory);
};

function RF433Accessory(log, config) {
  var exec = require('child_process').exec;
  var path = require('path');
    
  this.log = log;
  this.name = config.name || "RF 433 MHz";
  this.manufacturer = config.manufacturer || "N/A";
  this.version = config.version || pjson.version;
  this.serviceType = config.serviceType || "Switch";
  this.pin = config.pin || 0;
  this.systemCode = config.systemCode || "11111";
  this.unitCode = config.unitCode || "1";
  var fallbackPath = path.join("usr", "bin", "send");
  this.execPath = config.execPath || fallbackPath;

  this.gpioServer = config.gpioServer || { protocol: "http", host: "localhost", port: 8672 }

  this.powerState = false;

  /**
  
  IMPORTANT:    Due to ristrictions of different docker images and my inherent laziness, I outsourced the GPIO server
                to a dedicated (docker) image.
  
  var execPath = path.join(__dirname, "GPIOServer.js");
  exec(["node", execPath, "port=" + this.gpioServer.port].join(' '), function (error, stdout, stderr) {
    error = error || stderr;
    if(error && (error + "").indexOf("EADDRINUSE") < 0) {
      this.log("Something went wrong: " + error);
    }
  }.bind(this));
  **/

  return this;
}

RF433Accessory.prototype.callCmdViaServer = function(powerState, callback) {
  this.log("setting " + this.systemCode + "." + this.unitCode + " on " + this.pin + " to " + (powerState ? "on" : "off"));

  var url = this.gpioServer.protocol + "://" + this.gpioServer.host + ":" + this.gpioServer.port;
request.debug = true;
  request({
    url + "?execPath=" + this.execPath + "&pin=" + this.pin + "&systemCode=" + this.systemCode + "&unitCode=" + this.unitCode + "&powerState=" + this.powerState,
    /**
    qs: {
        "execPath": this.execPath,
        "pin": this.pin,
        "systemCode": this.systemCode,
        "unitCode": this.unitCode,
        "powerState": this.powerState
      }
    },
    **/
    function (error, response, body) {
      if (!error && response.statusCode == 200) {
        callback(error, true);
      } else {
        if(error) {
          this.log("Something went wrong: " + error);
        }

        callback(null, true);
      }
  }.bind(this));
};

RF433Accessory.prototype.switchOn = function(callback) {
  this.powerState = true;
  this.callCmdViaServer(true, callback);
};

RF433Accessory.prototype.switchOff = function(callback) {
  this.powerState = false;
  this.callCmdViaServer(false, callback);
};

RF433Accessory.prototype.setPowerState = function(powerState, callback) {
  if (powerState) {
    this.switchOn(callback);
  } else {
    this.switchOff(callback);
  }
};

RF433Accessory.prototype.getPowerState = function(callback) {
  callback(null, this.powerState);
};

RF433Accessory.prototype.getServices = function () {
    var services = [];

    this.informationService = new Service.AccessoryInformation();
    this.informationService
      .setCharacteristic(Characteristic.Name, this.name)
      .setCharacteristic(Characteristic.Manufacturer, this.manufacturer)
      .setCharacteristic(Characteristic.SoftwareRevision, this.version);
    services.push(this.informationService);

    if (this.serviceType == "Lightbulb" || this.serviceType == "lightbulb" || this.serviceType == "Light" || this.serviceType == "light") {
      this.switchService = new Service.Lightbulb(this.name);
      this.switchService.getCharacteristic(Characteristic.On)
        .on('set', this.setPowerState.bind(this))
        .on('get', this.getPowerState.bind(this))
      services.push(this.switchService);
    } else if (this.serviceType == "StatelessSwitch" || this.serviceType == "statelessswitch" || this.serviceType == "StatelessProgrammableSwitch" || this.serviceType == "statelessprogrammableswitch") {
      this.switchService = new Service.Switch(this.name);
      this.switchService.getCharacteristic(Characteristic.On)
        .on('set', this.setPowerState.bind(this))
        .on('get', this.getPowerState.bind(this))
      services.push(this.switchService);
    } else if (this.serviceType == "Fan" || this.serviceType == "fan") {
      this.switchService = new Service.Fan(this.name);
      this.switchService.getCharacteristic(Characteristic.On)
        .on('set', this.setPowerState.bind(this))
        .on('get', this.getPowerState.bind(this))
      services.push(this.switchService);
    } else {
      this.switchService = new Service.StatelessProgrammableSwitch(this.name);
      this.switchService.getCharacteristic(Characteristic.ProgrammableSwitchEvent)
        .on('set', this.setPowerState.bind(this));
      services.push(this.switchService);
    }

    return services;
};
