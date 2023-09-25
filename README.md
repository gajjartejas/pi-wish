# 🚧 Work In Progress 🚧

## Requirements

- **node**: Tested on version 16.20.0
- **pm2**: You can install using `npm install pm2@latest -g`, more detail found at [here](https://pm2.keymetrics.io/docs/usage/quick-start/)
- **json-server**: you can install using `npm install json-server -g`, more detail found at [here](https://github.com/typicode/json-server).
- **chromium-browser**: to install check [this link](https://stackoverflow.com/a/65497048/1644194)
- **Telegram account**: For notification, fpr Bot and chat ID - Optional

## Installation

1. Clone this project:

   ```sh
   git clone https://github.com/gajjartejas/pi-wish.git
   ```

2. Change to the project directory:

   ```sh
   cd pi-wish
   ```

3. Install required `node_modules`:

   ```sh
   npm install
   ```

4. Prepare the `.env` file:

   ```sh
   cp sample.env .env
   ```

5. Edit the `.env` file with the following information. Follow [these steps](https://gist.github.com/zapisnicar/247d53f8e3980f6013a221d8c7459dc3) to obtain `TELEGRAM_API_TOKEN` and `CHAT_ID`:

   ```plaintext
   FB_ID=your@email.here
   FB_PASS=mypassword
   TELEGRAM_API_TOKEN=telegramapikey
   CHAT_ID=yourchatid
   ```

   ⚠️ Before running, review the `src/constant.ts` file:

   ```typescript
   export const HEADLESS = true; // Set to false for debugging (displays browser)
   export const DRY_RUN = true; // Set to false to enable clicking post button, true means it won't post to users timeline.
   ```

6. Build the project using, this will build project at `dist` dir.

   ```sh
   npm run build
   ```

7. Start the JSON server with the full path of the current directory:

   ```sh
   pm2 start json-server --name json-server -- /full-path-of-project-dir/db.json
   ```

8. Start `pi-wish` to run at 11:00, 17:00, and 20:00 every day. Adjust the schedule using [this tool](https://www.freeformatter.com/cron-expression-generator-quartz.html):
   First time it will try to collect fiend birthdays and try to wish each one by one if fails, it will try again when cron job runs.

   ```sh
   pm2 start --cron-restart '0 11,17,20 * * *' --name pi-wish dist/index.js
   ```

   after you can check status using `pm2 list` as it will show process status below

   | id  | name        | namespace | version | mode | pid   | uptime | ↺   | status | cpu | mem    | user  | watching |
   | --- | ----------- | --------- | ------- | ---- | ----- | ------ | --- | ------ | --- | ------ | ----- | -------- |
   | 0   | json-server | default   | 0.39.5  | fork | 18102 | 24m    | 0   | online | 0%  | 52.2mb | tejas | disabled |
   | 1   | pi-wish     | default   | 1.0.0   | fork | 22697 | 0s     | 0   | online | 0%  | 19.9mb | tejas | disabled |

   you can stop process using `pm2 stop 0` and `pm2 stop 1`.

Todo

1.  Code cleanup.
2.  Better error handling.
3.  Friend/Unfriend tracker.

Feel free to adjust the commands and descriptions as needed.
