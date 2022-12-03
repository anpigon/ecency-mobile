import React from 'react';
import { View } from 'react-native';
import styles from './grayWrapperStyles';

function GrayWrapper({ children, isGray }) {
  return isGray ? <View style={styles.wrapper}>{children}</View> : children;
}

export default GrayWrapper;
