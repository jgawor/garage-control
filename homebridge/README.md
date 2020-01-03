

# homebridge-garage-control
[Homebridge](https://github.com/nfarina/homebridge) plugin. Based on https://github.com/apexad/homebridge-garagedoor-command.

## Install

Install the plugin:
```
npm install -g
```

Restart HomeBridge and follow logs:
```
systemctl restart homebridge
journalctl -f -n 200 -u homebridge
```

## Configuration

Edit `/var/lib/homebridge/config.json` and add the following:

```
    ...
    "accessories": [
        {
            "accessory": "GarageControl",
            "name": "Garage Door",
            "url": "<garageUrl>",
            "garageId": "<garageId>",
            "garagePin": "<garagePin>",
            "status_update_delay": 13,
            "poll_state_delay": 30
	    }
    ],
    ...
```
