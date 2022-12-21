import {useState, useEffect, useCallback} from 'react';
import {connect, useDispatch} from 'react-redux';
import {useIntl} from 'react-intl';

import {toastNotification} from '../redux/actions/uiAction';

// dhive
import {getAccount, claimRewardBalance} from '../providers/hive/dhive';

// Utils
import {groomingWalletData, groomingTransactionData, transferTypes} from '../utils/wallet';
import parseToken from '../utils/parseToken';
import {vestsToHp} from '../utils/conversions';
import RootNavigation from '../navigation/rootNavigation';
import {getEstimatedAmount} from '../utils/vote';

// Constants
import ROUTES from '../constants/routeNames';
import {COIN_IDS} from '../constants/defaultCoins';
import {RootState} from '../redux/store/store';

const HIVE_DROPDOWN = [
  'purchase_estm',
  'transfer_token',
  'transfer_to_savings',
  'transfer_to_vesting',
];
const BTC_DROPDOWN = ['transfer_token'];
const HBD_DROPDOWN = ['purchase_estm', 'transfer_token', 'transfer_to_savings', 'convert'];
const SAVING_HIVE_DROPDOWN = ['withdraw_hive'];
const SAVING_HBD_DROPDOWN = ['withdraw_hbd'];
const HIVE_POWER_DROPDOWN = ['delegate', 'power_down'];

interface Props {
  children: any;
  currentAccount: any;
  coinSymbol: any;
  globalProps: any;
  pinCode: any;
  selectedUser: any;
  setEstimatedWalletValue: any;
  hivePerMVests: any;
  isPinCodeOpen: boolean;
  currency: any;
}

