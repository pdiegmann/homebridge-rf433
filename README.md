# homebridge-rf433

Control RF outlets with HomeKit / Siri

# Installation

1. Install [WiringPi](https://projects.drogon.net/raspberry-pi/wiringpi/download-and-install/)
1. Install homebridge: `npm install -g homebridge`
1. Install homebridge-rf433: `npm install --global
   homebridge-rf433`
1. Update your configuration file.

# Configuration

See `sample-config.json`:
`
{
  "accessory": "RF433",
  "name": "Reading Light",
  "systemCode": "11011",
  "unitCode": 3,
  "serviceType": "Lightbulb"
}

`
