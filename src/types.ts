export type IUserData = {
  id: string;
  listFetchComplete?: boolean;
  users?: User[];
};

export type User = {
  id: string;
  name: string;
  wished: boolean;
  exclude?: boolean;
  include?: boolean;
  wishTime?: string;
};

export type IDBData = {
  [key: string]: IUserData;
};

export type IAppConfig = {
  excludeProfileIds: string[];
  includedProfileIds: string[];
  randomDelayForWish: boolean;
  randomDelayRangeInSeconds: number[];
  customBirthdayMessages: IAppConfigCustomBirthdayMessage[];
  telegramNotificationsEnabled: boolean;
  telegramDebugNotificationsEnabled: boolean;
  developer: IAppConfigDeveloper;
};

export type IAppConfigCustomBirthdayMessage = {
  message: string;
  ids: string[];
};

export type IAppConfigDeveloper = {
  headless: boolean;
  dryRun: boolean;
  simulateDelay: boolean;
  simulateDelayInSeconds: number;
};
