// Styles
import React, {useMemo} from 'react';
import {TouchableOpacity, GestureResponderEvent} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {UserAvatar} from '../../userAvatar';

import styles from './headerStyles';

interface Props {
  isDarkTheme: boolean;
  isReverse: boolean;
  username: string;
  onOpenDrawer: (event: GestureResponderEvent) => void;
}

const HeaderAvatar: React.FC<Props> = ({username, isDarkTheme, isReverse, onOpenDrawer}) => {
  const gradientColor = useMemo(() => {
    if (isReverse) {
      return isDarkTheme ? ['#43638e', '#081c36'] : ['#357ce6', '#2d5aa0'];
    }
    return isDarkTheme ? ['#081c36', '#43638e'] : ['#2d5aa0', '#357ce6'];
  }, [isReverse, isDarkTheme]);

  return (
    <TouchableOpacity style={styles.avatarWrapper} onPress={onOpenDrawer} disabled={isReverse}>
      <LinearGradient
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}
        colors={gradientColor}
        style={[
          styles.avatarButtonWrapper,
          isReverse ? styles.avatarButtonWrapperReverse : styles.avatarDefault,
        ]}>
        <UserAvatar
          noAction
          style={isReverse ? styles.reverseAvatar : styles.avatar}
          username={username}
        />
      </LinearGradient>
    </TouchableOpacity>
  );
};

export default HeaderAvatar;
