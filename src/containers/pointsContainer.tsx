import React, {useState, useEffect, useCallback} from 'react';
import {Alert} from 'react-native';
import {useDispatch} from 'react-redux';
import get from 'lodash/get';
import {AxiosError} from 'axios';
import {useIntl} from 'react-intl';

// Services and Actions
import {useNavigation} from '@react-navigation/native';
import {getPointsSummary, claimPoints, getPointsHistory} from '../providers/ecency/ePoint';
import {getAccount, boost} from '../providers/hive/dhive';
import {getUserDataWithUsername} from '../realm/realm';
import {toastNotification} from '../redux/actions/uiAction';

// Constant
import POINTS from '../constants/options/points';

// Constants
import ROUTES from '../constants/routeNames';

// Utils
import {groomingPointsTransactionData, getPointsEstimate} from '../utils/wallet';
import {useAppSelector} from '../hooks';
import {UserPoint} from '../providers/ecency/ecency.types';

/*
 *            Props Name        Description                                     Value
 *@props -->  props name here   description here                                Value Type Here
 *
 */

const PointsContainer: React.FC<any> = ({children, route}) => {
  const navigation = useNavigation<any>();

  const user = useAppSelector(state => state.account.currentAccount);
  const username = useAppSelector(state => state.account.currentAccount.name);
  const activeBottomTab = useAppSelector(state => state.ui.activeBottomTab);
  const isConnected = useAppSelector(state => state.application.isConnected);
  const accounts = useAppSelector(state => state.account.otherAccounts);
  const currentAccount = useAppSelector(state => state.account.currentAccount);
  const pinCode = useAppSelector(state => state.application.pin);
  const isPinCodeOpen = useAppSelector(state => state.application.isPinCodeOpen);
  const currency = useAppSelector(state => state.application.currency.currency);
  // const globalProps = useAppSelector(state => state.account.globalProps);

  const [userPoints, setUserPoints] = useState({});
  const [userActivities, setUserActivities] = useState<any[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [estimatedEstm, setEstimatedEstm] = useState(0);
  const [navigationParams, setNavigationParams] = useState<any>({});
  const [balance, setBalance] = useState(0);
  const intl = useIntl();
  const dispatch = useDispatch();

  useEffect(() => {
    if (isConnected) {
      fetchUserPointActivities(username);
    }

    if (route && route.params) {
      const _navigationParams = route.params;

      setNavigationParams(_navigationParams);
    }
  }, [isConnected, route, username]);

  useEffect(() => {
    if (isConnected && activeBottomTab === ROUTES.TABBAR.WALLET && username) {
      fetchUserPointActivities(username);
    }
  }, [isConnected, username, activeBottomTab]);

  // Component Functions

  const handleOnDropdownSelected = (type: string) => {
    let navigateTo;
    let navigateParams;

    if (type === 'dropdown_transfer') {
      navigateTo = ROUTES.SCREENS.TRANSFER;
      navigateParams = {
        transferType: 'points',
        fundType: 'ESTM',
        balance,
      };
    }
    if (type === 'dropdown_promote') {
      navigateTo = ROUTES.SCREENS.REDEEM;
      navigateParams = {
        balance,
        redeemType: 'promote',
      };
    }
    if (type === 'dropdown_boost') {
      navigateTo = ROUTES.SCREENS.REDEEM;
      navigateParams = {
        balance,
        redeemType: 'boost',
      };
    }

    if (isPinCodeOpen) {
      navigation.navigate({
        name: ROUTES.SCREENS.PINCODE,
        params: {
          navigateTo,
          navigateParams,
        },
      });
    } else {
      // @ts-ignore
      navigation.navigate(navigateTo, {
        name: navigateTo,
        params: navigateParams,
      });
    }
  };

  const _groomUserActivities = (_userActivities: UserPoint[]) => {
    return _userActivities.map(item => {
      const point = POINTS[item.type as keyof typeof POINTS];
      return groomingPointsTransactionData({
        ...item,
        icon: point?.icon,
        iconType: point?.iconType,
        textKey: point?.textKey,
      });
    });
  };

  const fetchUserPointActivities = useCallback(async (_username = username) => {
    if (!_username) {
      return;
    }
    setRefreshing(true);

    await getPointsSummary(_username)
      .then(async userPointsP => {
        const _balance = Math.round(Number(userPointsP.points) || 0 * 1000) / 1000;
        setUserPoints(userPointsP);
        setBalance(_balance);
        setEstimatedEstm(await getPointsEstimate(_balance, currency));
      })
      .catch((err: AxiosError) => {
        Alert.alert(err?.message || 'Error');
      });

    await getPointsHistory(_username)
      .then(userActivitiesP => {
        if (Object.entries(userActivitiesP).length !== 0) {
          setUserActivities(_groomUserActivities(userActivitiesP));
        }
      })
      .catch((err: AxiosError) => {
        if (err) {
          Alert.alert(err?.message || err.toString());
        }
      });

    setRefreshing(false);
    setIsLoading(false);
  }, []);

  const getUserBalance = async (_username: string) => {
    await getPointsSummary(_username)
      .then(_userPoints => {
        const _balance = Math.round(Number(_userPoints?.points) * 1000) || 0 / 1000;
        return _balance;
      })
      .catch(err => {
        if (err) {
          Alert.alert(get(err, 'message') || err.toString());
        }
      });
  };

  const _claimPoints = async () => {
    setIsClaiming(true);

    await claimPoints()
      .then(() => {
        fetchUserPointActivities(username);
      })
      .catch(error => {
        if (error) {
          Alert.alert(
            // eslint-disable-next-line max-len
            `PointsClaim - Connection issue, try again or write to support@ecency.com \n${error.message.substr(
              0,
              20,
            )}`,
          );
        }
      });

    setIsClaiming(false);
  };

  const _boost = async (point: number, permlink: string, author: string, _user: any) => {
    setIsLoading(true);

    await boost(_user || currentAccount, pinCode, point, permlink, author)
      .then(() => {
        setIsLoading(false);
        navigation.goBack();
        dispatch(toastNotification(intl.formatMessage({id: 'alert.successful'})));
      })
      .catch(error => {
        if (error) {
          setIsLoading(false);
          dispatch(toastNotification(intl.formatMessage({id: 'alert.key_warning'})));
        }
      });
  };

  const getESTMPrice = (points: number) => points / 150;

  return (
    children &&
    children({
      accounts,
      balance,
      boost: _boost,
      claim: _claimPoints,
      currentAccount,
      currentAccountName: currentAccount.name,
      fetchUserActivity: fetchUserPointActivities,
      getAccount,
      getESTMPrice,
      getUserBalance,
      getUserDataWithUsername,
      handleOnDropdownSelected,
      isClaiming,
      isLoading,
      navigationParams,
      refreshing,
      userActivities,
      userPoints,
      estimatedEstm,
      redeemType: navigationParams?.redeemType,
      user,
      dropdownOptions: ['dropdown_transfer', 'dropdown_promote', 'dropdown_boost'],
    })
  );
};

export default PointsContainer;
