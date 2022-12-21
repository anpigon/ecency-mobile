/* eslint-disable no-bitwise */
import {Component} from 'react';
import {connect} from 'react-redux';
import {injectIntl} from 'react-intl';
import {Alert} from 'react-native';

// Services and Actions
import {
  lookupAccounts,
  transferToken,
  convert,
  transferFromSavings,
  transferToSavings,
  transferToVesting,
  getAccount,
  transferPoint,
  withdrawVesting,
  delegateVestingShares,
  setWithdrawVestingRoute,
} from '../providers/hive/dhive';
import {toastNotification} from '../redux/actions/uiAction';
import {getUserDataWithUsername} from '../realm/realm';
import {getPointsSummary} from '../providers/ecency/ePoint';

// Utils
import {countDecimals} from '../utils/number';
import bugsnagInstance from '../config/bugsnag';
import {fetchAndSetCoinsData} from '../redux/actions/walletActions';
import {RootState} from '../redux/store/store';

/*
 *            Props Name        Description                                     Value
 *@props -->  props name here   description here                                Value Type Here
 *
 */

type Props = any;

interface State {
  fundType: string;
  balance: number;
  tokenAddress: string;
  transferType: string;
  referredUsername: string;
  selectedAccount: any;
}

class TransferContainer extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      fundType: props.route.params?.fundType ?? '',
      balance: props.route.params?.balance ?? 0,
      tokenAddress: props.route.params?.tokenAddress ?? '',
      transferType: props.route.params?.transferType ?? '',
      referredUsername: props.route.params?.referredUsername,
      selectedAccount: props.currentAccount,
    };
  }

  // Component Life Cycle Functions
  componentDidMount() {
    const {
      currentAccount: {name},
    } = this.props;

    this.fetchBalance(name);
  }

  // Component Functions

  _getUserPointsBalance = async (username: string) => {
    try {
      const userPoints = await getPointsSummary(username);
      const balance = Math.round(Number(userPoints?.points) * 1000) / 1000;
      this.setState({balance});
    } catch (err: any) {
      if (err) {
        Alert.alert(err?.message || err.toString());
      }
    }
  };

  fetchBalance = async (username: string) => {
    const {fundType, transferType, tokenAddress} = this.state;

    const account = await getAccount(username);
    let balance;

    if (
      (transferType === 'purchase_estm' || transferType === 'transfer_token') &&
      fundType === 'STEEM'
    ) {
      balance = account.balance?.toString().replace(fundType, '');
    }
    if (
      (transferType === 'purchase_estm' ||
        transferType === 'convert' ||
        transferType === 'transfer_token') &&
      fundType === 'SBD'
    ) {
      balance = account.sbd_balance?.toString().replace(fundType, '');
    }
    if (transferType === 'points' && fundType === 'ESTM') {
      this._getUserPointsBalance(username);
    }
    if (transferType === 'transfer_to_savings' && fundType === 'STEEM') {
      balance = account.balance?.toString().replace(fundType, '');
    }
    if (transferType === 'transfer_to_savings' && fundType === 'SBD') {
      balance = account.sbd_balance?.toString().replace(fundType, '');
    }
    if (transferType === 'transfer_to_vesting' && fundType === 'STEEM') {
      balance = account.balance?.toString().replace(fundType, '');
    }
    if (transferType === 'address_view' && fundType === 'BTC') {
      // TODO implement transfer of custom tokens
      console.log(tokenAddress);
    }

    const local = await getUserDataWithUsername(username);

    if (balance) {
      this.setState({balance: Number(balance)});
    }

    this.setState({
      selectedAccount: {...account, local: local[0]},
    });
  };

  // eslint-disable-next-line class-methods-use-this
  _getAccountsWithUsername = async (username: string) => {
    const validUsers = await lookupAccounts(username);
    return validUsers;
  };

  _delayedRefreshCoinsData = () => {
    const {dispatch} = this.props;
    setTimeout(() => {
      dispatch(fetchAndSetCoinsData(true));
    }, 3000);
  };

  _transferToAccount = async (from: string, destination: string, amount: number, memo: string) => {
    const {pinCode, navigation, dispatch, intl, route} = this.props;
    let {currentAccount} = this.props;
    const {selectedAccount} = this.state;

    const transferType = route.params?.transferType ?? '';
    const fundType = route.params?.fundType ?? '';
    let func;

    const data: any = {
      from,
      destination,
      amount,
      memo,
    };

    if (countDecimals(Number(data.amount)) < 3) {
      data.amount = Number(data.amount).toFixed(3);
    }

    data.amount = `${data.amount} ${fundType}`;
    switch (transferType) {
      case 'transfer_token':
        func = transferToken;
        break;
      case 'purchase_estm':
        func = transferToken;
        break;
      case 'convert':
        func = convert;
        data.requestId = new Date().getTime() >>> 0;
        break;
      case 'transfer_to_savings':
        func = transferToSavings;
        break;
      case 'transfer_to_vesting':
        func = transferToVesting;
        break;
      case 'withdraw_hive':
        func = transferFromSavings;
        data.requestId = new Date().getTime() >>> 0;
        break;
      case 'withdraw_hbd':
        func = transferFromSavings;
        data.requestId = new Date().getTime() >>> 0;
        break;
      case 'points':
        func = transferPoint;
        break;
      case 'power_down':
        data.amount = `${amount.toFixed(6)} VESTS`;
        func = withdrawVesting;
        currentAccount = selectedAccount;
        break;
      case 'delegate':
        func = delegateVestingShares;
        currentAccount = selectedAccount;
        data.amount = `${amount.toFixed(6)} VESTS`;
        break;
      default:
        break;
    }
    if (!currentAccount.local) {
      const realmData = await getUserDataWithUsername(currentAccount.name);
      currentAccount.local = realmData[0];
    }

    return func?.(currentAccount, pinCode, data)
      .then(() => {
        dispatch(toastNotification(intl.formatMessage({id: 'alert.successful'})));
        this._delayedRefreshCoinsData();
        navigation.goBack();
      })
      .catch(err => {
        navigation.goBack();
        bugsnagInstance.notify(err);
        dispatch(toastNotification(intl.formatMessage({id: 'alert.key_warning'})));
      });
  };

  _setWithdrawVestingRoute = async (
    from: string,
    to: string,
    percentage: string,
    autoVest: string,
  ) => {
    const {currentAccount, pinCode} = this.props;
    try {
      await setWithdrawVestingRoute(currentAccount, pinCode, {
        from,
        to,
        percentage,
        autoVest,
      });
    } catch (err: any) {
      Alert.alert(err.message || err.toString());
    }
  };

  _handleOnModalClose = () => {
    const {navigation} = this.props;
    this._delayedRefreshCoinsData();
    navigation.goBack();
  };

  render() {
    const {accounts, children, hivePerMVests, currentAccount, actionModalVisible, dispatch, route} =
      this.props;
    const {balance, fundType, selectedAccount, tokenAddress, referredUsername} = this.state;

    const transferType = route.params?.transferType ?? '';

    return (
      children &&
      children({
        dispatch,
        accounts,
        balance,
        tokenAddress,
        fundType,
        transferType,
        selectedAccount,
        hivePerMVests,
        actionModalVisible,
        referredUsername,
        fetchBalance: this.fetchBalance,
        getAccountsWithUsername: this._getAccountsWithUsername,
        transferToAccount: this._transferToAccount,
        handleOnModalClose: this._handleOnModalClose,
        accountType: selectedAccount?.local?.authType || currentAccount?.local?.authType,
        currentAccountName: currentAccount?.name,
        setWithdrawVestingRoute: this._setWithdrawVestingRoute,
      })
    );
  }
}

const mapStateToProps = (state: RootState) => ({
  accounts: state.account.otherAccounts,
  currentAccount: state.account.currentAccount,
  pinCode: state.application.pin,
  hivePerMVests: state.account.globalProps.hivePerMVests,
  actionModalVisible: state.ui.actionModalVisible,
});

export default connect(mapStateToProps)(injectIntl(TransferContainer));
/* eslint-enable no-bitwise */
