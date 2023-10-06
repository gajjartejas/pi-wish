import moment from 'moment';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { join } from 'node:path';

import { login } from './login.js';
import { IDBData, IUserData, User } from './types.js';
import { postBirthdayWish } from './postWish.js';
import { getBirthdayData } from './getBirthdayData.js';
import { notifyOnTelegramMe } from './sendNotifications.js';
import { getRandomWish } from './getRandomWish.js';
import {
  CHAT_ID,
  DRY_RUN,
  FB_ID,
  FB_PASS,
  FB_PROFILE_URL,
  FRIENDS_TO_EXCLUDE,
  FRIENDS_TO_INCLUDE,
  HEADLESS,
  TELEGRAM_API_TOKEN,
} from './constants.js';
import { createDirectories } from './helper.js';
import puppeteer, { Browser, Page } from 'puppeteer';

const main = async (): Promise<void> => {
  let browser: Browser | null = null;
  let page: Page | null = null;

  try {
    const todayDate = moment().format('DD-MM-YYYY');

    const todayConfig: IUserData = {
      id: todayDate,
      listFetchComplete: false,
      users: [],
    };

    const db = await initLocalDatabase('db.json');
    const userData = db.data[todayDate] || todayConfig;
    console.log('saved db json:', userData);

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
      console.log('ListFetchComplete && Wished all!');
      process.exit(0);
    }

    [browser, page] = await launchBrowserAndPage();
    await loginUser(page);

    //Check for listFetchComplete && !wished all
    if (listFetchComplete && !isWishedToAll) {
      console.log('ListFetchComplete && but not wished all yet.');
      await wishToUsers(users, db, todayDate, page);
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

    await notifyOnTelegramMe(
      TELEGRAM_API_TOKEN!,
      CHAT_ID!,
      `We have ${formattedBirthdayList?.length} user(s) with birthday today:\n${
        formattedBirthdayList && formattedBirthdayList?.length > 0
          ? formattedBirthdayList?.join('\n')
          : 'No Birthday today!'
      }`,
    );

    db.data[todayDate] = todayConfig;
    await db.write();

    await wishToUsers(todayConfig.users, db, todayDate, page);

    await browser.close();
    process.exit(0);
  } catch (e: unknown) {
    console.log('main->error:', e);
    if (browser !== null) {
      await browser.close();
    }
    process.exit(0);
  }
};

const wishToUsers = async (users: User[], db: Low<IDBData>, todayDate: string, page: Page): Promise<void> => {
  for (let i = 0; i < users.length; i++) {
    const pendingUser = users[i];
    if (pendingUser.wished) {
      continue;
    }
    if (pendingUser.exclude || !pendingUser.include) {
      await notifyOnTelegramMe(
        TELEGRAM_API_TOKEN!,
        CHAT_ID!,
        `Skipped <a href="${FB_PROFILE_URL}${pendingUser.id}">${pendingUser.name}</a> ⏩`,
      );
      continue;
    }
    const wishText = getRandomWish();
    const wishStatus = await postBirthdayWish(page, pendingUser.id, wishText, DRY_RUN);
    if (wishStatus === true) {
      db.data[todayDate].users[i].wished = true;
      db.data[todayDate].users[i].wishTime = moment().toISOString();
      await db.write();

      await notifyOnTelegramMe(
        TELEGRAM_API_TOKEN!,
        CHAT_ID!,
        `Wished to <a href="${FB_PROFILE_URL}${pendingUser.id}">${pendingUser.name}</a> ✅`,
      );
    } else {
      await notifyOnTelegramMe(
        TELEGRAM_API_TOKEN!,
        CHAT_ID!,
        `Unable to wish to <a href="${FB_PROFILE_URL}${pendingUser.id}">${pendingUser.name}</a> with error:\n${wishStatus} ❌`,
      );
    }
  }
};

const launchBrowserAndPage = async (): Promise<[Browser, Page]> => {
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

  return [browser, page];
};

const loginUser = async (page: Page): Promise<boolean> => {
  console.log('Logging into fB');
  const loginStatus = await login(page, FB_ID!, FB_PASS!);
  if (loginStatus !== true) {
    console.log('Facebook login error:', loginStatus);
    await notifyOnTelegramMe(TELEGRAM_API_TOKEN!, CHAT_ID!, 'Login Error! ❌');
    process.exit(0);
  }
  return true;
};

const initLocalDatabase = async (dbName: string): Promise<Low<IDBData>> => {
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
};

main().then();
