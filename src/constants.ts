import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const config = JSON.parse(fs.readFileSync('config.json', 'utf-8'));

export const HEADLESS = config.headless;
export const DRY_RUN = config.dryRun;

export const FRIENDS_TO_EXCLUDE = config.excludeProfileIds;
export const FRIENDS_TO_INCLUDE = config.includedProfileIds;

export const API_TELEGRAM = 'https://api.telegram.org/';

export const FB_PROFILE_URL = 'https://m.facebook.com/profile.php/?id=';
export const FB_LOGIN_URL = 'https://m.facebook.com/login';
export const FB_BIRTHDAY_URL = 'https://m.facebook.com/events/birthdays';

export const FB_ID = process.env.FB_ID;
export const FB_PASS = process.env.FB_PASS;
export const TELEGRAM_API_TOKEN = process.env.TELEGRAM_API_TOKEN;
export const CHAT_ID = process.env.CHAT_ID;
