import React, {useEffect, useState} from 'react';
import {View, TouchableOpacity, StyleProp, ViewStyle} from 'react-native';

import styles from './checkboxStyles';

interface Props {
  clicked: (value: any, isCheck: boolean) => void;
  isChecked: boolean;
  value?: any;
  locked?: boolean;
  style?: StyleProp<ViewStyle>;
}

CheckBoxView.defaultProps = {
  locked: false,
};

function CheckBoxView({clicked, value, isChecked, style, locked}: Props) {
  const [isCheck, setIsCheck] = useState(false);

  useEffect(() => {
    setIsCheck(isChecked);
  }, [isChecked]);

  const _checkClicked = () => {
    setIsCheck(!isCheck);

    if (clicked) {
      clicked(value, !isCheck);
    }
  };

  if (locked) {
    return (
      <View style={styles.bigSquare}>
        <View style={[styles.smallSquare, isChecked && styles.checked]} />
      </View>
    );
  }

  return (
    <TouchableOpacity onPress={_checkClicked} style={style}>
      <View style={styles.bigSquare}>
        <View style={[styles.smallSquare, isCheck && styles.checked]} />
      </View>
    </TouchableOpacity>
  );
}

export default CheckBoxView;
