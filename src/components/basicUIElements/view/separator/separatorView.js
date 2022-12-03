import React from 'react';
import { View } from 'react-native';

import styles from './separatorStyles';

function Separator({ style }) {
  return <View style={[styles.separator, style]} />;
}

export default Separator;
