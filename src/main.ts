import pup from 'puppeteer';
import moment from 'moment';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { join } from 'node:path';

import { login } from './login.js';
import { IDBData, IUserData } from './types.js';
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
  TELEGRAM_API_TOKEN,
  HEADLESS,
} from './constants.js';
import { createDirectories } from './helper.js';

const main = async (): Promise<void> => {
  const browser = await pup.launch({
    headless: HEADLESS,
    args: ['--no-sandbox', '--disable-notifications', '--enable-gpu'],
    userDataDir: './tmp',
    executablePath:
      process.platform === 'linux' ? '/usr/bin/chromium-browser' : undefined,
  });
  const page = await browser.newPage();
  await page.emulate({
    viewport: {
      width: 375,
      height: 667,
      isMobile: true,
    },
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1', // User agent string for the emulated device
  });

  // db.json file path

  const __dirname = createDirectories();
  const file = join(__dirname, 'db.json');
  console.log('file', file);

  // Configure lowdb to write data to JSON file
  const adapter = new JSONFile<IDBData>(file);
  const defaultData = {};
  const db = new Low<IDBData>(adapter, defaultData);
  await db.read();
  await db.write();

  try {
    console.log('Logging into fB');
    const loginStatus = await login(page, FB_ID!, FB_PASS!);
    if (loginStatus !== true) {
      console.log('Facebook login error:', loginStatus);
      await notifyOnTelegramMe(
        TELEGRAM_API_TOKEN!,
        CHAT_ID!,
        'Login Error! ❌',
      );
      process.exit(0);
    }
    const todayDate = moment().format('DD-MM-YYYY');

    const todayConfig: IUserData = {
      id: todayDate,
      listFetchComplete: false,
      users: [],
    };

    const userData = db.data[todayDate] || todayConfig;
    console.log('response 1:', userData);

    //Check for listFetchComplete && wished all -> RETURN
    const users = userData.users;
    const listFetchComplete = userData.listFetchComplete;

    console.log('users 1:', users);
    console.log('listFetchComplete 1:', listFetchComplete);

    if (listFetchComplete) {
      const isWishedToAll = users.filter((v) => !v.wished).length === 0;
      if (listFetchComplete && isWishedToAll) {
        console.log('ListFetchComplete && Wished all!');
        process.exit(0);
      }

      //Check for listFetchComplete && !wished all
      if (listFetchComplete && !isWishedToAll) {
        console.log('ListFetchComplete && but not wished all yet.');
        for (let i = 0; i < users.length; i++) {
          const pendingUser = users[i];
          if (pendingUser.wished) {
            continue;
          }
          const wishText = getRandomWish();
          const wishStatus = await postBirthdayWish(
            page,
            pendingUser.id,
            wishText,
          );
          if (wishStatus === true) {
            db.data[todayDate].users[i].wished = true;
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
        process.exit(0);
      }
    }

    //Get today's birthday and update user
    const newUsers = await getBirthdayData(page);
    todayConfig.users = newUsers;
    todayConfig.listFetchComplete = true;
    const formattedBirthdayList = todayConfig.users?.map((v) => {
      return `${
        todayConfig.users!.indexOf(v) + 1
      } - <a href="${FB_PROFILE_URL}${v.id}">${v.name}</a> - ${
        v.wished ? '✅' : '⏳'
      }`;
    });

    await notifyOnTelegramMe(
      TELEGRAM_API_TOKEN!,
      CHAT_ID!,
      `We have ${formattedBirthdayList?.length} user(s) with today birthday:\n${
        formattedBirthdayList && formattedBirthdayList?.length > 0
          ? formattedBirthdayList?.join('\n')
          : 'No Birthday today!'
      }`,
    );

    db.data[todayDate] = todayConfig;
    await db.write();

    for (let i = 0; i < newUsers.length; i++) {
      const pendingUser = newUsers[i];
      const wishText = getRandomWish();
      const wishStatus = await postBirthdayWish(
        page,
        pendingUser.id,
        wishText,
        DRY_RUN,
      );
      if (wishStatus === true) {
        await notifyOnTelegramMe(
          TELEGRAM_API_TOKEN!,
          CHAT_ID!,
          `Wished to <a href="${FB_PROFILE_URL}${pendingUser.id}">${pendingUser.name}</a> ✅`,
        );
        db.data[todayDate].users[i].wished = true;
        await db.write();
      } else {
        await notifyOnTelegramMe(
          TELEGRAM_API_TOKEN!,
          CHAT_ID!,
          `Unable to wish to <a href="${FB_PROFILE_URL}${pendingUser.id}">${pendingUser.name}</a> with error:\n${wishStatus} ❌`,
        );
      }
    }

    await browser.close();
    process.exit(0);
  } catch (e: unknown) {
    console.log('main->error:', e);
    await browser.close();
    process.exit(0);
  }
};

main();
