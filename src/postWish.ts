import { Page } from 'puppeteer';
import { awaitForSimulatedDelay, clickWithNavigate, sleep } from './helper.js';
import { FB_PROFILE_URL } from './constants.js';

export const postBirthdayWish = async (
  page: Page,
  profileId: string,
  wishText: string,
  dryRun: boolean = true,
): Promise<boolean | string> => {
  try {
    const url = `${FB_PROFILE_URL}${profileId}`;

    console.log('postBirthdayWish 1 -> opening:', url);
    await page.goto(url);
    console.log('postBirthdayWish 2 -> finished 1', url);

    await awaitForSimulatedDelay();

    console.log('postBirthdayWish 3 -> navigateToPostScreen');
    const result = await navigateToPostScreen(page);
    console.log('postBirthdayWish 4 -> navigateToPostScreen Finished');
    if (result !== true) {
      return result;
    }

    const writeSomethingInputButton1 = '#screen-root > div > div:nth-child(2) > div:nth-child(4)';
    console.log('postBirthdayWish 5 -> waitForSelector:', writeSomethingInputButton1);
    await page.waitForSelector(writeSomethingInputButton1);
    console.log('postBirthdayWish 6 -> Finished 3');

    await awaitForSimulatedDelay();
    await page.click(writeSomethingInputButton1);
    await page.keyboard.type(wishText);

    if (dryRun) {
      await sleep(5000);
      console.log('postBirthdayWish 6 -> Finished returned');
      return true;
    }

    const result1 = await submitGreetingAndNavigate(page);
    if (result1 !== true) {
      return result;
    }
    return true;
  } catch (error: any) {
    console.log('postBirthdayWish 7 -> error', error);
    return error.message;
  }
};

const submitGreetingAndNavigate = async (page: Page, index?: number): Promise<boolean | string> => {
  let computedIndex = index !== undefined ? index : 11;
  try {
    const query = `#screen-root > div > div:nth-child(2) > div:nth-child(${computedIndex})`; //10 or 11
    console.log('submitGreetingAndNavigate 1 -> clicking:', query);
    await clickWithNavigate(query, page, { x: 80, y: 20 });
    console.log('submitGreetingAndNavigate 2 -> finish:', query);
    return true;
  } catch (e: any) {
    console.error('submitGreetingAndNavigate 3 -> error:', e);
    if (computedIndex >= 13) {
      return e.message;
    }
    computedIndex += 1;
    return await navigateToPostScreen(page, computedIndex);
  }
};

const navigateToPostScreen = async (page: Page, index?: number): Promise<boolean | string> => {
  let computedIndex = index !== undefined ? index : 10;
  try {
    const query = `#screen-root > div > div:nth-child(2) > div:nth-child(${computedIndex})`; //11 or 12
    console.log('navigateToPostScreen 1 -> clicking:', query);
    await clickWithNavigate(query, page, { x: 60, y: 16 });
    console.log('navigateToPostScreen 2 -> finish:', query);
    return true;
  } catch (e: any) {
    console.error('navigateToPostScreen 3 -> error:', e);
    if (computedIndex >= 12) {
      return e.message;
    }
    computedIndex += 1;
    return await navigateToPostScreen(page, computedIndex);
  }
};
