import moment from 'moment';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { join } from 'node:path';

import { login } from './login.js';
import { IDBData, IUserData, User } from './types.js';
import { postBirthdayWish } from './postWish.js';
import { getBirthdayData } from './getBirthdayData.js';
import { getRandomWish } from './getRandomWish.js';
import {
  CHAT_ID,
  CURRENT_VERSION,
  CUSTOM_BIRTHDAY_MESSAGES,
  DISABLE_IMAGE_LOADING,
  DRY_RUN,
  ENABLE_NEW_RELEASE_CHECK,
  FB_ID,
  FB_PASS,
  FB_PROFILE_URL,
  FRIENDS_TO_EXCLUDE,
  FRIENDS_TO_INCLUDE,
  HEADLESS,
  RANDOM_DELAY_FOR_WISH,
  RANDOM_DELAY_RANGE_IN_SECONDS,
  REPO_NAME,
  REPO_OWNER,
  TELEGRAM_API_TOKEN,
  TELEGRAM_DEBUG_NOTIFICATIONS_ENABLED,
  TELEGRAM_NOTIFICATIONS_ENABLED,
} from './constants.js';
import { createDirectories, randomInteger, sleep } from './helper.js';
import puppeteer, { Browser, Page } from 'puppeteer';
import { notifyOnTelegramMe } from './sendNotifications.js';
import { checkGitHubRelease } from './checkGitHubRelease.js';

const main = async (): Promise<void> => {
  console.log('====================Start=========================');

  //Check for app update
  checkForUpdate().then();

  let browser: Browser | null = null;
  let page: Page | null = null;

  try {
    const todayDate = moment().format('DD-MM-YYYY');

    const todayConfig: IUserData = {
      id: todayDate,
      listFetchComplete: false,
      users: [],
    };

    //Get database file
    const db = await initLocalDatabase('db.json');
    if (db === null) {
      console.log('====================Exit=========================');
      process.exit(0);
    }
    const userData = db.data[todayDate] || todayConfig;
    console.log('main->saved db json:', userData);

    //Check for listFetchComplete && wished all -> RETURN
    const users = userData.users.map(v => {
      return {
        ...v,
        exclude: FRIENDS_TO_EXCLUDE.includes(v.id),
        include:
          FRIENDS_TO_INCLUDE && FRIENDS_TO_INCLUDE.length > 0
            ? FRIENDS_TO_INCLUDE.includes(v.id)
            : !FRIENDS_TO_EXCLUDE.includes(v.id),
      };
    });
    const listFetchComplete = userData.listFetchComplete;
    const isWishedToAll = users.filter(v => !v.wished && v.include && !v.exclude).length === 0;

    if (listFetchComplete && isWishedToAll) {
      console.log('main->ListFetchComplete && Wished all!');
      console.log('====================Exit=========================');
      process.exit(0);
    }

    //Launch Browser
    const launchBrowserResults = await launchBrowserAndPage();
    if (launchBrowserResults === null) {
      console.log('====================Exit=========================');
      process.exit(0);
    }
    [browser, page] = launchBrowserResults;

    //Login user
    const loginStatus = await loginUser(page);
    if (loginStatus === false) {
      console.log('====================Exit=========================');
      process.exit(0);
    }

    //Check for listFetchComplete && !wished all
    if (listFetchComplete && !isWishedToAll) {
      console.log('main->ListFetchComplete && but not wished all yet.');
      await wishToUsers(users, db, todayDate, page);
      console.log('====================Exit=========================');
      process.exit(0);
    }

    //Get today's birthday and update user
    const newUsers = await getBirthdayData(page);
    todayConfig.users = newUsers.map(v => {
      return {
        ...v,
        exclude: FRIENDS_TO_EXCLUDE.includes(v.id),
        include:
          FRIENDS_TO_INCLUDE && FRIENDS_TO_INCLUDE.length > 0
            ? FRIENDS_TO_INCLUDE.includes(v.id)
            : !FRIENDS_TO_EXCLUDE.includes(v.id),
      };
    });
    todayConfig.listFetchComplete = true;
    const formattedBirthdayList = todayConfig.users?.map(v => {
      return `${todayConfig.users!.indexOf(v) + 1} - <a href="${FB_PROFILE_URL}${v.id}">${v.name}</a> - ${
        v.include && !v.exclude ? '⏳' : '⏩'
      }`;
    });

    await notify(
      TELEGRAM_API_TOKEN!,
      CHAT_ID!,
      `We have ${formattedBirthdayList?.length} user(s) with birthday today:\n${
        formattedBirthdayList && formattedBirthdayList?.length > 0
          ? formattedBirthdayList?.join('\n')
          : 'No Birthday today!'
      }${DRY_RUN ? '\nDry Run: true' : ''}`,
    );

    db.data[todayDate] = todayConfig;
    await db.write();

    await wishToUsers(todayConfig.users, db, todayDate, page);

    await browser.close();
    console.log('====================Exit=========================');
    process.exit(0);
  } catch (e: any) {
    console.log('main->error:', e);

    if (TELEGRAM_DEBUG_NOTIFICATIONS_ENABLED) {
      await notify(TELEGRAM_API_TOKEN!, CHAT_ID!, `DEBUG: Unexpected Error! ❌\nDEBUG: ${e.message}`);
    } else {
      await notify(TELEGRAM_API_TOKEN!, CHAT_ID!, 'Unexpected Error! ❌');
    }

    if (browser !== null) {
      await browser.close();
    }
    console.log('====================Exit=========================');
    process.exit(0);
  }
};

