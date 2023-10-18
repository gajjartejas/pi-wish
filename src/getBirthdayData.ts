import { Page } from 'puppeteer';
import { User } from './types.js';
import { awaitForSimulatedDelay, getIdFromUrl, sleep } from './helper.js';
import { FB_BIRTHDAY_URL } from './constants.js';

export const getBirthdayData = async (page: Page): Promise<User[]> => {
  try {
    const results: User[] = [];
    console.log(`parseRawBirthdayData 1 -> opening ${FB_BIRTHDAY_URL}`);
    await page.goto(FB_BIRTHDAY_URL);
    await sleep(5000);
    console.log('parseRawBirthdayData 2 -> redirected birthday url:', page.url());

    const sectionQuery = '#screen-root > div > div:nth-child(2) > div:nth-child(4)';

    console.log('parseRawBirthdayData 3 -> waitForSelector:', sectionQuery);
    await page.waitForSelector(sectionQuery);
    console.log('parseRawBirthdayData 4 -> waitForSelector finished:', sectionQuery);

    const sectionHTMLCollection = await page.$eval(sectionQuery, v => {
      return { element: v.children, length: v.children.length };
    });
    if (!sectionHTMLCollection) {
      console.log('parseRawBirthdayData 5 -> sectionHTMLCollection -> empty');
      return results;
    }

    await awaitForSimulatedDelay();

    for (let i = 1; i < sectionHTMLCollection.length; i++) {
      const itemQuery = `${sectionQuery} > div:nth-child(${i + 1})`;

      console.log('parseRawBirthdayData 6 -> await querySelector:', itemQuery);
      const itemCollection = await page.$(itemQuery);
      console.log('parseRawBirthdayData 7 -> await querySelector finished:', itemQuery);

      if (itemCollection === null) {
        console.log('parseRawBirthdayData 8 -> itemCollection empty:', itemCollection);
        continue;
      }

      console.log('parseRawBirthdayData 9 -> itemCollection clicking:', itemCollection);
      await itemCollection.click();
      console.log('parseRawBirthdayData 10 -> itemCollection clicking finished:', itemCollection);

      await awaitForSimulatedDelay();

      const profileNameSelector = `${sectionQuery} > div:nth-child(6) > h1`;

      console.log('parseRawBirthdayData 11 -> waitForSelector:', profileNameSelector);
      await page.waitForSelector(profileNameSelector);
      console.log('parseRawBirthdayData 12 -> waitForSelector finished:', profileNameSelector);

      const name = await page.$eval(profileNameSelector, v => v.textContent);
      if (name) {
        const pageURL = page.url();
        const id = getIdFromUrl(pageURL);
        console.log('url:', pageURL);
        console.log('name:', name);
        if (id !== null) {
          results.push({
            id: id,
            name: name,
            wished: false,
          });
        } else {
          console.log('parseRawBirthdayData 13 -> null id for name:', name);
        }
      }
      await page.goBack();
      await awaitForSimulatedDelay();
      await page.waitForSelector(sectionQuery);
    }
    return results;
  } catch (error: any) {
    throw new Error(error);
  }
};
