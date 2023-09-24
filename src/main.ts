import pup from 'puppeteer';
import moment from 'moment';
import axios from 'axios';

import { login } from './login';
import { IUserData } from './types';
import { postBirthdayWish } from './postWish';
import { getBirthdayData } from './getBirthdayData';
import { notifyOnTelegramMe } from './sendNotifications';
import { getRandomWish } from './getRandomWish';
import {
  API_JSON_SERVER,
  CHAT_ID,
  DRY_RUN,
  FB_ID,
  FB_PASS,
  FB_PROFILE_URL,
  TELEGRAM_API_TOKEN,
  HEADLESS,
} from './constants';

async function main() {
  const browser = await pup.launch({
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
      'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1', // User agent string for the emulated device
  });

  try {
    console.log('Logging into fB');
    const loginStatus = await login(page, FB_ID!, FB_PASS!);
    if (loginStatus !== true) {
      notifyOnTelegramMe(TELEGRAM_API_TOKEN!, CHAT_ID!, 'Login Error! ❌');
      return;
    }
    const todayDate = moment().format('DD-MM-YYYY');
    const response = await axios.get(`${API_JSON_SERVER}configs/${todayDate}?_expand=users`, {
      validateStatus: status => {
        return status >= 100 && status < 600;
      },
    });
    const userData = response.data as IUserData;
    console.log('users', userData);

    //Check for listFetchComplete && wished all -> RETURN
    const users = userData.users;
    const listFetchComplete = userData.listFetchComplete;

    if (users !== undefined && listFetchComplete !== undefined) {
      const isWishedToAll = users.filter(v => !v.wished).length === 0;
      if (listFetchComplete && isWishedToAll) {
        console.log('ListFetchComplete && Wished all!');
        return;
      }

      //Check for listFetchComplete && !wished all
      let pendingUsers = users.filter(v => !v.wished);
      if (listFetchComplete && !isWishedToAll) {
        for (let i = 0; i < pendingUsers.length; i++) {
          let pendingUser = pendingUsers[i];
          const wishText = getRandomWish();
          const wishStatus = await postBirthdayWish(page, pendingUser.id, wishText);
          if (wishStatus === true) {
            pendingUser.wished = true;
            await axios.put(
              `${API_JSON_SERVER}configs/${todayDate}/`,
              { ...userData, users: [...users, { ...pendingUser }] },
              {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
              },
            );
            notifyOnTelegramMe(
              TELEGRAM_API_TOKEN!,
              CHAT_ID!,
              `Wished to <a href="${FB_PROFILE_URL}${pendingUser.id}">${pendingUser.name}</a> ✅`,
            );
          } else {
            notifyOnTelegramMe(
              TELEGRAM_API_TOKEN!,
              CHAT_ID!,
              `Unable to wish to <a href="${FB_PROFILE_URL}${pendingUser.id}">${pendingUser.name}</a> with error:\n${wishStatus} ❌`,
            );
          }
        }
        return;
      }
    }

    //Get today's birthday and update user
    let newUsers = await getBirthdayData(page);
    let todayConfig: IUserData = {
      id: todayDate,
      listFetchComplete: true,
      users: newUsers,
    };

    let formattedBirthdayList = todayConfig.users?.map(v => {
      return `${todayConfig.users!.indexOf(v) + 1} - <a href="${FB_PROFILE_URL}${v.id}">${v.name}</a> - ${
        v.wished ? '✅' : '⏳'
      }`;
    });

    notifyOnTelegramMe(
      TELEGRAM_API_TOKEN!,
      CHAT_ID!,
      `We have ${formattedBirthdayList?.length} user(s) with today birthday:\n${
        formattedBirthdayList && formattedBirthdayList?.length > 0
          ? formattedBirthdayList?.join('\n')
          : 'No Birthday today!'
      }`,
    );

    await axios.post(`${API_JSON_SERVER}configs/`, todayConfig, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    for (let i = 0; i < newUsers.length; i++) {
      let pendingUser = newUsers[i];
      const wishText = getRandomWish();
      const wishStatus = await postBirthdayWish(page, pendingUser.id, wishText, DRY_RUN);
      if (wishStatus === true) {
        pendingUser.wished = true;
        notifyOnTelegramMe(
          TELEGRAM_API_TOKEN!,
          CHAT_ID!,
          `Wished to <a href="${FB_PROFILE_URL}${pendingUser.id}">${pendingUser.name}</a> ✅`,
        );
        await axios.put(
          `${API_JSON_SERVER}configs/${todayDate}/`,
          { ...userData, users: newUsers },
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
          },
        );
      } else {
        notifyOnTelegramMe(
          TELEGRAM_API_TOKEN!,
          CHAT_ID!,
          `Unable to wish to <a href="${FB_PROFILE_URL}${pendingUser.id}">${pendingUser.name}</a> with error:\n${wishStatus} ❌`,
        );
      }
    }

    await browser.close();
    process.exit();
  } catch (e: any) {
    console.log('main->error:', e);
    await browser.close();
    process.exit();
  }
}

export default main;
