import React from 'react';
import {View} from 'react-native';
import styles from './cardStyles';

function Card({children}) {
  return <View style={styles.wrapper}>{children}</View>;
}

export default Card;
