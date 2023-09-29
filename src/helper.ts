import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Offset, Page } from 'puppeteer';

export const clickWithNavigate = async (query: string, page: Page, offset?: Offset | undefined): Promise<boolean> => {
  const [result] = await Promise.all([page.waitForNavigation(), page.click(query, { offset })]);
  return result !== null;
};

export const getIdFromUrl = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    const params = new URLSearchParams(urlObj.search);
    return params.get('id');
  } catch (error) {
    console.error('Error parsing URL:', error);
    return null;
  }
};

export function createDirectories(): string {
  const homedir = os.homedir();
  const newDirPath = path.join(homedir, 'pi-wish');
  if (!fs.existsSync(newDirPath)) {
    fs.mkdirSync(newDirPath);
  }
  console.log('newDirPath', newDirPath);
  return newDirPath;
}
