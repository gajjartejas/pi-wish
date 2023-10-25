import dotenv from 'dotenv';
import fs from 'fs';
import { IAppConfig } from './types.js';

dotenv.config();

const config = JSON.parse(fs.readFileSync('config.json', 'utf-8')) as IAppConfig;

const package_json = JSON.parse(fs.readFileSync('package.json', 'utf-8')) as any;

export const HEADLESS = config.developer.headless;
export const DRY_RUN = config.developer.dryRun;
export const SIMULATED_DELAY = config.developer.simulateDelay;
export const SIMULATE_DELAY_IN_SECONDS = config.developer.simulateDelayInSeconds;

export const FRIENDS_TO_EXCLUDE = config.excludeProfileIds;
export const FRIENDS_TO_INCLUDE = config.includedProfileIds;

export const RANDOM_DELAY_FOR_WISH = config.randomDelayForWish;
export const RANDOM_DELAY_RANGE_IN_SECONDS = config.randomDelayRangeInSeconds;

export const CUSTOM_BIRTHDAY_MESSAGES = config.customBirthdayMessages;

export const TELEGRAM_NOTIFICATIONS_ENABLED = config.telegramNotificationsEnabled;
export const TELEGRAM_DEBUG_NOTIFICATIONS_ENABLED = config.telegramDebugNotificationsEnabled;

export const DISABLE_IMAGE_LOADING = config.disableImageLoading;
export const ENABLE_NEW_RELEASE_CHECK = config.enableNewReleaseCheck;

export const API_TELEGRAM = 'https://api.telegram.org/';

export const FB_PROFILE_URL = 'https://m.facebook.com/profile.php/?id=';
export const FB_LOGIN_URL = 'https://m.facebook.com/login';
export const FB_BIRTHDAY_URL = 'https://m.facebook.com/events/birthdays';

export const REPO_OWNER: string = 'gajjartejas';
export const REPO_NAME: string = 'pi-wish';
export const CURRENT_VERSION: string = package_json.version;

export const FB_ID = process.env.FB_ID;
export const FB_PASS = process.env.FB_PASS;
export const TELEGRAM_API_TOKEN = process.env.TELEGRAM_API_TOKEN;
export const CHAT_ID = process.env.CHAT_ID;
