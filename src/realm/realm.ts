import sha256 from 'crypto-js/sha256';
import AsyncStorage from '@react-native-async-storage/async-storage';
import parseVersionNumber from '../utils/parseVersionNumber';

// CONSTANTS
const USER_SCHEMA = 'user';
const SC_ACCOUNTS = 'sc_accounts';
const AUTH_SCHEMA = 'auth';
const DRAFT_SCHEMA = 'draft';
const SETTINGS_SCHEMA = 'settings';
const CACHE_SCHEMA = 'cache';
const APPLICATION_SCHEMA = 'application';
const STORAGE_SCHEMA = 'storage';

export async function getItemFromStorage<T = any>(key: string) {
  const data = await AsyncStorage.getItem(key);
  if (data) {
    return JSON.parse(data) as T;
  }
  return null;
}

export const setItemToStorage = async (key: string, data: any) => {
  if (data) {
    const dataStr = JSON.stringify(data);
    await AsyncStorage.setItem(key, dataStr);
    return true;
  }
  return false;
};

// TODO: This is getting ALL user data, we should change this method with getUserDataWithUsername
export const getUserData = async () => {
  const users = await getItemFromStorage<any[]>(USER_SCHEMA);
  return users;
};

export const getUserDataWithUsername = async (username: string) => {
  try {
    const users = await getUserData();
    if (users) {
      const userObj = users.filter(u => u.username === username);
      return userObj;
    }
    return [];
  } catch (error) {
    console.warn('Failed to get user data: ', error);
    throw error;
  }
};

export const setUserData = async (userData: any) => {
  const users = (await getUserData()) || [];
  const existUser = users.some(u => u.username === userData.username);
  if (!existUser) {
    users.push(userData);
    await setItemToStorage(USER_SCHEMA, users);
  }
  return userData;
};

export const updateUserData = async (userData: any) => {
  let users = (await getUserData()) || [];
  const existUser = users.some(u => u.username === userData.username);
  if (existUser) {
    users = users.map(item => {
      if (item.username === userData.username) {
        return {...item, ...userData};
      }
      return item;
    });
    await setItemToStorage(USER_SCHEMA, users);
    return true;
  }
  return 'User not found';
};

export const removeUserData = async (username: string) => {
  let users = (await getUserData()) || [];
  if (users.some(e => e.username === username)) {
    users = users.filter(item => item.username !== username);
    await setItemToStorage(USER_SCHEMA, users);
    return true;
  }
  return new Error('Could not remove selected user');
};

export const removeAllUserData = async () => {
  await setItemToStorage(USER_SCHEMA, []);
  await setItemToStorage(SC_ACCOUNTS, []);
  return true;
};

export const removeAllSCAccounts = async () => {
  await setItemToStorage(SC_ACCOUNTS, []);
  return true;
};

export const setDraftPost = async (fields: any, username: string, draftId?: string) => {
  const drafts: any[] = (await getItemFromStorage(DRAFT_SCHEMA)) || [];
  const timestamp = new Date().getTime();

  const data = {
    username,
    draftId,
    timestamp: fields.timestamp === 0 ? 0 : timestamp,
    title: fields.title,
    tags: fields.tags,
    body: fields.body,
  };

  const myDraft = drafts.some(e => e.username === username);
  const draftIndex = drafts.findIndex(item => draftId === undefined || item.draftId === draftId);
  if (myDraft && draftIndex >= 0) {
    drafts[draftIndex] = data; // update
  } else {
    drafts.push(data); // new
  }

  await setItemToStorage(DRAFT_SCHEMA, drafts);
  return true;
};

export const getDraftPost = async (username: string, draftId?: string) => {
  const drafts: any[] = (await getItemFromStorage(DRAFT_SCHEMA)) || [];
  return drafts?.find(
    item => item.username === username && (draftId === undefined || item.draftId === draftId),
  );
};

export const getAuthStatus = () => getItemFromStorage(AUTH_SCHEMA);

export const setAuthStatus = async (authStatus: any) => {
  const auth = await getAuthStatus();
  if (auth) {
    auth.isLoggedIn = authStatus.isLoggedIn;
    await setItemToStorage(AUTH_SCHEMA, auth);
    return auth;
  }
  await setItemToStorage(AUTH_SCHEMA, {...authStatus, pinCode: ''});
  return authStatus;
};

export const updateCurrentUsername = async (username: string) => {
  const auth = await getAuthStatus();
  if (auth) {
    auth.currentUsername = username;
    await setItemToStorage(AUTH_SCHEMA, auth);
    return auth;
  }
  const authData = {
    isLoggedIn: false,
    pinCode: '',
    currentUsername: username,
  };
  await setItemToStorage(AUTH_SCHEMA, {...authData});
  return authData;
};

