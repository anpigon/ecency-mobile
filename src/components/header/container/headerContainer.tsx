import React from 'react';

// Component
import {useDispatch} from 'react-redux';
import {useNavigation} from '@react-navigation/native';
import HeaderView from '../view/headerView';

import {parseReputation} from '../../../utils/user';
import {toggleQRModal} from '../../../redux/actions/uiAction';
import {useAppSelector} from '../../../hooks';

interface Props {
  selectedUser?: any;
  isReverse?: boolean;
  handleOnBackPress?: any;
  hideUser?: any;
  showQR?: boolean;
}

const HeaderContainer: React.FC<Props> = ({
  selectedUser,
  isReverse,
  handleOnBackPress,
  hideUser,
  showQR,
}) => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const isDarkTheme = useAppSelector(state => state.application.isDarkTheme);
  const currentAccount = useAppSelector(state => state.account.currentAccount);
  const isLoggedIn = useAppSelector(state => state.application.isLoggedIn);
  const isLoginDone = useAppSelector(state => state.application.isLoginDone);

  const user = isReverse && selectedUser ? selectedUser : currentAccount;
  const reputation = parseReputation(user?.reputation);

  const _handleOpenDrawer = () => {
    if ('openDrawer' in navigation && typeof navigation?.openDrawer === 'function') {
      navigation.openDrawer();
    }
  };

  const _handleOnPressBackButton = () => {
    if (handleOnBackPress) {
      handleOnBackPress();
    }

    navigation.goBack();
  };

  const _handleQRPress = () => {
    dispatch(toggleQRModal(true));
  };

  return (
    <HeaderView
      displayName={user?.display_name}
      handleOnPressBackButton={_handleOnPressBackButton}
      handleOnQRPress={_handleQRPress}
      handleOpenDrawer={_handleOpenDrawer}
      isDarkTheme={isDarkTheme}
      isLoggedIn={isLoggedIn}
      isLoginDone={isLoginDone}
      isReverse={isReverse}
      reputation={reputation}
      username={user?.name}
      hideUser={hideUser}
      showQR={showQR}
    />
  );
};

HeaderContainer.defaultProps = {
  showQR: false,
  isReverse: false,
};

export default HeaderContainer;
