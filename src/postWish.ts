import { Page } from 'puppeteer';
import { clickWithNavigate } from './helper';
import { FB_PROFILE_URL } from './constants';

export const postBirthdayWish = async (
  page: Page,
  profileId: string,
  wishText: string,
  dryRun: boolean = true,
): Promise<boolean | string> => {
  try {
    const url = `${FB_PROFILE_URL}${profileId}`;

    console.log('postBirthdayWish -> opening:', url);
    await page.goto(url);
    console.log('postBirthdayWish -> finished 1', url);

    console.log('postBirthdayWish -> navigateToPostScreen');
    const result = await navigateToPostScreen(page);
    console.log('postBirthdayWish -> navigateToPostScreen Finished');
    if (result !== true) {
      return result;
    }

    const writeSomethingInputButton1 = '#screen-root > div > div:nth-child(2) > div:nth-child(4)';
    console.log('postBirthdayWish -> waitForSelector:', writeSomethingInputButton1);
    await page.waitForSelector(writeSomethingInputButton1);
    console.log('postBirthdayWish -> Finished 3');

    await page.click(writeSomethingInputButton1);
    await page.keyboard.type(wishText);

    if (dryRun) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      return true;
    }

    const result1 = await submitGreetingAndNavigate(page);
    if (result1 !== true) {
      return result;
    }
    return true;
  } catch (error: any) {
    console.log('postBirthdayWish ->error', error);
    return error.message;
  }
};

const submitGreetingAndNavigate = async (page: Page, index?: number): Promise<boolean | string> => {
  let computedIndex = index !== undefined ? index : 11;
  try {
    const query = `#screen-root > div > div:nth-child(2) > div:nth-child(${computedIndex})`; //10 or 11
    console.log('submitGreetingAndNavigate -> clicking:', query);
    await clickWithNavigate(query, page, { x: 80, y: 20 });
    console.log('submitGreetingAndNavigate -> finish:', query);
    return true;
  } catch (e: any) {
    console.error('submitGreetingAndNavigate -> error:', e);
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
    console.log('submitGreetingAndNavigate -> clicking:', query);
    await clickWithNavigate(query, page, { x: 60, y: 16 });
    console.log('submitGreetingAndNavigate -> finish:', query);
    return true;
  } catch (e: any) {
    console.error('submitGreetingAndNavigate -> error:', e);
    if (computedIndex >= 12) {
      return e.message;
    }
    computedIndex += 1;
    return await navigateToPostScreen(page, computedIndex);
  }
};
