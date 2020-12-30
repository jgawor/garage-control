#!/bin/sh

PI_DIR=`dirname $0`/..
CONFIG="$PI_DIR/conf/config.json"

status=`$PI_DIR/scripts/control.sh status`

if [ $status -eq "0" ]; then
    echo "Garage closed."
else
    echo "Garage open. Sending email notification."
    garage_id=`jq -r .id $CONFIG`
    email_address=`jq -r .notify_email $CONFIG`
    url="https://mygarage.mybluemix.net/$garage_id"
    echo "Dude! Your garage door is open. $url" | mail "$email_address"
fi
