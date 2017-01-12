# Garage door controller back-end

## Network setup

1. Configure static IP
  * Set static ip in the `/etc/network/interfaces` file. For example:
    ```
    iface wlan0 inet static
    address 192.168.0.200
    netmask 255.255.255.0
    gateway 192.168.0.1
    ```

  * Configure wireless in the `/etc/wpa_supplicant/wpa_supplicant.conf` file. For example:
    ```
    network={
      ssid="<ssid>"
      psk="<password>"
    }
    ```

2. Setup port forwarding to port 9090

## Software setup

1. Install Node.js
2. Install wrigingpi
3. Install jq
4. Install node dependencies
  ```bash
  $ cd ~/garage-control/pi
  $ npm install
  ```

3. Create config.json
  ```json
  {
    "id": "myGarageName",
    "door_password": "codeToActivateGarageDoor",
    "door_delay": 13,
    "register_password": "codeToRegisterGarageWithBluemixApp",
    "register_url": "<UrlOfTheBluemmixApp>/status",
    "ifttt_key": <ifttt_api_key>,
    "alexa_app_id": "<alexa_app_id>"
  }
  ```

  The `ifttt_key` and `alexa_app_id` are optional.

4. Create server key and cert. For example:
  ```bash
  $ openssl req  -nodes -new -x509  -keyout server.key -out server.cert
  ```

5. Install systemd script
  ```bash
  $ cp ./pi/etc/garage.service /etc/systemd/system/
  $ systemctl enable garage
  $ systemctl start garage
  ```
  
6. Setup cron jobs. Update the script as needed.
  ```bash
  $ crontab ./pi/etc/crontab.cron
  ```

