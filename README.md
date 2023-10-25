# pi-wish - A Facebook birthday bot for Raspberry Pi

## Features

1. Ability to auto login.
2. Automated birthday wishes for Facebook friends.
3. Customized birthday messages based on friend IDs.
4. Custom/Random message for friend.
5. Random Delay for each wish.
6. Telegram integration for notifications.
7. Scheduled execution with cron job.
8. Customizable configuration options through `.env` and `config.json`.
9. Saves wish history in separate json file at `home/pi-wish` dir.

## Requirements

- **node**: Tested on version 18.18.0
- **pm2**: You can install using `npm install pm2@latest -g`, more detail found
  at [here](https://pm2.keymetrics.io/docs/usage/quick-start/)
- **chromium-browser**: to install check [this link](https://stackoverflow.com/a/65497048/1644194)
- **Telegram account (Optional)**: For notification, Bot and chat ID

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

6. Prepare the `config.json` file:

   ```sh
   cp sample.config.json config.json
   ```

7. Edit the `config.json` file with the following information.

   - `developer.headless` - Set to false for debugging (displays browser window)
   - `developer.dryRun` - Set `false` to enable clicking the post button, true means it won't post to the user's timeline.
   - `developer.simulateDelay` - Set `true` to enable delay between clicks.
   - `developer.simulateDelayInSeconds` - delay between clicks/navigation, default is 5 seconds.
   - `excludeProfileIds` - It will not wish to provide profile ids.
   - `includedProfileIds` - It will only wish to provide profile ids.
   - `randomDelayForWish` - Adds random delay between wishes.
   - `randomDelayRangeInSeconds` - Range for `randomDelayForWish`, ex: `[0, 100]`
   - `customBirthdayMessages` - Use a specified message for a wish.
   - `telegramNotificationsEnabled` - Enable disable telegram notification.
   - `telegramDebugNotificationsEnabled` - Enable debug logs on telegram notification, prints exception if any.
   - `disableImageLoading` - Disable loading images in browser.
   - `enableNewReleaseCheck` - Enable to check new release updates on startups.

   Note: Example Ids: `["4", "5"]`, use `id` field from URL - `https://m.facebook.com/profile.php/?id=4`

   Default `config.json` file:

   ```json
   {
     "developer": {
       "headless": true,
       "dryRun": false,
       "simulateDelay": false,
       "simulateDelayInSeconds": 5000
     },
     "excludeProfileIds": [],
     "includedProfileIds": [],
     "randomDelayForWish": false,
     "randomDelayRangeInSeconds": [0, 100],
     "customBirthdayMessages": [
       {
         "message": "Happy birthday!!!",
         "ids": [""]
       }
     ],
     "telegramNotificationsEnabled": true,
     "telegramDebugNotificationsEnabled": true,
     "disableImageLoading": true,
     "enableNewReleaseCheck": true
   }
   ```

8. Build the project using the below command, this will produce `dist` dir at the project root folder.

   ```sh
   npm run build
   ```

9. Start `pi-wish` to run at 11:00, 17:00, and 20:00 every day [see below command `'0 11,17,20 * * *'`]. Adjust the schedule
   using [this tool](https://www.freeformatter.com/cron-expression-generator-quartz.html):
   The first time it will try to collect friends' birthdays and try to wish each one by one, if fails it will try again(17:00
   and 20:00) when the cron job runs for remaining friends.

   ```sh
   pm2 start --cron-restart '0 11,17,20 * * *' --no-autorestart --name pi-wish dist/src/main.js
   ```

   after you can check the status using `pm2 list` as it will show the process status below

   | id | name    | namespace | version | mode | pid   | uptime | ↺ | status | cpu | mem    | user  | watching |
   |----|---------|-----------|---------|------|-------|--------|---|--------|-----|--------|-------|----------|
   | 0  | pi-wish | default   | 1.0.0   | fork | 22697 | 0s     | 0 | online | 0%  | 19.9mb | tejas | disabled |

   you can stop the process using `pm2 stop 0`.

## Updating

Use `git pull && npm install && npm run build` to update and build updated dist.

## Todo

1. Code cleanup.
2. Better error handling.
3. Friend/Unfriend tracker.
4. Send a birthday message if not able to post on the timeline.
5. Send custom message at custom date.
