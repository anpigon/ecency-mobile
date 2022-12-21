import * as dsteem from '@upvu/dsteem';
import Config from 'react-native-config';
import get from 'lodash/get';

import {getDigitPinCode, getUser} from './dhive';
// import {getPointsSummary} from '../ecency/ePoint';
import {
  setUserData,
  setAuthStatus,
  getUserDataWithUsername,
  updateUserData,
  updateCurrentUsername,
  getUserData,
  setSCAccount,
  getSCAccount,
  setPinCode,
} from '../../realm/realm';
import {encryptKey, decryptKey} from '../../utils/crypto';
import hsApi from './hivesignerAPI';
import {getSCAccessToken} from '../ecency/ecency';

// Constants
import AUTH_TYPE from '../../constants/authType';
import {makeHsCode} from '../../utils/hive-signer-helper';

export interface UserData {
  accessToken: string;
  avatar?: string;
  username: string;
  authType: typeof AUTH_TYPE[keyof typeof AUTH_TYPE];
  activeKey: string;
  masterKey: string;
  memoKey: string;
  postingKey: string;
}

export const login = async (username: string, password: string) => {
  let loginFlag = false;
  let avatar = '';
  let authType = '' as UserData['authType'];
  // Get user account data from HIVE Blockchain
  const account = await getUser(username);
  const isUserLoggedIn = await isLoggedInUser(username);

  if (!account) {
    return Promise.reject(new Error('auth.invalid_username'));
  }

  if (isUserLoggedIn) {
    return Promise.reject(new Error('auth.already_logged'));
  }

  // Public keys of user
  const publicKeys = {
    activeKey: (account?.active.key_auths || []).map(x => x[0])[0],
    memoKey: account?.memo_key || '',
    ownerKey: (account?.owner.key_auths || []).map(x => x[0])[0],
    postingKey: (account?.posting.key_auths || []).map(x => x[0])[0],
  };

  // // Set private keys of user
  const privateKeys = getPrivateKeys(username, password);

  // Check all keys
  Object.keys(publicKeys).forEach(key => {
    // @ts-ignore
    if (publicKeys[key].toString() === privateKeys[key].createPublic().toString()) {
      loginFlag = true;
      if (privateKeys.isMasterKey) {
        authType = AUTH_TYPE.MASTER_KEY;
      } else {
        authType = key as typeof authType;
      }
    }
  });

  /*
  const signerPrivateKey = privateKeys.ownerKey || privateKeys.activeKey || privateKeys.postingKey;
  const code = await makeHsCode(account.name, signerPrivateKey);
  const scTokens = await getSCAccessToken(code);

  try {
    const accessToken = scTokens?.access_token;
    account.unread_activity_count = await getUnreadNotificationCount(accessToken);
    account.pointsSummary = await getPointsSummary(account.username);
    account.mutes = await getMutes(account.username);
  } catch (err) {
    console.warn('Optional user data fetch failed, account can still function without them', err);
  }
  */

  let jsonMetadata;
  try {
    jsonMetadata = JSON.parse(account?.posting_json_metadata || '{}');
  } catch (err) {
    jsonMetadata = '';
  }
  if ('profile' in jsonMetadata) {
    avatar = jsonMetadata?.profile?.profile_image || '';
  }
  if (loginFlag) {
    const userData: UserData = {
      username,
      avatar,
      authType,
      masterKey: '',
      postingKey: '',
      activeKey: '',
      memoKey: '',
      accessToken: '',
    };

    const resData = {
      pinCode: Config.DEFAULT_PIN,
      password,
      // accessToken: scTokens?.access_token || '',
    };
    const updatedUserData = await getUpdatedUserData(userData, resData);

    // @ts-ignore
    account.local = updatedUserData;
    // @ts-ignore
    account.local.avatar = avatar;

    const authData = {
      isLoggedIn: true,
      currentUsername: username,
    };
    await setAuthStatus(authData);
    // await setSCAccount(scTokens);

    // @ts-ignore
    // Save user data to Realm DB
    await setUserData(account.local);
    await updateCurrentUsername(account.name);
    return {
      ...account,
      password,
    };
  }

  return Promise.reject(new Error('auth.invalid_credentials'));
};

