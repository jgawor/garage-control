#!/bin/sh

CONFIG="./conf/config.json"

status=`./scripts/control.sh status`
user=`jq -r .id $CONFIG`
password=`jq -r .door_password $CONFIG`

curl --retry 3 -H "Content-Type: application/json" -X POST -d "{\"status\":$status}" --user $user:$password https://mygarage.mybluemix.net/status
