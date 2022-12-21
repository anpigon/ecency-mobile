import React, {Component} from 'react';
import {Alert} from 'react-native';
import {connect} from 'react-redux';
import {injectIntl} from 'react-intl';

import {useNavigation} from '@react-navigation/native';
import {promote, boost, isPostAvailable} from '../providers/hive/dhive';
import {toastNotification} from '../redux/actions/uiAction';
import {getUserDataWithUsername} from '../realm/realm';
import {RootState} from '../redux/store/store';

/*
 *            Props Name        Description                                     Value
 *@props -->  props name here   description here                                Value Type Here
 *
 */

type Props = any;
interface State {
  isLoading: boolean;
  isSCModalOpen: boolean;
  SCPath: string;
  actionSpecificParam?: any;
}

class RedeemContainer extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      isLoading: false,
      isSCModalOpen: false,
      SCPath: '',
    };
  }

  // Component Life Cycle Functions

  // Component Functions

  _redeemAction = async (
    redeemType = 'promote',
    actionSpecificParam = 0,
    permlink = '',
    author = '',
    user: any = null,
  ) => {
    this.setState({isLoading: true});
    const {currentAccount, pinCode, dispatch, intl, navigation} = this.props;
    let action;
    let specificParam;
    switch (redeemType) {
      case 'promote':
        action = promote;
        specificParam = {duration: actionSpecificParam};
        break;
      case 'boost':
        action = boost;
        specificParam = {amount: `${actionSpecificParam.toFixed(3)} POINT`};
        break;
    }

    if (user?.local?.authType === 'steemConnect') {
      const json = JSON.stringify({
        user: user?.name,
        author,
        permlink,
        ...specificParam,
      });
      const uriType = redeemType === 'promote' ? 'ecency_promote' : 'ecency_boost';
      const uri = `sign/custom-json?authority=active&required_auths=%5B%22${
        user?.name
      }%22%5D&required_posting_auths=%5B%5D&id=${uriType}&json=${encodeURIComponent(json)}`;
      this.setState({
        isSCModalOpen: true,
        SCPath: uri,
      });
      return;
    }

    try {
      await action?.(user || currentAccount, pinCode, actionSpecificParam, permlink, author);
      navigation.goBack();
      dispatch(toastNotification(intl.formatMessage({id: 'alert.successful'})));
    } catch (error) {
      console.error(error);
      dispatch(toastNotification(intl.formatMessage({id: 'alert.key_warning'})));
    }

    this.setState({isLoading: false});
  };

  _handleOnSubmit = async (
    redeemType: any,
    actionSpecificParam: any,
    fullPermlink: any,
    selectedUser: any,
  ) => {
    const {intl, currentAccount} = this.props;
    const separatedPermlink = fullPermlink.split('/');
    const _author = separatedPermlink?.[0];
    const _permlink = separatedPermlink?.[1];
    const _isPostAvailable = await isPostAvailable(_author, _permlink);

    if (!_isPostAvailable) {
      Alert.alert(intl.formatMessage({id: 'alert.not_existing_post'}));
      return;
    }

    let userFromRealm;

    if (selectedUser) {
      userFromRealm = await getUserDataWithUsername(selectedUser);
    }

    const user = userFromRealm
      ? {
          name: selectedUser,
          local: userFromRealm[0],
        }
      : currentAccount;

    this._redeemAction(redeemType, actionSpecificParam, _permlink, _author, user);
  };

  _handleOnSCModalClose = () => {
    this.setState({isSCModalOpen: false, isLoading: false});
  };

  render() {
    const {children} = this.props;
    const {isLoading, isSCModalOpen, SCPath, actionSpecificParam} = this.state;

    return (
      children &&
      children({
        isLoading,
        redeemAction: this._redeemAction,
        isSCModalOpen,
        SCPath,
        handleOnSubmit: this._handleOnSubmit,
        actionSpecificParam,
        handleOnSCModalClose: this._handleOnSCModalClose,
      })
    );
  }
}

const mapStateToProps = (state: RootState) => ({
  username: state.account.currentAccount.name,
  activeBottomTab: state.ui.activeBottomTab,
  isConnected: state.application.isConnected,
  accounts: state.account.otherAccounts,
  currentAccount: state.account.currentAccount,
  pinCode: state.application.pin,
  isPinCodeOpen: state.application.isPinCodeOpen,
  globalProps: state.account.globalProps,
});

const mapHooksToProps = (props: any) => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const navigation = useNavigation();
  // eslint-disable-next-line react/jsx-props-no-spreading
  return <RedeemContainer {...props} navigation={navigation} />;
};

export default connect(mapStateToProps)(injectIntl(mapHooksToProps));
