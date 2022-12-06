import React from 'react';
import {View} from 'react-native';
import styles from './lineBreakStyles';

function LineBreak({color, children, height}) {
  return <View style={[styles.lineBreak, {height, color}]}>{children}</View>;
}

export default LineBreak;
