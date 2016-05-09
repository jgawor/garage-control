#!/bin/sh

PI_DIR=`dirname $0`/..
CONFIG="$PI_DIR/conf/config.json"

status=`$PI_DIR/scripts/control.sh status`
user=`jq -r .id $CONFIG`
password=`jq -r .register_password $CONFIG`

curl --retry 3 -H "Content-Type: application/json" -X POST -d "{\"status\":$status}" --user $user:$password https://mygarage.mybluemix.net/status