export const setPinCode = async (pinCode: string) => {
  const auth = await getAuthStatus();
  const pinHash = sha256(pinCode).toString();
  auth.pinCode = pinHash;
  await setItemToStorage(AUTH_SCHEMA, auth);
  return auth;
};

export const removePinCode = async () => {
  const auth = await getAuthStatus();
  auth.pinCode = '';
  await setItemToStorage(AUTH_SCHEMA, auth);
  return auth;
};

export const getPinCode = async () => {
  try {
    const auth = await getAuthStatus();
    if (auth) {
      return auth.pinCode;
    }
    return '';
  } catch (error) {
    console.warn('Failed get auth from storage: ', error);
    throw error;
  }
};

// SETTINGS

export const getPinCodeOpen = async () => {
  const setting = await getItemFromStorage(SETTINGS_SCHEMA);
  if (setting) {
    return setting.isPinCodeOpen;
  }
  return false;
};

export const setPinCodeOpen = async (status: boolean) => {
  const setting = await getItemFromStorage(SETTINGS_SCHEMA);
  setting.isPinCodeOpen = status;
  await setItemToStorage(SETTINGS_SCHEMA, setting);
  return true;
};

export const getLastUpdateCheck = async () => {
  const setting = await getItemFromStorage(SETTINGS_SCHEMA);
  return setting?.lastUpdateCheck || false;
};

export const setLastUpdateCheck = async (lastUpdateCheck: number) => {
  const setting = await getItemFromStorage(SETTINGS_SCHEMA);
  setting.lastUpdateCheck = lastUpdateCheck;
  await setItemToStorage(SETTINGS_SCHEMA, setting);
  return true;
};

export const setDefaultFooter = async (isDefaultFooter: boolean) => {
  const setting = await getItemFromStorage(SETTINGS_SCHEMA);
  setting.isDefaultFooter = isDefaultFooter;
  await setItemToStorage(SETTINGS_SCHEMA, setting);
  return true;
};

export const getNsfw = async () => {
  const setting = await getItemFromStorage(SETTINGS_SCHEMA);
  return setting?.nsfw || false;
};

export const setNsfw = async (nsfw: boolean) => {
  const setting = await getItemFromStorage(SETTINGS_SCHEMA);
  setting.nsfw = nsfw;
  await setItemToStorage(SETTINGS_SCHEMA, setting);
  return true;
};

export const setLanguage = async (selectedLanguage: string) => {
  const setting = await getItemFromStorage(SETTINGS_SCHEMA);
  setting.language = selectedLanguage;
  await setItemToStorage(SETTINGS_SCHEMA, setting);
  return true;
};

export const setServer = async (selectedServer: string) => {
  const setting = await getItemFromStorage(SETTINGS_SCHEMA);
  setting.server = selectedServer;
  await setItemToStorage(SETTINGS_SCHEMA, setting);
  return true;
};

export const setNotificationSettings = async ({type, action}: any) => {
  const setting = await getItemFromStorage(SETTINGS_SCHEMA);
  switch (type) {
    case 'notification.follow':
      setting.followNotification = action;
      break;
    case 'notification.vote':
      setting.voteNotification = action;
      break;
    case 'notification.comment':
      setting.commentNotification = action;
      break;
    case 'notification.mention':
      setting.mentionNotification = action;
      break;
    case 'notification.favorite':
      setting.favoriteNotification = action;
      break;
    case 'notification.reblog':
      setting.reblogNotification = action;
      break;
    case 'notification.transfers':
      setting.transfersNotification = action;
      break;
    case 'notification':
      setting.notification = action;
      break;
  }
  await setItemToStorage(SETTINGS_SCHEMA, setting);
  return true;
};

export const setCurrency = async (currencyProps: any) => {
  const setting = await getItemFromStorage(SETTINGS_SCHEMA);
  setting.currency = currencyProps;
  await setItemToStorage(SETTINGS_SCHEMA, setting);
  return true;
};

export const getCurrency = async () => {
  const setting = await getItemFromStorage(SETTINGS_SCHEMA);
  return setting?.currency || false;
};
export const setCache = async (params: any, value: any) => {
  const cache = (await getItemFromStorage(CACHE_SCHEMA)) || {};
  cache[params] = value;
  await setItemToStorage(CACHE_SCHEMA, cache);
  return true;
};
export const getCache = async (params: any) => {
  const cache = await getItemFromStorage(CACHE_SCHEMA);
  if (cache && params) {
    return cache[params];
  }
  return false;
};

