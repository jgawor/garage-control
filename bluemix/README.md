# Garage door controller front-end app

## Configure

Before you deploy the app to [IBM Bluemix][] you need to create the `conf/config.json` configuration file that contains a garage name and a registration password. For example:

```
{
    "users": {
        "eva": {
            "password": "ave"
        }
    }
}

```

In this example, the garage name is `eva`.

## Deploy

Next, deploy the app to [IBM Bluemix][] run, for example:
```
$ cf push mygarage
```

The web interface for a garage would be available at `<appUrl>/<garageName>`. For example, in this case, it's `https://mygarage.mybluemix.net/eva`.

## Amazon Alexa

When configuring the Alexa skill, use `<appUrl>/<garageName>/alexa` as the service endpoint. For example, in this case, it's `https://mygarage.mybluemix.net/eva/alexa`. For the interaction model configuration, access the `<appUrl>/<garageName>/alexa` URL in your web browser to see the intent schema and sample utterances. Also, under SSL Certificate configuration choose the "*endpoint is a sub-domain of a domain that has a wildcard certificate from a certificate authority*" option.

The skill supports the following sample phrases:
* *Alexa, ask garage is the door open?*
* *Alexa, ask garage is the door closed?*
* *Alexa, ask garage to close the door*
* *Alexa, ask garage to open the door*

[IBM Bluemix]: https://bluemix.net

