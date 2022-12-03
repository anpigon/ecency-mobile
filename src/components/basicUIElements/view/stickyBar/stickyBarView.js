import React from 'react';
import { View, SafeAreaView } from 'react-native';
import styles from './stickyBarStyles';

function StickyBar({ children, isFixedFooter, style }) {
  return (
    <SafeAreaView>
      <View style={[styles.container, isFixedFooter && styles.fixedFooter, style]}>{children}</View>
    </SafeAreaView>
  );
}

export default StickyBar;