const WalletContainer = ({
  children,
  currentAccount,
  coinSymbol,
  globalProps,
  pinCode,
  selectedUser,
  setEstimatedWalletValue,
  hivePerMVests,
  isPinCodeOpen,
  currency,
}: Props) => {
  const [isClaiming, setIsClaiming] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [walletData, setWalletData] = useState<any>(null);
  const [userActivities, setUserActivities] = useState<any[]>([]);
  const [hbdBalance, setHbdBalance] = useState(0);
  const [tokenBalance, setTokenBalance] = useState(0);
  const [tokenAddress, setTokenAddress] = useState('');
  const [hiveBalance, setHiveBalance] = useState(0);
  const [hpBalance, setHpBalance] = useState(0);
  const [hiveSavingBalance, setHiveSavingBalance] = useState(0);
  const [hbdSavingBalance, setHbdSavingBalance] = useState(0);
  const [estimatedValue, setEstimatedValue] = useState(0);
  const [estimatedHiveValue, setEstimatedHiveValue] = useState(0);
  const [estimatedHbdValue, setEstimatedHbdValue] = useState(0);
  const [estimatedTokenValue, setEstimatedTokenValue] = useState(0);
  const [estimatedHpValue, setEstimatedHpValue] = useState(0);
  const [unclaimedBalance, setUnclaimedBalance] = useState('');
  const [estimatedAmount, setEstimatedAmount] = useState(0);
  const [delegationsAmount, setDelegationsAmount] = useState(0);
  const [transferHistory, setTransferHistory] = useState<any[]>([]);
  const intl = useIntl();
  const dispatch = useDispatch();

  useEffect(() => {
    setEstimatedAmount(parseFloat(getEstimatedAmount(currentAccount, globalProps)));
  }, [currentAccount, globalProps]);

  useEffect(() => {
    _getWalletData(selectedUser);
  }, [selectedUser]);

  useEffect(() => {
    const _transferHistory = userActivities.filter(item => transferTypes.includes(item?.textKey));

    setTransferHistory(_transferHistory);
    setHbdBalance(Math.round((walletData?.hbdBalance || 0) * 1000) / 1000);
    setTokenBalance(Math.round((walletData?.tokenBalance || 0) * 1000) / 1000);
    setTokenAddress(walletData?.tokenAddress || '');
    setHiveBalance(Math.round((walletData?.balance || 0) * 1000) / 1000);
    setHiveSavingBalance(Math.round((walletData?.savingBalance || 0) * 1000) / 1000);
    setHbdSavingBalance(Math.round((walletData?.savingBalanceHbd || 0) * 1000) / 1000);
    setHpBalance(
      Math.round(vestsToHp(walletData?.vestingShares || 0, walletData?.hivePerMVests || 0) * 1000) /
        1000,
    );
    setEstimatedValue(walletData?.estimatedValue || 0);
    setEstimatedHiveValue(walletData?.estimatedHiveValue || 0);
    setEstimatedHbdValue(walletData?.estimatedHbdValue || 0);
    setEstimatedTokenValue(walletData?.estimatedTokenValue || 0);
    setEstimatedHpValue(walletData?.estimatedHpValue || 0);
    setDelegationsAmount(
      parseFloat(
        vestsToHp(
          (walletData?.vestingSharesReceived || 0) - (walletData?.vestingSharesDelegated || 0),
          walletData?.hivePerMVests || 0,
        ).toFixed(3),
      ),
    );

    if (
      walletData?.rewardHiveBalance ||
      walletData?.rewardHbdBalance ||
      walletData?.rewardVestingHive
    ) {
      updateUnclaimedBalance(walletData);
    }
  }, [userActivities, walletData]);

  const getBalance = (val: number, cur: string) => (val ? Math.round(val * 1000) / 1000 + cur : '');
  const updateUnclaimedBalance = (_walletData: any) => {
    setUnclaimedBalance(
      `${getBalance(_walletData?.rewardHiveBalance || 0, ' STEEM')} ${getBalance(
        _walletData?.rewardHbdBalance || 0,
        ' SBD',
      )} ${getBalance(_walletData?.rewardVestingHive || 0, ' SP')}`,
    );
  };

  // Components functions

  const _getWalletData = useCallback(
    async (_selectedUser: any) => {
      console.log('call _getWalletData');
      console.trace();
      const _walletData = await groomingWalletData(_selectedUser, globalProps, currency);

      setWalletData(_walletData);
      setIsLoading(false);
      setUserActivities(
        _walletData?.transactions?.map(item => groomingTransactionData(item, hivePerMVests)),
      );
      setEstimatedWalletValue && setEstimatedWalletValue(_walletData.estimatedValue);
      updateUnclaimedBalance(_walletData);
    },
    [globalProps, setEstimatedWalletValue, hivePerMVests],
  );

  const _isHasUnclaimedRewards = (account: any) => {
    return (
      parseToken(account?.reward_hive_balance) > 0 ||
      parseToken(account?.reward_hbd_balance) > 0 ||
      parseToken(account?.reward_vesting_hive) > 0
    );
  };

  const _claimRewardBalance = async () => {
    let isHasUnclaimedRewards = false;

    if (isClaiming) {
      return;
    }

    setIsClaiming(true);

    getAccount(currentAccount.name)
      .then(account => {
        isHasUnclaimedRewards = _isHasUnclaimedRewards(account);
        if (isHasUnclaimedRewards) {
          return claimRewardBalance(
            currentAccount,
            pinCode,
            account.reward_steem_balance,
            account.reward_sbd_balance,
            account.reward_vesting_balance,
          );
        }
        setIsClaiming(false);
      })
      .then(() => getAccount(currentAccount.name))
      .then(() => {
        _getWalletData(selectedUser);
        if (isHasUnclaimedRewards) {
          dispatch(toastNotification(intl.formatMessage({id: 'alert.claim_reward_balance_ok'})));
        }
      })
      .then(() => {
        _getWalletData(selectedUser);
        setIsClaiming(false);
      })
      .catch(() => {
        setIsClaiming(false);
        dispatch(toastNotification(intl.formatMessage({id: 'alert.fail'})));
      });
  };

  const _handleOnWalletRefresh = () => {
    if (refreshing) return;
    setRefreshing(true);
    getAccount(selectedUser.name)
      .then(() => {
        _getWalletData(selectedUser);
      })
      .catch(() => {
        dispatch(toastNotification(intl.formatMessage({id: 'alert.fail'})));
      })
      .finally(() => {
        setRefreshing(false);
      });
  };

  const _navigate = async (transferType: any, fundType: any) => {
    let balance;

    if (
      (transferType === 'transfer_token' || transferType === 'purchase_estm') &&
      fundType === 'HIVE'
    ) {
      balance = Math.round(walletData.balance * 1000) / 1000;
    }
    if (
      (transferType === 'transfer_token' ||
        transferType === 'convert' ||
        transferType === 'purchase_estm') &&
      fundType === 'HBD'
    ) {
      balance = Math.round(walletData.hbdBalance * 1000) / 1000;
    }
    if (transferType === 'withdraw_hive' && fundType === 'HIVE') {
      balance = Math.round(walletData.savingBalance * 1000) / 1000;
    }
    if (transferType === 'withdraw_hbd' && fundType === 'HBD') {
      balance = Math.round(walletData.savingBalanceHbd * 1000) / 1000;
    }

    if (isPinCodeOpen) {
      RootNavigation.navigate({
        name: ROUTES.SCREENS.PINCODE,
        params: {
          navigateTo: ROUTES.SCREENS.TRANSFER,
          navigateParams: {transferType, fundType, balance, tokenAddress},
        },
      });
    } else {
      RootNavigation.navigate({
        name: ROUTES.SCREENS.TRANSFER,
        params: {transferType, fundType, balance, tokenAddress},
      });
    }
  };

  const getTokenAddress = (tokenType: string) => {
    if (tokenType === 'BTC') {
      // console.log(getBtcAddress(pinCode, currentAccount));
    }
  };

  // process symbol based data
  let balance = 0;
  let estimateValue = 0;
  let savings = 0;
  switch (coinSymbol) {
    case COIN_IDS.HIVE:
      balance = hiveBalance;
      estimateValue = estimatedHiveValue;
      savings = hiveSavingBalance;
      break;
    case COIN_IDS.HBD:
      balance = hbdBalance;
      estimateValue = estimatedHbdValue;
      savings = hbdSavingBalance;
      break;

    default:
      break;
  }

  return (
    children &&
    children({
      claimRewardBalance: _claimRewardBalance,
      currentAccountUsername: currentAccount.name,
      handleOnWalletRefresh: _handleOnWalletRefresh,
      isClaiming,
      refreshing,
      selectedUsername: selectedUser?.name || '',
      isLoading,
      walletData,
      hivePerMVests,
      userActivities,
      transferHistory,
      hiveBalance,
      hpBalance,
      hbdBalance,
      tokenBalance,
      getTokenAddress,
      hiveSavingBalance,
      hbdSavingBalance,
      estimatedValue,
      estimatedHiveValue,
      estimatedHbdValue,
      estimatedTokenValue,
      estimatedHpValue,
      delegationsAmount,
      navigate: _navigate,
      hiveDropdown: HIVE_DROPDOWN,
      hbdDropdown: HBD_DROPDOWN,
      btcDropdown: BTC_DROPDOWN,
      savingHiveDropdown: SAVING_HIVE_DROPDOWN,
      savingHbdDropdown: SAVING_HBD_DROPDOWN,
      hivePowerDropdown: HIVE_POWER_DROPDOWN,
      unclaimedBalance: unclaimedBalance && unclaimedBalance.trim(),
      estimatedAmount,

      // symbol based data
      balance,
      estimateValue,
      savings,
    })
  );
};

const mapStateToProps = (state: RootState) => ({
  currentAccount: state.account.currentAccount,
  pinCode: state.application.pin,
  globalProps: state.account.globalProps,
  currency: state.application.currency.currency,
  hivePerMVests: state.account.globalProps.hivePerMVests,
  isPinCodeOpen: state.application.isPinCodeOpen,
});

export default connect(mapStateToProps)(WalletContainer);