const awaitForRandomDelay = async (): Promise<void> => {
  if (RANDOM_DELAY_FOR_WISH) {
    const [min, max] = RANDOM_DELAY_RANGE_IN_SECONDS;
    const delayInMs = randomInteger(min, max) * 1000;
    await sleep(delayInMs);
  }
};

const wishToUsers = async (users: User[], db: Low<IDBData>, todayDate: string, page: Page): Promise<void> => {
  for (let i = 0; i < users.length; i++) {
    const pendingUser = users[i];
    if (pendingUser.wished) {
      continue;
    }
    if (pendingUser.exclude || !pendingUser.include) {
      await notify(
        TELEGRAM_API_TOKEN!,
        CHAT_ID!,
        `Skipped <a href="${FB_PROFILE_URL}${pendingUser.id}">${pendingUser.name}</a> ⏩`,
      );
      continue;
    }

    //Random delay between wish
    await awaitForRandomDelay();

    const [customWish] = CUSTOM_BIRTHDAY_MESSAGES.filter(v => v.ids.includes(pendingUser.id));

    //Try to get custom message if specified else use random message
    const wishText = customWish ? customWish.message : getRandomWish();

    const wishStatus = await postBirthdayWish(page, pendingUser.id, wishText, DRY_RUN);
    if (wishStatus === true) {
      db.data[todayDate].users[i].wished = true;
      db.data[todayDate].users[i].wishTime = moment().toISOString();
      await db.write();

      await notify(
        TELEGRAM_API_TOKEN!,
        CHAT_ID!,
        `Wished to <a href="${FB_PROFILE_URL}${pendingUser.id}">${pendingUser.name}</a> ✅`,
      );
    } else {
      if (TELEGRAM_DEBUG_NOTIFICATIONS_ENABLED) {
        await notify(
          TELEGRAM_API_TOKEN!,
          CHAT_ID!,
          `Unable to wish to <a href="${FB_PROFILE_URL}${pendingUser.id}">${pendingUser.name}</a> ❌\nDEBUG: ${wishStatus}`,
        );
      } else {
        await notify(
          TELEGRAM_API_TOKEN!,
          CHAT_ID!,
          `Unable to wish to <a href="${FB_PROFILE_URL}${pendingUser.id}">${pendingUser.name}</a> ❌`,
        );
      }
    }
  }
};

