import React from 'react';
import {StyleSheet} from 'react-native';
import {useIntl} from 'react-intl';
import ROUTES from '../constants/routeNames';
import RootNavigation from '../navigation/rootNavigation';

import {NoPost} from '../components';
import {useAppSelector} from '../hooks';

function LoggedInContainer({children}: any) {
  const intl = useIntl();

  const isLoggedIn = useAppSelector(state => state.application.isLoggedIn);
  const isLoginDone = useAppSelector(state => state.application.isLoginDone);

  if (!isLoggedIn) {
    return (
      <NoPost
        style={styles.noPost}
        isButtonText
        defaultText={intl.formatMessage({
          id: 'profile.login_to_see',
        })}
        handleOnButtonPress={() => RootNavigation.navigate(ROUTES.SCREENS.LOGIN)}
      />
    );
  }

  return (
    children &&
    children({
      isLoggedIn,
      isLoginDone,
    })
  );
}

export default LoggedInContainer;

const styles = StyleSheet.create({
  noPost: {
    flex: 1,
  },
});
