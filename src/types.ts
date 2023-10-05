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
