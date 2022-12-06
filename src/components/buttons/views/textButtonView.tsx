import React, {Fragment} from 'react';
import {Text, View, TouchableWithoutFeedback} from 'react-native';

import styles from './textButtonStyles';

function TextButtonView({text, onPress, style, textStyle, disabled}) {
  return (
    <TouchableWithoutFeedback
      style={[styles.button]}
      disabled={disabled}
      onPress={() => onPress && onPress()}>
      <View style={style}>
        <Text style={[styles.buttonText, textStyle]}>{text}</Text>
      </View>
    </TouchableWithoutFeedback>
  );
}

export default TextButtonView;
