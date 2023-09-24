import dotenv from 'dotenv';
dotenv.config();

export const HEADLESS = true;
export const DRY_RUN = true;

export const API_TELEGRAM = 'https://api.telegram.org/';
export const API_JSON_SERVER = 'http://localhost:3000/';

export const FB_PROFILE_URL = 'https://m.facebook.com/profile.php/?id=';
export const FB_LOGIN_URL = 'https://m.facebook.com/login';
export const FB_BIRTHDAY_URL = 'https://m.facebook.com/events/birthdays';

export const FB_ID = process.env.FB_ID;
export const FB_PASS = process.env.FB_PASS;
export const TELEGRAM_API_TOKEN = process.env.TELEGRAM_API_TOKEN;
export const CHAT_ID = process.env.CHAT_ID;
