import React from 'react';
import { View } from 'react-native';
import { TextInput } from '../../../textInput';
import { IconButton } from '../../../iconButton';

import styles from './chipStyle';

function Chip(props) {
  return (
    <View style={[styles.wrapper, props.isPin && styles.isPin]}>
      <TextInput
        style={[styles.textInput, props.removeButton && styles.textInputWithButton]}
        allowFontScaling
        onChangeText={(text) => props.handleOnChange(text)}
        onBlur={() => props.handleOnBlur()}
        {...props}
      />
      {props.removeButton && (
        <IconButton
          style={styles.removeIcon}
          iconStyle={styles.iconStyle}
          size={16}
          iconType="MaterialIcons"
          name="close"
          onPress={props.handleOnRemoveButtonPress && props.handleOnRemoveButtonPress}
        />
      )}
    </View>
  );
}

export default Chip;
