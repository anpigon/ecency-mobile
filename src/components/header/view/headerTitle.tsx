// Styles
import React from 'react';
import {useIntl} from 'react-intl';
import {View, Text} from 'react-native';

import styles from './headerStyles';

interface Props {
  username?: string;
  displayName?: string;
  isReverse: boolean;
  reputation: any;
  isLoginDone: boolean;
  isLoggedIn: boolean;
}

const HeaderTitle: React.FC<Props> = ({
  username,
  displayName,
  reputation,
  isReverse,
  isLoginDone,
  isLoggedIn,
}) => {
  const intl = useIntl();

  if (displayName || username) {
    return (
      <View style={[styles.titleWrapper, isReverse && styles.titleWrapperReverse]}>
        {displayName && (
          <Text numberOfLines={1} style={styles.title}>
            {displayName}
          </Text>
        )}
        <Text style={styles.subTitle}>
          {`@${username}`}
          {reputation && ` (${reputation})`}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.titleWrapper}>
      {isLoginDone && !isLoggedIn && (
        <Text numberOfLines={2} style={styles.noAuthTitle}>
          {intl.formatMessage({id: 'header.title'})}
        </Text>
      )}
    </View>
  );
};

export default HeaderTitle;
