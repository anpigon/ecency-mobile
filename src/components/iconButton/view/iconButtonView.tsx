import React from 'react';
import {
  TouchableOpacity,
  ActivityIndicator,
  StyleProp,
  TextStyle,
  ViewStyle,
  ColorValue,
  GestureResponderEvent,
} from 'react-native';
import EStyleSheet from 'react-native-extended-stylesheet';
import {Icon} from '../../icon';

import styles from './iconButtonStyles';

/* Props
 * ------------------------------------------------
 *   @prop { type }    name                - Description....
 */

interface Props {
  backgroundColor?: ColorValue;
  badgeCount?: number;
  badgeTextStyle?: StyleProp<TextStyle>;
  badgeStyle?: StyleProp<ViewStyle>;
  color?: ColorValue;
  disabled?: boolean;
  iconStyle?: StyleProp<TextStyle>;
  iconType?: string;
  name: string;
  onPress: () => void;
  size?: number;
  style?: StyleProp<ViewStyle>;
  isLoading?: boolean;
}

const IconButton: React.FC<Props> = ({
  backgroundColor,
  badgeCount,
  badgeTextStyle,
  badgeStyle,
  color,
  disabled,
  iconStyle,
  iconType,
  name,
  onPress,
  size,
  style,
  isLoading,
}) => {
  return (
    <TouchableOpacity
      style={[styles.iconButton, style]}
      onPress={() => !isLoading && onPress && onPress()}
      // @ts-expect-error
      underlayColor={backgroundColor || 'white'}
      disabled={disabled}>
      {!isLoading ? (
        <Icon
          style={[
            color && {color},
            backgroundColor && {backgroundColor},
            styles.icon,
            iconStyle && iconStyle,
          ]}
          badgeTextStyle={badgeTextStyle}
          name={name}
          badgeStyle={badgeStyle}
          size={size}
          iconType={iconType}
          badgeCount={badgeCount}
        />
      ) : (
        <ActivityIndicator
          color={color || EStyleSheet.value('$primaryBlue')}
          style={styles.activityIndicator}
        />
      )}
    </TouchableOpacity>
  );
};

IconButton.defaultProps = {
  disabled: false,
  isLoading: false,
};

export default IconButton;