export const loginWithSC2 = async (code: string) => {
  const scTokens = await getSCAccessToken(code);
  await hsApi.setAccessToken(scTokens?.access_token || '');
  const scAccount = await hsApi.me();
  const account = await getUser(scAccount.account.name);
  let avatar = '';

  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve, reject) => {
    try {
      // const accessToken = scTokens?.access_token || '';
      // account!.unread_activity_count = await getUnreadNotificationCount(accessToken);
      // account!.pointsSummary = await getPointsSummary(account.username);
      // account!.mutes = await getMutes(account.username);
    } catch (err) {
      console.warn('Optional user data fetch failed, account can still function without them', err);
    }

    let jsonMetadata;
    try {
      jsonMetadata = JSON.parse(account?.posting_json_metadata || '{}');
      if (Object.keys(jsonMetadata).length !== 0) {
        avatar = jsonMetadata.profile.profile_image || '';
      }
    } catch (error) {
      jsonMetadata = '';
    }
    const userData: UserData = {
      username: account?.name || '',
      avatar,
      authType: AUTH_TYPE.STEEM_CONNECT,
      masterKey: '',
      postingKey: '',
      activeKey: '',
      memoKey: '',
      accessToken: '',
    };
    const isUserLoggedIn = account?.name && (await isLoggedInUser(account?.name));

    const resData = {
      pinCode: Config.DEFAULT_PIN,
      accessToken: scTokens?.access_token || '',
    };
    const updatedUserData = await getUpdatedUserData(userData, resData);

    if (account && account.local) {
      account.local = updatedUserData;
      account.local.avatar = avatar;
    }

    if (isUserLoggedIn) {
      reject(new Error('auth.already_logged'));
    }

    /* setUserData(account.local)
      .then(async () => {
        updateCurrentUsername(account.name);
        const authData = {
          isLoggedIn: true,
          currentUsername: account.name,
        };
        await setAuthStatus(authData);
        await setSCAccount(scTokens);
        resolve({
          ...account,
          accessToken: get(scTokens, 'access_token', ''),
        });
      })
      .catch(() => {
        reject(new Error('auth.unknow_error'));
      }); */
  });
};

export const setUserDataWithPinCode = async (data: any) => {
  try {
    const result = await getUserDataWithUsername(data.username);
    const userData = result[0];

    if (!data.password) {
      const publicKey =
        userData?.masterKey || userData?.activeKey || userData?.memoKey || userData?.postingKey;

      if (publicKey) {
        data.password = decryptKey(publicKey, get(data, 'pinCode'));
      }
    }

    const updatedUserData = getUpdatedUserData(userData, data);

    await setPinCode(get(data, 'pinCode'));
    await updateUserData(updatedUserData);

    return updatedUserData;
  } catch (error) {
    console.warn('Failed to set user data with pin: ', data, error);
    return Promise.reject(new Error('auth.unknow_error'));
  }
};

export const updatePinCode = (data: any) =>
  new Promise((resolve, reject) => {
    let currentUser = null;
    try {
      setPinCode(get(data, 'pinCode'));
      getUserData()
        .then(async users => {
          const _onDecryptError = () => {
            throw new Error('Decryption failed');
          };
          if (users && users.length > 0) {
            users.forEach(userData => {
              if (
                get(userData, 'authType', '') === AUTH_TYPE.MASTER_KEY ||
                get(userData, 'authType', '') === AUTH_TYPE.ACTIVE_KEY ||
                get(userData, 'authType', '') === AUTH_TYPE.MEMO_KEY ||
                get(userData, 'authType', '') === AUTH_TYPE.POSTING_KEY
              ) {
                const publicKey =
                  get(userData, 'masterKey') ||
                  get(userData, 'activeKey') ||
                  get(userData, 'memoKey') ||
                  get(userData, 'postingKey');

                const password = decryptKey(
                  publicKey,
                  get(data, 'oldPinCode', ''),
                  _onDecryptError,
                );
                if (password === undefined) {
                  return;
                }

                data.password = password;
              } else if (get(userData, 'authType', '') === AUTH_TYPE.STEEM_CONNECT) {
                const accessToken = decryptKey(
                  get(userData, 'accessToken'),
                  get(data, 'oldPinCode', ''),
                  _onDecryptError,
                );
                if (accessToken === undefined) {
                  return;
                }
                data.accessToken = accessToken;
              }
              const updatedUserData = getUpdatedUserData(userData, data);
              updateUserData(updatedUserData);
              if (userData.username === data.username) {
                currentUser = updatedUserData;
              }
            });
            resolve(currentUser);
          }
        })
        .catch(err => {
          reject(err);
        });
    } catch (error) {
      reject(error.message);
    }
  });

// export const verifyPinCode = async (data) => {
//   try {
//     const pinHash = await getPinCode();

//     const result = await getUserDataWithUsername(data.username);
//     const userData = result[0];

//     // This is migration for new pin structure, it will remove v2.2
//     if (!pinHash) {
//       try {
//         //if decrypt fails, means key is invalid
//         if (userData.accessToken === AUTH_TYPE.STEEM_CONNECT) {
//           decryptKey(userData.accessToken, data.pinCode);
//         } else {
//           decryptKey(userData.masterKey, data.pinCode);
//         }
//         await setPinCode(data.pinCode);
//       } catch (error) {
//         return Promise.reject(new Error('Invalid pin code, please check and try again'));
//       }
//     }

