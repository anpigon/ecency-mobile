import {Component} from 'react';
import {
  Platform,
  Alert,
  Linking,
  AppState,
  NativeEventSubscription,
  EventSubscription,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import Config from 'react-native-config';
import changeNavigationBarColor from 'react-native-navigation-bar-color';
import {connect} from 'react-redux';
import {injectIntl} from 'react-intl';
import {bindActionCreators} from '@reduxjs/toolkit';
import messaging from '@react-native-firebase/messaging';
import VersionNumber from 'react-native-version-number';
import ReceiveSharingIntent from 'react-native-receive-sharing-intent';

// Constants
import AUTH_TYPE from '../../../constants/authType';
import ROUTES from '../../../constants/routeNames';

// Services
import {
  getAuthStatus,
  getUserData,
  removeUserData,
  getUserDataWithUsername,
  removePinCode,
  setAuthStatus,
  removeSCAccount,
  setExistUser,
  getLastUpdateCheck,
  setLastUpdateCheck,
} from '../../../realm/realm';
import {getUser, getDigitPinCode, getMutes} from '../../../providers/hive/dhive';
import {getPointsSummary} from '../../../providers/ecency/ePoint';
import {
  migrateToMasterKeyWithAccessToken,
  refreshSCToken,
  switchAccount,
} from '../../../providers/hive/auth';
import {
  setPushToken,
  markNotifications,
  getUnreadNotificationCount,
} from '../../../providers/ecency/ecency';
import {fetchLatestAppVersion} from '../../../providers/github/github';
import RootNavigation from '../../../navigation/rootNavigation';

// Actions
import {
  addOtherAccount,
  updateCurrentAccount,
  updateUnreadActivityCount,
  removeOtherAccount,
  fetchGlobalProperties,
} from '../../../redux/actions/accountAction';
import {
  login,
  logoutDone,
  setConnectivityStatus,
  setPinCode as savePinCode,
  isRenderRequired,
  logout,
  isPinCodeOpen,
  setEncryptedUnlockPin,
} from '../../../redux/actions/applicationActions';
import {
  setAvatarCacheStamp,
  showActionModal,
  toastNotification,
  updateActiveBottomTab,
} from '../../../redux/actions/uiAction';
import {setFeedPosts, setInitPosts} from '../../../redux/actions/postsAction';
import {fetchCoinQuotes} from '../../../redux/actions/walletActions';

import {decryptKey, encryptKey} from '../../../utils/crypto';

import persistAccountGenerator from '../../../utils/persistAccountGenerator';
import parseVersionNumber from '../../../utils/parseVersionNumber';
import {setMomentLocale} from '../../../utils/time';
import {purgeExpiredCache} from '../../../redux/actions/cacheActions';
import {fetchSubscribedCommunities} from '../../../redux/actions/communitiesAction';
import MigrationHelpers from '../../../utils/migrationHelpers';
import {deepLinkParser} from '../../../utils/deepLinkParser';
import bugsnapInstance from '../../../config/bugsnag';

let firebaseOnMessageListener: any = null;
let appStateSub: NativeEventSubscription | null = null;
let linkingEventSub: EventSubscription | null = null;

class ApplicationContainer extends Component {
  _pinCodeTimer: any = null;

  constructor(props) {
    super(props);
    this.state = {
      isRenderRequire: true,
      // isIos: Platform.OS !== 'android',
      appState: AppState.currentState,
      foregroundNotificationData: null,
    };
  }

  componentDidMount() {
    const {dispatch} = this.props;

    this._setNetworkListener();

    linkingEventSub = Linking.addEventListener('url', this._handleOpenURL);
    // TOOD: read initial URL
    Linking.getInitialURL().then(url => {
      this._handleDeepLink(url);
    });

    appStateSub = AppState.addEventListener('change', this._handleAppStateChange);

    this._createPushListener();

    // set avatar cache stamp to invalidate previous session avatars
    dispatch(setAvatarCacheStamp(new Date().getTime()));

    setMomentLocale();
    this._fetchApp();

    ReceiveSharingIntent.getReceivedFiles(
      files => {
        RootNavigation.navigate({
          name: ROUTES.SCREENS.EDITOR,
          params: {hasSharedIntent: true, files},
        });
        // files returns as JSON Array example
        // [{ filePath: null, text: null, weblink: null, mimeType: null, contentUri: null, fileName: null, extension: null }]
        ReceiveSharingIntent.clearReceivedFiles(); // clear Intents
      },
      error => {
        console.log('error :>> ', error);
      },
    );
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    const {isDarkTheme: _isDarkTheme, selectedLanguage, isLogingOut, isConnected, api} = this.props;

    if (
      _isDarkTheme !== nextProps.isDarkTheme ||
      selectedLanguage !== nextProps.selectedLanguage ||
      (api !== nextProps.api && nextProps.api)
    ) {
      this.setState(
        {
          isRenderRequire: false,
        },
        () =>
          this.setState({
            isRenderRequire: true,
          }),
      );
      if (nextProps.isDarkTheme) {
        changeNavigationBarColor('#1e2835');
      } else {
        changeNavigationBarColor('#FFFFFF', true);
      }
    }

    if (isLogingOut !== nextProps.isLogingOut && nextProps.isLogingOut) {
      this._logout();
    }

    if (isConnected !== null && isConnected !== nextProps.isConnected && nextProps.isConnected) {
      this._fetchApp();
    }
  }

  componentDidUpdate(prevProps) {
    const {isGlobalRenderRequired, dispatch} = this.props;

    if (isGlobalRenderRequired !== prevProps.isGlobalRenderRequired && isGlobalRenderRequired) {
      this.setState(
        {
          isRenderRequire: false,
        },
        () =>
          this.setState({
            isRenderRequire: true,
          }),
      );
      dispatch(isRenderRequired(false));
    }
  }

  componentWillUnmount() {
    const {isPinCodeOpen: _isPinCodeOpen} = this.props;

    // TOOD: listen for back press and cancel all pending api requests;
    if (linkingEventSub) {
      linkingEventSub.remove();
    }

    if (appStateSub) {
      appStateSub.remove();
    }

    if (_isPinCodeOpen) {
      clearTimeout(this._pinCodeTimer);
    }

    if (firebaseOnMessageListener) {
      firebaseOnMessageListener();
    }

    this.netListener();
  }

  _setNetworkListener = () => {
    this.netListener = NetInfo.addEventListener(state => {
      const {isConnected, dispatch} = this.props;
      if (state.isConnected !== isConnected) {
        dispatch(setConnectivityStatus(state.isConnected));
        this._fetchApp();
      }
    });
  };

  _handleOpenURL = event => {
    this._handleDeepLink(event.url);
  };

  _handleDeepLink = async (url: string | null) => {
    const {currentAccount} = this.props;

    if (!url) {
      return;
    }

    try {
      const deepLinkData = await deepLinkParser(url, currentAccount);
      const {name, params, key} = deepLinkData || {};

      if (name && key) {
        RootNavigation.navigate({
          name,
          params,
          key,
        });
      }
    } catch (err) {
      this._handleAlert(err.message);
    }
  };

  _compareAndPromptForUpdate = async () => {
    const recheckInterval = 48 * 3600 * 1000; // 2 days
    const {dispatch, intl} = this.props;

    const lastUpdateCheck = await getLastUpdateCheck();

    if (lastUpdateCheck) {
      const timeDiff = new Date().getTime() - lastUpdateCheck;
      if (timeDiff < recheckInterval) {
        return;
      }
    }

    const remoteVersion = await fetchLatestAppVersion();

    if (parseVersionNumber(remoteVersion) > parseVersionNumber(VersionNumber.appVersion)) {
      dispatch(
        showActionModal({
          title: intl.formatMessage({id: 'alert.update_available_title'}, {version: remoteVersion}),
          body: intl.formatMessage({id: 'alert.update_available_body'}),
          buttons: [
            {
              text: intl.formatMessage({id: 'alert.remind_later'}),
              onPress: () => {
                setLastUpdateCheck(new Date().getTime());
              },
            },
            {
              text: intl.formatMessage({id: 'alert.update'}),
              onPress: () => {
                setLastUpdateCheck(null);
                Linking.openURL(
                  Platform.select({
                    ios: 'itms-apps://itunes.apple.com/us/app/apple-store/id1451896376?mt=8',
                    android: 'market://details?id=app.esteem.mobile.android',
                  }),
                );
              },
            },
          ],
          headerImage: require('../../../assets/phone-holding.png'),
        }),
      );
    }
  };

  _handleAlert = (text = null, title = null) => {
    const {intl} = this.props;

    Alert.alert(
      intl.formatMessage({
        id: title || 'alert.warning',
      }),
      intl.formatMessage({
        id: text || 'alert.unknow_error',
      }),
    );
  };

  _handleAppStateChange = nextAppState => {
    const {isPinCodeOpen: _isPinCodeOpen} = this.props;
    const {appState} = this.state;

    if (appState.match(/inactive|background/) && nextAppState === 'active') {
      this._refreshGlobalProps();
      this._refreshUnreadActivityCount();
      if (_isPinCodeOpen && this._pinCodeTimer) {
        clearTimeout(this._pinCodeTimer);
      }
    }

    if (appState.match(/active|forground/) && nextAppState === 'inactive') {
      this._startPinCodeTimer();
    }

    this.setState({
      appState: nextAppState,
    });
  };

  _fetchApp = async () => {
    const {dispatch, settingsMigratedV2} = this.props;

    await MigrationHelpers.migrateSettings(dispatch, settingsMigratedV2);

    this._refreshGlobalProps();
    await this._getUserDataFromRealm();
    this._compareAndPromptForUpdate();
    this._registerDeviceForNotifications();
    dispatch(purgeExpiredCache());
  };

  _startPinCodeTimer = () => {
    const {isPinCodeOpen: _isPinCodeOpen} = this.props;
    if (_isPinCodeOpen) {
      this._pinCodeTimer = setTimeout(() => {
        RootNavigation.navigate({
          name: ROUTES.SCREENS.PINCODE,
        });
      }, 1 * 60 * 1000);
    }
  };

  _showNotificationToast = remoteMessage => {
    const {dispatch} = this.props;

    if (remoteMessage && remoteMessage.notification) {
      const {title} = remoteMessage.notification;
      dispatch(toastNotification(title));
    }
  };

  _createPushListener = async () => {
    await messaging().requestPermission();

    firebaseOnMessageListener = messaging().onMessage(remoteMessage => {
      console.log('Notification Received: foreground', remoteMessage);

      this.setState({
        foregroundNotificationData: remoteMessage,
      });
    });
  };

  _handleConntectionChange = status => {
    const {dispatch, isConnected} = this.props;

    if (isConnected !== status) {
      dispatch(setConnectivityStatus(status));
    }
  };

  _refreshGlobalProps = () => {
    const {actions} = this.props;
    actions.fetchGlobalProperties();
    actions.fetchCoinQuotes();
  };

  _refreshUnreadActivityCount = async () => {
    const {dispatch} = this.props;
    const unreadActivityCount = await getUnreadNotificationCount();
    dispatch(updateUnreadActivityCount(unreadActivityCount));
  };

  _getUserDataFromRealm = async () => {
    const {dispatch, isPinCodeOpen: _isPinCodeOpen, isConnected} = this.props;
    let realmData = [];

    const res = await getAuthStatus();
    const {currentUsername} = res;

    if (res) {
      dispatch(login(true));
      const userData = await getUserData();

      if (userData && userData.length > 0) {
        realmData = userData;
        userData.forEach((accountData, index) => {
          if (
            !accountData.accessToken &&
            !accountData.masterKey &&
            !accountData.postingKey &&
            !accountData.activeKey &&
            !accountData.memoKey
          ) {
            realmData.splice(index, 1);
            if (realmData.length === 0) {
              dispatch(login(false));
              dispatch(logoutDone());
              removePinCode();
              setAuthStatus({
                isLoggedIn: false,
              });
              setExistUser(false);
              if (accountData.authType === AUTH_TYPE.STEEM_CONNECT) {
                removeSCAccount(accountData.username);
              }
            }
            removeUserData(accountData.username);
          } else {
            const persistAccountData = persistAccountGenerator(accountData);
            dispatch(addOtherAccount({...persistAccountData}));
            // TODO: check post v2.2.5+ or remove setexistuser from login
            setExistUser(true);
          }
        });
      } else {
        dispatch(login(false));
        dispatch(logoutDone());
      }
    }

    if (realmData.length > 0) {
      const realmObject = realmData.filter(data => data.username === currentUsername);

      if (realmObject.length === 0) {
        realmObject[0] = realmData[realmData.length - 1];
        // TODO:
        await switchAccount(realmObject[0].username);
      }

      realmObject[0].name = currentUsername;
      // If in dev mode pin code does not show
      if (_isPinCodeOpen) {
        RootNavigation.navigate({name: ROUTES.SCREENS.PINCODE});
      } else if (!_isPinCodeOpen) {
        const encryptedPin = encryptKey(Config.DEFAULT_PIN, Config.PIN_KEY);
        dispatch(savePinCode(encryptedPin));
      }

      if (isConnected) {
        this._fetchUserDataFromDsteem(realmObject[0]);
      }

      return realmObject[0];
    }

    dispatch(updateCurrentAccount({}));

    return null;
  };

  _refreshAccessToken = async currentAccount => {
    const {pinCode, isPinCodeOpen, encUnlockPin, dispatch, intl} = this.props;

    if (isPinCodeOpen && !encUnlockPin) {
      return currentAccount;
    }

    try {
      const userData = currentAccount.local;
      const encryptedAccessToken = await refreshSCToken(userData, getDigitPinCode(pinCode));

      return {
        ...currentAccount,
        local: {
          ...userData,
          accessToken: encryptedAccessToken,
        },
      };
    } catch (error) {
      console.warn('Failed to refresh access token', error);
      Alert.alert(
        intl.formatMessage({
          id: 'alert.fail',
        }),
        error.message,
        [
          {
            text: intl.formatMessage({id: 'side_menu.logout'}),
            onPress: () => dispatch(logout()),
          },
          {text: intl.formatMessage({id: 'alert.cancel'}), style: 'destructive'},
        ],
      );
      return currentAccount;
    }
  };

  _fetchUserDataFromDsteem = async realmObject => {
    const {dispatch, intl, pinCode, isPinCodeOpen, encUnlockPin} = this.props;

    try {
      let accountData = await getUser(realmObject.username);
      accountData.local = realmObject;

      // cannot migrate or refresh token since pin would null while pin code modal is open
      if (!isPinCodeOpen || encUnlockPin) {
        // migration script for previously mast key based logged in user not having access token
        if (realmObject.authType !== AUTH_TYPE.STEEM_CONNECT && realmObject.accessToken === '') {
          accountData = await migrateToMasterKeyWithAccessToken(accountData, realmObject, pinCode);
        }

        // refresh access token
        accountData = await this._refreshAccessToken(accountData);
      }

      try {
        accountData.unread_activity_count = await getUnreadNotificationCount();
        accountData.mutes = await getMutes(realmObject.username);
        accountData.pointsSummary = await getPointsSummary(realmObject.username);
      } catch (err) {
        console.warn(
          'Optional user data fetch failed, account can still function without them',
          err,
        );
      }
      dispatch(updateCurrentAccount(accountData));
      dispatch(fetchSubscribedCommunities(realmObject.username));
      this._connectNotificationServer(accountData.name);
      // TODO: better update device push token here after access token refresh
    } catch (err) {
      Alert.alert(
        `${intl.formatMessage({id: 'alert.fetch_error'})} \n${err.message.substr(0, 20)}`,
      );
    }
  };

  // update notification settings and update push token for each signed accoutn useing access tokens
  _registerDeviceForNotifications = (settings?: any) => {
    const {currentAccount, otherAccounts, notificationDetails, isNotificationsEnabled} = this.props;

    const isEnabled = settings ? !!settings.notification : isNotificationsEnabled;
    settings = settings || notificationDetails;

    const _enabledNotificationForAccount = account => {
      const encAccessToken = account?.local?.accessToken;
      // decrypt access token
      let accessToken = null;
      if (encAccessToken) {
        // NOTE: default pin decryption works also for custom pin as other account
        // keys are not yet being affected by changed pin, which I think we should dig more
        accessToken = decryptKey(account.name, Config.DEFAULT_PIN);
      }

      this._enableNotification(account.name, isEnabled, settings, accessToken);
    };

    // updateing fcm token with settings;
    otherAccounts.forEach(account => {
      // since there can be more than one accounts, process access tokens separate
      if (account?.local?.accessToken) {
        _enabledNotificationForAccount(account);
      } else {
        console.warn('access token not present, reporting to bugsnag');
        bugsnapInstance.notify(
          new Error(
            `Reporting missing access token in other accounts section: account:${
              account.name
            } with local data ${JSON.stringify(account?.local)}`,
          ),
        );

        // fallback to current account access token to register atleast logged in account
        if (currentAccount.name === account.name) {
          _enabledNotificationForAccount(currentAccount);
        }
      }
    });
  };

  _connectNotificationServer = username => {
    /* eslint no-undef: "warn" */
    const ws = new WebSocket(`${Config.ACTIVITY_WEBSOCKET_URL}?user=${username}`);

    ws.onmessage = () => {
      const {activeBottomTab, unreadActivityCount, dispatch} = this.props;

      dispatch(updateUnreadActivityCount(unreadActivityCount + 1));

      // Workaround
      if (activeBottomTab === ROUTES.TABBAR.NOTIFICATION) {
        dispatch(updateActiveBottomTab(''));
        dispatch(updateActiveBottomTab(ROUTES.TABBAR.NOTIFICATION));
      }
    };
  };

  _logout = () => {
    const {
      otherAccounts,
      currentAccount: {name, local},
      dispatch,
      intl,
    } = this.props;

    removeUserData(name)
      .then(async () => {
        const _otherAccounts = otherAccounts.filter(user => user.username !== name);

        this._enableNotification(name, false);

        if (_otherAccounts.length > 0) {
          const targetAccount = _otherAccounts[0];

          await this._switchAccount(targetAccount);
        } else {
          dispatch(updateCurrentAccount({}));
          dispatch(login(false));
          removePinCode();
          setAuthStatus({
            isLoggedIn: false,
          });
          setExistUser(false);
          dispatch(isPinCodeOpen(false));
          dispatch(setEncryptedUnlockPin(encryptKey(Config.DEFAULT_KEU, Config.PIN_KEY)));
          if (local.authType === AUTH_TYPE.STEEM_CONNECT) {
            removeSCAccount(name);
          }
        }

        dispatch(setFeedPosts([]));
        dispatch(setInitPosts([]));
        dispatch(removeOtherAccount(name));
        dispatch(logoutDone());
      })
      .catch(err => {
        Alert.alert(
          `${intl.formatMessage({id: 'alert.fetch_error'})} \n${err.message.substr(0, 20)}`,
        );
      });
  };

  // eslint-disable-next-line
  _enableNotification = async (username, isEnable, settings, accessToken = null) => {
    // compile notify_types
    let notify_types = [];
    if (settings) {
      const notifyTypesConst = {
        voteNotification: 1,
        mentionNotification: 2,
        followNotification: 3,
        commentNotification: 4,
        reblogNotification: 5,
        transfersNotification: 6,
        favoriteNotification: 13,
        bookmarkNotification: 15,
      };

      // eslint-disable-next-line
      Object.keys(settings).map((item) => {
        if (notifyTypesConst[item] && settings[item]) {
          notify_types.push(notifyTypesConst[item]);
        }
      });
    } else {
      notify_types = [1, 2, 3, 4, 5, 6, 13, 15];
    }

    messaging()
      .getToken()
      .then(token => {
        setPushToken(
          {
            username,
            token: isEnable ? token : '',
            system: `fcm-${Platform.OS}`,
            allows_notify: Number(isEnable),
            notify_types,
          },
          accessToken,
        );
      });
  };

  _switchAccount = async targetAccount => {
    const {dispatch, isConnected} = this.props;

    if (!isConnected) return;

    dispatch(updateCurrentAccount(targetAccount));

    const accountData = await switchAccount(targetAccount.username);
    const realmData = await getUserDataWithUsername(targetAccount.username);

    let _currentAccount = accountData;
    _currentAccount.username = accountData.name;
    _currentAccount.local = realmData[0];

    // migreate account to use access token for master key auth type
    if (realmData[0].authType !== AUTH_TYPE.STEEM_CONNECT && realmData[0].accessToken === '') {
      _currentAccount = await migrateToMasterKeyWithAccessToken(
        _currentAccount,
        realmData[0],
        pinCode,
      );
    }

    // update refresh token
    _currentAccount = await this._refreshAccessToken(_currentAccount);

    try {
      _currentAccount.unread_activity_count = await getUnreadNotificationCount();
      _currentAccount.pointsSummary = await getPointsSummary(_currentAccount.username);
      _currentAccount.mutes = await getMutes(_currentAccount.username);
    } catch (err) {
      console.warn('Optional user data fetch failed, account can still function without them', err);
    }

    dispatch(updateCurrentAccount(_currentAccount));
    dispatch(fetchSubscribedCommunities(_currentAccount.username));
  };

  render() {
    const {
      selectedLanguage,
      isConnected,
      toastNotification,
      isDarkTheme: _isDarkTheme,
      children,
      rcOffer,
    } = this.props;
    const {isRenderRequire, foregroundNotificationData} = this.state;

    return (
      children &&
      children({
        isConnected,
        isDarkTheme: _isDarkTheme,
        isRenderRequire,
        locale: selectedLanguage,
        rcOffer,
        toastNotification,
        foregroundNotificationData,
      })
    );
  }
}

export default connect(
  state => ({
    // Application
    isDarkTheme: state.application.isDarkTheme,
    selectedLanguage: state.application.language,
    isPinCodeOpen: state.application.isPinCodeOpen,
    encUnlockPin: state.application.encUnlockPin,
    isLogingOut: state.application.isLogingOut,
    isLoggedIn: state.application.isLoggedIn, // TODO: remove as is not being used in this class
    isConnected: state.application.isConnected,
    api: state.application.api,
    isGlobalRenderRequired: state.application.isRenderRequired,
    lastUpdateCheck: state.application.lastUpdateCheck,
    settingsMigratedV2: state.application.settingsMigratedV2,
    isNotificationsEnabled: state.application.isNotificationOpen,
    notificationDetails: state.application.notificationDetails,

    // Account
    unreadActivityCount: state.account.currentAccount.unread_activity_count,
    currentAccount: state.account.currentAccount,
    otherAccounts: state.account.otherAccounts,
    pinCode: state.application.pin,

    // UI
    toastNotification: state.ui.toastNotification,
    activeBottomTab: state.ui.activeBottomTab,
    rcOffer: state.ui.rcOffer,
  }),
  dispatch => ({
    dispatch,
    actions: {
      ...bindActionCreators(
        {
          fetchGlobalProperties,
          fetchCoinQuotes,
        },
        dispatch,
      ),
    },
  }),
)(injectIntl(ApplicationContainer));
