import React from 'react';
import get from 'lodash/get';
import has from 'lodash/has';

// Component
import {useDispatch} from 'react-redux';
import {useNavigation} from '@react-navigation/native';
import HeaderView from '../view/headerView';

import {AccountContainer, ThemeContainer} from '../../../containers';
import {parseReputation} from '../../../utils/user';
import {toggleQRModal} from '../../../redux/actions/uiAction';

function HeaderContainer({selectedUser, isReverse, handleOnBackPress, hideUser, showQR}) {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const _handleOpenDrawer = () => {
    if (has(navigation, 'openDrawer') && typeof get(navigation, 'openDrawer') === 'function') {
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
    <ThemeContainer>
      {({isDarkTheme}) => (
        <AccountContainer>
          {({currentAccount, isLoggedIn, isLoginDone}) => {
            const _user = isReverse && selectedUser ? selectedUser : currentAccount;

            const reputation = parseReputation(get(_user, 'reputation'));
            return (
              <HeaderView
                displayName={get(_user, 'display_name')}
                handleOnPressBackButton={_handleOnPressBackButton}
                handleOnQRPress={_handleQRPress}
                handleOpenDrawer={_handleOpenDrawer}
                isDarkTheme={isDarkTheme}
                isLoggedIn={isLoggedIn}
                isLoginDone={isLoginDone}
                isReverse={isReverse}
                reputation={reputation}
                username={get(_user, 'name')}
                hideUser={hideUser}
                showQR={showQR}
              />
            );
          }}
        </AccountContainer>
      )}
    </ThemeContainer>
  );
}

export default HeaderContainer;
