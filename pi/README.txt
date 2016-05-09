1. Install Node.js
2. Install wrigingpi
3. Install jq
3. Create config.json
  ```json
  {
    "id": "myGarageName",
    "door_password": "codeToActivateGarageDoor",
    "register_password": "codeToRegisterGarageWithBluemixApp"
  }
  ```

4. Create server key and cert. For example:
  ```bash
  $ openssl req  -nodes -new -x509  -keyout server.key -out server.cert
  ```

5. Install systemd script
  ```bash
  $ cp ./pi/etc/garage.service /etc/systemd/system/
  $ systemctl enable garage
  $ systemctl start garage

6. Setup register cron job
  ```bash
  $ crontab ./pi/etc/register.cron
  ```

