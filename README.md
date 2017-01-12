# Garage door controller

The Garage door controller contains of two parts: back-end and front-end.

The [back-end](./pi/REAMDE.md) part runs on [Raspberry PI](https://www.raspberrypi.org/) and directly controls the garage door opener. The back-end also provides a basic integration with the [IFTTT](https://ifttt.com/) service. It can be used to trigger an action if for example the garage door is left open late at night.

The [front-end](./bluemix/README.md) part runs on [IBM Bluemix](https://bluemix.net) and provides a web interface for the back-end. The front-end also provides integration with [Amazon Alexa](https://developer.amazon.com/alexa) to enable voice control.