export const getLanguage = async () => {
  const setting = await getItemFromStorage(SETTINGS_SCHEMA);
  return setting?.language || false;
};

export const getServer = async () => {
  const setting = await getItemFromStorage(SETTINGS_SCHEMA);
  return setting?.server || false;
};

export const getSettings = async () => {
  const setting = await getItemFromStorage(SETTINGS_SCHEMA);
  if (setting) {
    return setting;
  }
  const settingData = {
    language: '',
    isDarkTheme: null,
    currency: '',
    notification: true,
    server: '',
    upvotePercent: '1',
    nsfw: '1',
    followNotification: true,
    voteNotification: true,
    commentNotification: true,
    mentionNotification: true,
    favoriteNotification: true,
    reblogNotification: true,
    transfersNotification: true,
    isPinCodeOpen: false,
    lastUpdateCheck: null,
  };
  await setItemToStorage(SETTINGS_SCHEMA, settingData);
  return settingData;
};

export const getPushTokenSaved = async () => {
  const application = await getItemFromStorage(APPLICATION_SCHEMA);
  if (!application) {
    setPushTokenSaved(false);
    return false;
  }
  if (application.isPushTokenSaved) {
    return application.isPushTokenSaved;
  }
  return false;
};

export const setPushTokenSaved = async (pushTokenSaved: any) => {
  const application = await getItemFromStorage(APPLICATION_SCHEMA);
  if (application) {
    application.isPushTokenSaved = pushTokenSaved;
    await setItemToStorage(APPLICATION_SCHEMA, application);
    return application;
  }
  const applicationData = {
    pushTokenSaved: false,
  };
  await setItemToStorage(APPLICATION_SCHEMA, {...applicationData});
  return applicationData;
};

export const getExistUser = async () => {
  const application = await getItemFromStorage(APPLICATION_SCHEMA);
  if (!application) {
    setExistUser(false);
    return false;
  }
  if (application.isExistUser) {
    return application.isExistUser;
  }
  return false;
};

export const setExistUser = async (existUser: boolean) => {
  const application = await getItemFromStorage(APPLICATION_SCHEMA);
  if (application) {
    application.isExistUser = existUser;
    await setItemToStorage(APPLICATION_SCHEMA, application);
    return application;
  }
  const applicationData = {
    existUser: false,
  };
  await setItemToStorage(APPLICATION_SCHEMA, {...applicationData});
  return applicationData;
};

export const setSCAccount = async (data: any) => {
  let scAccount: any[] = (await getItemFromStorage(SC_ACCOUNTS)) || [];
  const date = new Date();
  date.setSeconds(date.getSeconds() + data.expires_in);
  if (scAccount.some(e => e.username === data.username)) {
    scAccount = scAccount.map(item =>
      item.username === data.username
        ? {...item, refreshToken: data.refresh_token, expireDate: date.toString()}
        : item,
    );
  } else {
    const account = {
      username: data.username,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expireDate: date.toString(),
    };
    scAccount.push(account);
  }
  await setItemToStorage(SC_ACCOUNTS, scAccount);
  return scAccount;
};

export const getAllSCAccounts = async () => {
  const scAccounts: any[] = (await getItemFromStorage(SC_ACCOUNTS)) || [];
  return scAccounts;
};

export const getSCAccount = async (username: string) => {
  const scAccounts = await getAllSCAccounts();
  const scAccount = scAccounts.find(u => u.username === username);
  return scAccount || false;
};

export const removeSCAccount = async (username: string) => {
  let scAccounts = await getAllSCAccounts();
  if (scAccounts.some(e => e.username === username)) {
    scAccounts = scAccounts.filter(item => item.username !== username);
    await setItemToStorage(SC_ACCOUNTS, scAccounts);
    return true;
  }
  throw new Error('Could not remove selected user');
};

export const getStorageType = async () => {
  const storageType = await AsyncStorage.getItem(STORAGE_SCHEMA);
  return storageType || 'R';
};

export const getVersionForWelcomeModal = async () => {
  const application = await getItemFromStorage(APPLICATION_SCHEMA);
  if (application && application.versionForWelcomeModal) {
    return parseVersionNumber(application.versionForWelcomeModal);
  }
  return 0;
};

export const setVersionForWelcomeModal = async (version: any) => {
  const application = await getItemFromStorage(APPLICATION_SCHEMA);
  if (application) {
    application.versionForWelcomeModal = version;
    await setItemToStorage(APPLICATION_SCHEMA, application);
    return application;
  }
  const applicationData = {
    versionForWelcomeModal: version,
  };
  await setItemToStorage(APPLICATION_SCHEMA, {...applicationData});
  return applicationData;
};