const launchBrowserAndPage = async (): Promise<[Browser, Page] | null> => {
  try {
    const browser = await puppeteer.launch({
      headless: HEADLESS,
      args: ['--no-sandbox', '--disable-notifications', '--enable-gpu'],
      userDataDir: './tmp',
      executablePath: process.platform === 'linux' ? '/usr/bin/chromium-browser' : undefined,
    });

    const page = await browser.newPage();
    await page.emulate({
      viewport: {
        width: 375,
        height: 667,
        isMobile: true,
      },
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1',
    });

    if (DISABLE_IMAGE_LOADING) {
      await page.setRequestInterception(true);
      page.on('request', req => {
        if (req.resourceType() === 'image' || req.resourceType() === 'media') {
          req.abort();
        } else {
          req.continue();
        }
      });
    }

    return [browser, page];
  } catch (e: any) {
    if (TELEGRAM_DEBUG_NOTIFICATIONS_ENABLED) {
      await notify(TELEGRAM_API_TOKEN!, CHAT_ID!, `DEBUG: Launch browser error! ❌\nDEBUG: ${e.message}`);
    } else {
      await notify(TELEGRAM_API_TOKEN!, CHAT_ID!, 'Launch browser error! ❌');
    }
    return null;
  }
};

const loginUser = async (page: Page): Promise<boolean> => {
  console.log('Logging into fB');
  const loginStatus = await login(page, FB_ID!, FB_PASS!);
  if (loginStatus !== true) {
    console.log('Facebook login error:', loginStatus);
    if (TELEGRAM_DEBUG_NOTIFICATIONS_ENABLED) {
      await notify(TELEGRAM_API_TOKEN!, CHAT_ID!, `DEBUG: Login Error! ❌\nDEBUG: ${loginStatus}`);
    } else {
      await notify(TELEGRAM_API_TOKEN!, CHAT_ID!, 'Login Error! ❌');
    }
  }
  return loginStatus === true;
};

const initLocalDatabase = async (dbName: string): Promise<Low<IDBData> | null> => {
  try {
    // db.json file path
    const __dirname = createDirectories();
    const file = join(__dirname, dbName);
    console.log('db file path:', file);

    // Configure lowdb to write data to JSON file
    const adapter = new JSONFile<IDBData>(file);
    const defaultData = {};
    const db = new Low<IDBData>(adapter, defaultData);
    await db.read();
    await db.write();
    return db;
  } catch (e: any) {
    if (TELEGRAM_DEBUG_NOTIFICATIONS_ENABLED) {
      await notify(TELEGRAM_API_TOKEN!, CHAT_ID!, `DEBUG: DB init/rw error! ❌\nDEBUG: ${e.message}`);
    } else {
      await notify(TELEGRAM_API_TOKEN!, CHAT_ID!, 'DB init/rw error! ❌');
    }
    return null;
  }
};

export const notify = async (token: string, chatId: string, message: string): Promise<void> => {
  if (!TELEGRAM_NOTIFICATIONS_ENABLED) {
    return;
  }
  await notifyOnTelegramMe(token, chatId, message);
};

const checkForUpdate = async (): Promise<void> => {
  if (!ENABLE_NEW_RELEASE_CHECK) {
    console.log('checkForUpdate->disabled');
    return;
  }
  const result = await checkGitHubRelease(REPO_OWNER, REPO_NAME, CURRENT_VERSION);
  console.log('checkForUpdate->', result.message);
  if (result.isNewVersionAvailable) {
    console.log(`checkForUpdate-> Release Notes:\n${result.releaseNotes}`);
    await notifyOnTelegramMe(
      TELEGRAM_API_TOKEN!,
      CHAT_ID!,
      `🚀 ${result.message} 🚀\n\nRelease Note:\n${result.releaseNotes}`.replace(/([|{[\]*_~}+)(#>!=\-.])/gm, '\\$1'),
      'MarkdownV2',
    );
  }
};

main().then();
