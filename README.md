# 🚧 Work In Progress 🚧

## Requirements

- **node**: Tested on version 18.18.0
- **pm2**: You can install using `npm install pm2@latest -g`, more detail found
  at [here](https://pm2.keymetrics.io/docs/usage/quick-start/)
- **chromium-browser**: to install check [this link](https://stackoverflow.com/a/65497048/1644194)
- **Telegram account (Optional)**: For notification, fpr Bot and chat ID

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

5. Edit the `.env` file with the following information.
   Follow [these steps](https://gist.github.com/zapisnicar/247d53f8e3980f6013a221d8c7459dc3) to
   obtain `TELEGRAM_API_TOKEN` and `CHAT_ID`:

   ```plaintext
   FB_ID=your@email.here
   FB_PASS=mypassword
   TELEGRAM_API_TOKEN=telegramapikey
   CHAT_ID=yourchatid
   ```

   ⚠️ Before running, review the `src/constants.ts` file:

   ```typescript
   export const HEADLESS = true; // Set to false for debugging (displays browser)
   export const DRY_RUN = true; // Set to false to enable clicking post button, true means it won't post to users timeline.
   ```

6. Build the project using below command, this will produce `dist` dir at project root folder.

   ```sh
   npm run build
   ```

7. Start `pi-wish` to run at 11:00, 17:00, and 20:00 every day. Adjust the schedule
   using [this tool](https://www.freeformatter.com/cron-expression-generator-quartz.html):
   First time it will try to collect fiends birthdays and try to wish each one by one, if fails it will try again(17:00
   and 20:00) when cron job runs for remaining friends.

   ```sh
   pm2 start --cron-restart '0 11,17,20 * * *' --no-autorestart --name pi-wish dist/src/main.js
   ```

   after you can check status using `pm2 list` as it will show process status below

   | id | name    | namespace | version | mode | pid   | uptime | ↺ | status | cpu | mem    | user  | watching |
   |----|---------|-----------|---------|------|-------|--------|---|--------|-----|--------|-------|----------|
   | 0  | pi-wish | default   | 1.0.0   | fork | 22697 | 0s     | 0 | online | 0%  | 19.9mb | tejas | disabled |

   you can stop process using `pm2 stop 0`.

## Todo ##

1. Code cleanup.
2. Better error handling.
3. Friend/Unfriend tracker.
4. Send birthday message if not able to post on timeline.

