import React, {useState} from 'react';
import {View, SafeAreaView} from 'react-native';
import {useIntl} from 'react-intl';

// Components
import {useNavigation} from '@react-navigation/native';
import {SearchModal} from '../../searchModal';
import {IconButton} from '../../iconButton';

// Constants
import ROUTES from '../../../constants/routeNames';

// Styles
import styles from './headerStyles';
import HeaderAvatar from './headerAvatar';
import HeaderTitle from './headerTitle';
import HeaderActionButtons from './headerActionButtons';

interface Props {
  displayName: any;
  handleOnPressBackButton: any;
  handleOnQRPress: any;
  handleOpenDrawer: any;
  isDarkTheme: any;
  isLoggedIn: any;
  isLoginDone: any;
  isReverse: any;
  reputation: any;
  username: any;
  hideUser: any;
  showQR: any;
}

const HeaderView: React.FC<Props> = ({
  displayName,
  handleOnPressBackButton,
  handleOnQRPress,
  handleOpenDrawer,
  isDarkTheme,
  isLoggedIn,
  isLoginDone,
  isReverse,
  reputation,
  username,
  hideUser,
  showQR,
}) => {
  const intl = useIntl();
  const navigation = useNavigation<any>();

  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  const _onPressSearchButton = () => {
    navigation.navigate(ROUTES.SCREENS.SEARCH_RESULT);
  };

  return (
    <SafeAreaView style={[styles.container, isReverse && styles.containerReverse]}>
      {!hideUser && (
        <>
          <SearchModal
            placeholder={intl.formatMessage({id: 'header.search'})}
            isOpen={isSearchModalOpen}
            handleOnClose={() => setIsSearchModalOpen(false)}
          />
          <HeaderAvatar
            username={username}
            onOpenDrawer={handleOpenDrawer}
            isDarkTheme={isDarkTheme}
            isReverse={isReverse}
          />
          <HeaderTitle
            username={username}
            displayName={displayName}
            reputation={reputation}
            isReverse={isReverse}
            isLoginDone={isLoginDone}
            isLoggedIn={isLoggedIn}
          />
        </>
      )}
      <HeaderActionButtons
        onPressBack={handleOnPressBackButton}
        onPressQR={handleOnQRPress}
        showQR={showQR}
        isReverse={isReverse}
        onPressSearch={_onPressSearchButton}
      />
    </SafeAreaView>
  );
};

export default HeaderView;
