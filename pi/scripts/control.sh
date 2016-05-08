#!/bin/sh

LOW=0
HIGH=1

STATUS_PIN=21
RELAY_PIN=17

case "$1" in

    init)
        gpio -g mode $RELAY_PIN out
        gpio -g write $RELAY_PIN $HIGH

        gpio -g mode $STATUS_PIN in
        gpio -g mode $STATUS_PIN up
        ;;

    activate)
        gpio -g write $RELAY_PIN $LOW
        sleep 0.2
        gpio -g write $RELAY_PIN $HIGH
        ;;

    status)
        gpio -g read $STATUS_PIN
        ;;

    *)
        echo "Usage: control.sh {init|activate|status}"
        exit 1
        ;;

esac