//     if (sha256(get(data, 'pinCode')).toString() !== pinHash) {
//       return Promise.reject(new Error('auth.invalid_pin'));
//     }

//     return true;
//   } catch (err) {
//     console.warn('Failed to verify pin in auth: ', data, err);
//     return Promise.reject(err);
//   }
// };

export const refreshSCToken = async (userData, pinCode) => {
  const scAccount = await getSCAccount(userData.username);
  const now = new Date().getTime();
  const expireDate = new Date(scAccount.expireDate).getTime();

  try {
    const newSCAccountData = await getSCAccessToken(scAccount.refreshToken);

    await setSCAccount(newSCAccountData);
    const accessToken = newSCAccountData.access_token;
    const encryptedAccessToken = encryptKey(accessToken, pinCode);
    await updateUserData({
      ...userData,
      accessToken: encryptedAccessToken,
    });
    return encryptedAccessToken;
  } catch (error) {
    if (now > expireDate) {
      throw error;
    } else {
      console.warn('token failed to refresh but current token is still valid');
    }
  }
};

export const switchAccount = username =>
  new Promise((resolve, reject) => {
    getUser(username)
      .then(account => {
        updateCurrentUsername(username)
          .then(() => {
            resolve(account);
          })
          .catch(() => {
            reject(new Error('auth.unknow_error'));
          });
      })
      .catch(() => {
        reject(new Error('auth.unknow_error'));
      });
  });

const getPrivateKeys = (username: string, password: string) => {
  try {
    return {
      activeKey: dsteem.PrivateKey.from(password),
      memoKey: dsteem.PrivateKey.from(password),
      ownerKey: dsteem.PrivateKey.from(password),
      postingKey: dsteem.PrivateKey.from(password),
      isMasterKey: false,
    };
  } catch (e) {
    return {
      activeKey: dsteem.PrivateKey.fromLogin(username, password, 'active'),
      memoKey: dsteem.PrivateKey.fromLogin(username, password, 'memo'),
      ownerKey: dsteem.PrivateKey.fromLogin(username, password, 'owner'),
      postingKey: dsteem.PrivateKey.fromLogin(username, password, 'posting'),
      isMasterKey: true,
    };
  }
};

export const getUpdatedUserData = (
  userData: UserData,
  data: {password: string; pinCode?: string; accessToken?: string},
) => {
  const privateKeys = getPrivateKeys(userData?.username || '', data?.password);
  const pinCode = data?.pinCode || '';

  return {
    username: userData?.username || '',
    authType: userData?.authType || '',
    accessToken: encryptKey(data?.accessToken || '', pinCode),

    masterKey:
      userData?.authType === AUTH_TYPE.MASTER_KEY ? encryptKey(data.password, pinCode) : '',
    postingKey:
      userData?.authType === AUTH_TYPE.MASTER_KEY || userData?.authType === AUTH_TYPE.POSTING_KEY
        ? encryptKey(privateKeys?.postingKey?.toString(), pinCode)
        : '',
    activeKey:
      userData?.authType === AUTH_TYPE.MASTER_KEY || userData?.authType === AUTH_TYPE.ACTIVE_KEY
        ? encryptKey(privateKeys?.activeKey?.toString(), pinCode)
        : '',
    memoKey:
      userData?.authType === AUTH_TYPE.MASTER_KEY || userData?.authType === AUTH_TYPE.MEMO_KEY
        ? encryptKey(privateKeys?.memoKey?.toString(), pinCode)
        : '',
  };
};

const isLoggedInUser = async (username: string) => {
  const result = await getUserDataWithUsername(username);
  if (result.length > 0) {
    return true;
  }
  return false;
};

/**
 * This migration snippet is used to update access token for users logged in using masterKey
 * accessToken is required for all ecency api calls even for non hivesigner users.
 */
export const migrateToMasterKeyWithAccessToken = async (account, userData, pinHash) => {
  // get username, user local data from account;
  const username = account.name;

  // decrypt password from local data
  const pinCode = getDigitPinCode(pinHash);
  const password = decryptKey(
    userData.masterKey || userData.activeKey || userData.postingKey || userData.memoKey,
    pinCode,
  );

  // Set private keys of user
  const privateKeys = getPrivateKeys(username, password);

  const signerPrivateKey =
    privateKeys.ownerKey || privateKeys.activeKey || privateKeys.postingKey || privateKeys.memoKey;
  const code = await makeHsCode(account.name, signerPrivateKey);
  const scTokens = await getSCAccessToken(code);

  await setSCAccount(scTokens);
  const accessToken = scTokens.access_token;

  // update data
  const localData = {
    ...userData,
    accessToken: encryptKey(accessToken, pinCode),
  };
  // update realm
  await updateUserData(localData);

  // return account with update local data
  account.local = localData;
  return account;
};
