# 🚧 Work In Progress 🚧

## Requirements

- **pm2**: Advanced process manager for production Node.js applications
- **node**: Tested on version 16.20.0
- **chromium-browser**: to install check [this link](https://stackoverflow.com/a/65497048/1644194)
- **Telegram account**: For Bot and chat ID - Optional

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

6. Start the JSON server with the full path of the current directory:

    ```sh
    pm2 start json-server --name json-server -- /full-path-of-project-dir/db.json
    ```

7. Start `pi-wish` to run at 11:00, 17:00, and 20:00 every day. Adjust the schedule using [this tool](https://www.freeformatter.com/cron-expression-generator-quartz.html):

    ```sh
    pm2 start --cron-restart '0 11,17,20 * * *' --name pi-wish dist/index.js
    ```

Feel free to adjust the commands and descriptions as needed.
