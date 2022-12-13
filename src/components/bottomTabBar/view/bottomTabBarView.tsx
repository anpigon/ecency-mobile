/* eslint-disable react/jsx-props-no-spreading */
import React, {useEffect} from 'react';
import {SafeAreaView, View, TouchableOpacity} from 'react-native';

// Components
// import TabBar from './tabbar';

// Constants
import {useDispatch} from 'react-redux';
import {BottomTabBarProps} from '@react-navigation/bottom-tabs';
import ROUTES from '../../../constants/routeNames';

// Styles
import styles from './bottomTabBarStyles';
import Icon, {IconContainer} from '../../icon';
import scalePx from '../../../utils/scalePx';
import {updateActiveBottomTab} from '../../../redux/actions/uiAction';

function BottomTabBarView({state: {routes, index}, navigation, descriptors}: BottomTabBarProps) {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(updateActiveBottomTab(routes[index].name));
  }, [index]);

  const _jumpTo = (route: typeof routes[0], isFocused: boolean) => {
    if (route.name === ROUTES.TABBAR.POST_BUTTON) {
      // TODO: 로그인 여부 체크할 것
      navigation.navigate(ROUTES.SCREENS.EDITOR, {key: 'editor_post'});
      return;
    }

    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    // TODO: also enable tap to scroll up feature
    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  };

  const _tabButtons = routes.map((route, idx) => {
    const {tabBarActiveTintColor, tabBarInactiveTintColor} = descriptors[route.key].options;
    const isFocused = index === idx;
    const iconColor = isFocused ? tabBarActiveTintColor : tabBarInactiveTintColor;

    const _iconProps = {
      iconType: 'MaterialIcons',
      style: {padding: 15},
      name: (route.params as any)?.iconName,
      color: iconColor,
      size: scalePx(26),
    };

    let _tabBarIcon = <Icon {..._iconProps} />;
    switch (route.name) {
      case ROUTES.TABBAR.NOTIFICATION:
        _tabBarIcon = <IconContainer isBadge badgeType="notification" {..._iconProps} />;
        break;
      case ROUTES.TABBAR.POST_BUTTON:
        _iconProps.iconType = 'MaterialCommunityIcons';
        _tabBarIcon = <Icon {..._iconProps} />;
        break;
    }

    return (
      <View key={route.key} style={styles.tabButtons}>
        <TouchableOpacity onPress={() => _jumpTo(route, isFocused)}>{_tabBarIcon}</TouchableOpacity>
      </View>
    );
  });

  return <SafeAreaView style={styles.wrapper}>{_tabButtons}</SafeAreaView>;
}

export default BottomTabBarView;
