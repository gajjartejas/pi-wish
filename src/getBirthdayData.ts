import { Page } from 'puppeteer';
import { User } from './types';
import { getIdFromUrl } from './helper';
import { FB_BIRTHDAY_URL } from './constants';

export const getBirthdayData = async (page: Page): Promise<User[]> => {
  try {
    let results: User[] = [];
    console.log(`parseRawBirthdayData -> opening ${FB_BIRTHDAY_URL}`);
    await page.goto(FB_BIRTHDAY_URL);
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log('parseRawBirthdayData -> redirected birthday url:', page.url());

    const sectionQuery = '#screen-root > div > div:nth-child(2) > div:nth-child(4)';

    console.log('parseRawBirthdayData -> waitForSelector:', sectionQuery);
    await page.waitForSelector(sectionQuery);
    console.log('parseRawBirthdayData -> waitForSelector finished:', sectionQuery);

    const sectionHTMLCollection = await page.$eval(sectionQuery, v => {
      return { element: v.children, length: v.children.length };
    });
    if (!sectionHTMLCollection) {
      console.log('parseRawBirthdayData -> sectionHTMLCollection -> empty');
      return results;
    }

    for (let i = 1; i < sectionHTMLCollection.length; i++) {
      const itemQuery = `${sectionQuery} > div:nth-child(${i + 1})`;

      console.log('parseRawBirthdayData -> await querySelector:', itemQuery);
      const itemCollection = await page.$(itemQuery);
      console.log('parseRawBirthdayData -> await querySelector finished:', itemQuery);

      if (itemCollection === null) {
        console.log('parseRawBirthdayData -> itemCollection empty:', itemCollection);
        continue;
      }

      console.log('parseRawBirthdayData -> itemCollection clicking:', itemCollection);
      await itemCollection.click();
      console.log('parseRawBirthdayData -> itemCollection clicking finished:', itemCollection);

      let profileNameSelector = `${sectionQuery} > div:nth-child(6) > h1`;

      console.log('parseRawBirthdayData -> waitForSelector:', profileNameSelector);
      await page.waitForSelector(profileNameSelector);
      console.log('parseRawBirthdayData -> waitForSelector finished:', profileNameSelector);

      let name = await page.$eval(profileNameSelector, v => v.textContent);
      if (name) {
        let pageURL = page.url();
        let id = getIdFromUrl(pageURL);
        console.log('url:', pageURL);
        console.log('name:', name);
        if (id !== null) {
          results.push({
            id: id,
            name: name,
            wished: false,
          });
        } else {
          console.log('parseRawBirthdayData -> null id for name:', name);
        }
      }
      await page.goBack();
      await page.waitForSelector(sectionQuery);
    }
    return results;
  } catch (error: any) {
    throw new Error(error);
  }
};
