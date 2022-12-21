/* eslint-disable react/jsx-props-no-spreading */
import React, {PropsWithChildren, useMemo} from 'react';
import {Platform, View, Text, ViewStyle, StyleProp, TextStyle} from 'react-native';
import {IconProps} from 'react-native-vector-icons/Icon';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Feather from 'react-native-vector-icons/Feather';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

import styles from './iconStyles';

interface Props extends PropsWithChildren, IconProps {
  iconType: string;
  name: string;
  androidName?: string;
  badgeCount?: number;
  badgeStyle?: StyleProp<ViewStyle>;
  badgeTextStyle?: StyleProp<TextStyle>;
}

const IconView: React.FC<Props> = props => {
  const {badgeCount, iconType, name, androidName, children, badgeStyle, badgeTextStyle} = props;

  const badgeCountString = useMemo(
    () => (badgeCount && badgeCount >= 99 ? '99+' : `${badgeCount}`),
    [badgeCount],
  );

  // for ios its turn ios-eye-off-outline
  // for android its turn to md-off-outline
  const getIconName = (iconName: string) => {
    if (Platform.OS === 'ios') {
      return iconName;
    }
    return androidName || (name && `md-${name.split('ios-')}`);
  };

  const renderIcon = useMemo(() => {
    switch (iconType) {
      case 'Feather':
        return <Feather {...props} />;
      case 'FontAwesome':
        return <FontAwesome {...props} />;
      case 'FontAwesome5':
        return <FontAwesome5 {...props} />;
      case 'SimpleLineIcons':
        return <SimpleLineIcons {...props}>{children}</SimpleLineIcons>;
      case 'AntDesign':
        return <AntDesign {...props}>{children}</AntDesign>;
      case 'MaterialIcons':
        return <MaterialIcons {...props}>{children}</MaterialIcons>;
      case 'MaterialCommunityIcons':
        return <MaterialCommunityIcons {...props}>{children}</MaterialCommunityIcons>;
      default:
        const iconName = getIconName(name);
        return <Ionicons {...props} name={iconName} />;
    }
  }, [iconType, name, androidName, children, badgeStyle, badgeTextStyle]);

  const getIconWithBadge = (count: string) => {
    return (
      <>
        <View style={[badgeStyle || styles.badgeWrapper]}>
          <Text style={[badgeTextStyle || styles.badge]}>{count}</Text>
        </View>
        {renderIcon}
      </>
    );
  };

  if (!badgeCount) {
    return renderIcon;
  }

  return getIconWithBadge(badgeCountString);
};

export default IconView;
/* eslint-enable react/jsx-props-no-spreading */
