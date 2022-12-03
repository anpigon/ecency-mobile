import React from 'react';
import { TouchableOpacity, Text } from 'react-native';

import styles from './circularButtonStyles';

/* Props
 *
 *   @prop { string }    text             - Text inside of button.
 *   @prop { func }      onPress          - When button clicked, this function will call.
 *   @prop { array }     style            - It is addionatly syle for button.
 *   @prop { any }       value            - When button clicked, this value will push with on press func.
 */
function CircularButtonView({ text, onPress, style, value }) {
  return (
    <TouchableOpacity style={[styles.button, style]} onPress={() => onPress && onPress(value)}>
      <Text style={styles.buttonText}>{text}</Text>
    </TouchableOpacity>
  );
}

export default CircularButtonView;
