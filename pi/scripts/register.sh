#!/bin/sh

PI_DIR=`dirname $0`/..
CONFIG="$PI_DIR/conf/config.json"

status=`$PI_DIR/scripts/control.sh status`
user=`jq -r .id $CONFIG`
password=`jq -r .register_password $CONFIG`
door_delay=`jq -r .door_delay $CONFIG`

curl --retry 3 -H "Content-Type: application/json" -X POST -d "{\"status\":$status,\"door_delay\":$door_delay}" --user $user:$password https://mygarage.mybluemix.net/status
