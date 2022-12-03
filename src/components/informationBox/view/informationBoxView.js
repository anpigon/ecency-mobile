import React from 'react';
import { View, Text } from 'react-native';
import styles from './informationBoxStyles';

function InformationBox({ text, style, textStyle }) {
  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.text, textStyle]}>{text}</Text>
    </View>
  );
}

export default InformationBox;
