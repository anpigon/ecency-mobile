import getSymbolFromCurrency from 'currency-symbol-map';
import {getCurrencyRate} from '../../providers/ecency/ecency';
import {
  CHANGE_COMMENT_NOTIFICATION,
  CHANGE_FOLLOW_NOTIFICATION,
  CHANGE_MENTION_NOTIFICATION,
  CHANGE_FAVORITE_NOTIFICATION,
  CHANGE_BOOKMARK_NOTIFICATION,
  CHANGE_REBLOG_NOTIFICATION,
  CHANGE_TRANSFERS_NOTIFICATION,
  CHANGE_ALL_NOTIFICATION_SETTINGS,
  CHANGE_VOTE_NOTIFICATION,
  IS_CONNECTED,
  IS_DARK_THEME,
  IS_DEFAULT_FOOTER,
  IS_LOGIN_DONE,
  IS_NOTIFICATION_OPEN,
  LOGIN,
  LOGOUT_DONE,
  LOGOUT,
  SET_API,
  SET_CURRENCY,
  SET_LANGUAGE,
  SET_NSFW,
  SET_PIN_CODE,
  IS_PIN_CODE_OPEN,
  IS_RENDER_REQUIRED,
  SET_LAST_APP_VERSION,
  SET_COLOR_THEME,
  SET_SETTINGS_MIGRATED,
  HIDE_POSTS_THUMBNAILS,
  SET_TERMS_ACCEPTED,
  SET_IS_BIOMETRIC_ENABLED,
  SET_ENC_UNLOCK_PIN,
  SET_POST_UPVOTE_PERCENT,
  SET_COMMENT_UPVOTE_PERCENT,
} from '../constants/constants';
import {AppDispatch} from '../store/store';

export const login = (payload: any) => ({
  type: LOGIN,
  payload,
});

export const logout = () => ({
  type: LOGOUT,
});

export const logoutDone = () => ({
  type: LOGOUT_DONE,
});

export const isLoginDone = () => ({
  type: IS_LOGIN_DONE,
});

// Settings actions
export const setLanguage = (payload: any) => ({
  type: SET_LANGUAGE,
  payload,
});

export const setApi = (payload: any) => ({
  type: SET_API,
  payload,
});

export const setPostUpvotePercent = (payload: any) => ({
  type: SET_POST_UPVOTE_PERCENT,
  payload,
});

export const setCommentUpvotePercent = (payload: any) => ({
  type: SET_COMMENT_UPVOTE_PERCENT,
  payload,
});

export const changeAllNotificationSettings = (payload: any) => ({
  type: CHANGE_ALL_NOTIFICATION_SETTINGS,
  payload,
});

export const changeNotificationSettings = (payload: any) => {
  switch (payload.type) {
    case 'notification.follow':
      return {
        type: CHANGE_FOLLOW_NOTIFICATION,
        payload: payload.action,
      };
    case 'notification.vote':
      return {
        type: CHANGE_VOTE_NOTIFICATION,
        payload: payload.action,
      };
    case 'notification.comment':
      return {
        payload: payload.action,
        type: CHANGE_COMMENT_NOTIFICATION,
      };
    case 'notification.mention':
      return {
        type: CHANGE_MENTION_NOTIFICATION,
        payload: payload.action,
      };
    case 'notification.favorite':
      return {
        type: CHANGE_FAVORITE_NOTIFICATION,
        payload: payload.action,
      };
    case 'notification.bookmark':
      return {
        type: CHANGE_BOOKMARK_NOTIFICATION,
        payload: payload.action,
      };
    case 'notification.reblog':
      return {
        type: CHANGE_REBLOG_NOTIFICATION,
        payload: payload.action,
      };
    case 'notification.transfers':
      return {
        type: CHANGE_TRANSFERS_NOTIFICATION,
        payload: payload.action,
      };
    case 'notification':
      return {
        type: IS_NOTIFICATION_OPEN,
        payload: payload.action,
      };
    default:
      return null;
  }
};

export const setIsDarkTheme = (payload: any) => ({
  type: IS_DARK_THEME,
  payload,
});

export const setColorTheme = (payload: number) => ({
  type: SET_COLOR_THEME,
  payload,
});

export const isPinCodeOpen = (payload: any) => ({
  type: IS_PIN_CODE_OPEN,
  payload,
});

export const setConnectivityStatus = (payload: any) => ({
  type: IS_CONNECTED,
  payload,
});

export const setNsfw = (payload: any) => ({
  type: SET_NSFW,
  payload,
});

export const isDefaultFooter = (payload: any) => ({
  type: IS_DEFAULT_FOOTER,
  payload,
});

/**
 * MW
 */
export const setCurrency = (currency: any) => async (dispatch: AppDispatch) => {
  const currencySymbol = getSymbolFromCurrency(currency);
  const currencyRate = await getCurrencyRate(currency);
  dispatch({
    type: SET_CURRENCY,
    payload: {currency, currencyRate, currencySymbol},
  });
};

export const setPinCode = (payload: any) => ({
  type: SET_PIN_CODE,
  payload,
});

export const isRenderRequired = (payload: any) => ({
  type: IS_RENDER_REQUIRED,
  payload,
});

export const setLastAppVersion = (versionNumber: string) => ({
  payload: versionNumber,
  type: SET_LAST_APP_VERSION,
});

export const setSettingsMigrated = (isMigrated: boolean) => ({
  type: SET_SETTINGS_MIGRATED,
  payload: isMigrated,
});

export const setHidePostsThumbnails = (shouldHide: boolean) => ({
  type: HIDE_POSTS_THUMBNAILS,
  payload: shouldHide,
});

export const setIsTermsAccepted = (isTermsAccepted: boolean) => ({
  type: SET_TERMS_ACCEPTED,
  payload: isTermsAccepted,
});

export const setIsBiometricEnabled = (enabled: boolean) => ({
  type: SET_IS_BIOMETRIC_ENABLED,
  payload: enabled,
});

export const setEncryptedUnlockPin = (encryptedUnlockPin: string) => ({
  type: SET_ENC_UNLOCK_PIN,
  payload: encryptedUnlockPin,
});
