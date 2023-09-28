import { Page } from 'puppeteer';
import { clickWithNavigate } from './helper.js';
import { FB_LOGIN_URL } from './constants.js';

export const login = async (page: Page, fbID: string, fbPass: string): Promise<boolean | string> => {
  try {
    console.log('login -> Logging into fB - opening puppeteer page');
    await page.goto(FB_LOGIN_URL);
    if (!page.url().includes(FB_LOGIN_URL)) {
      console.log('login -> User is already logged in');
      return true;
    }
    console.log('login -> logging into fB - login URL opened');
    await page.type('#m_login_email', fbID);
    await page.type('#m_login_password', fbPass);

    console.log('login -> logging into fB - entries filled');
    await clickWithNavigate('#login_password_step_element > button', page);

    console.log('login -> page.url()', page.url());
    console.log('login -> logging into fB - successfully logged in');
    return true;
  } catch (error: any) {
    console.log('login -> error:', error);
    return error.message;
  }
};
