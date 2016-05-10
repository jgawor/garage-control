#!/bin/sh                                                                                                                                                            
PI_DIR=`dirname $0`/..
CONFIG="$PI_DIR/conf/config.json"

ifttt_key=`jq -r .ifttt_key $CONFIG`
ifttt_event="garage_door_open"

if [ "$ifttt_key" = "null" ]; then
    echo "IFTTT key is not set."
    exit 1
fi

status=`$PI_DIR/scripts/control.sh status`

if [ $status -eq "0" ]; then
    echo "Garage closed."
else
    echo "Garage open. Triggering IFTTT event."
    garage_id=`jq -r .id $CONFIG`
    url="https://mygarage.mybluemix.net/$garage_id"
    curl --retry 3 -H "Content-Type: application/json" -X POST -d "{\"value1\": \"$url\"}" "https://maker.ifttt.com/trigger/$ifttt_event/with/key/$ifttt_key"
fi
