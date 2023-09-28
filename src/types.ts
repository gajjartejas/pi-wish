export type IUserData = {
  id: string;
  listFetchComplete?: boolean;
  users?: User[];
};

export type User = {
  id: string;
  name: string;
  wished: boolean;
};

export type IDBData = {
  [key: string]: IUserData;
};
