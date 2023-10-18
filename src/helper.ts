import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Offset, Page } from 'puppeteer';
import { SIMULATE_DELAY_IN_SECONDS, SIMULATED_DELAY } from './constants.js';

export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const randomInteger = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

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

export const awaitForSimulatedDelay = async (): Promise<void> => {
  if (!SIMULATED_DELAY) {
    return;
  }
  await sleep(SIMULATE_DELAY_IN_SECONDS * 1000);
};
