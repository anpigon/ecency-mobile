// Styles
import React from 'react';
import {View} from 'react-native';
import {IconButton} from '../../iconButton';

import styles from './headerStyles';

interface Props {
  showQR: boolean;
  isReverse: boolean;
  onPressBack: () => void;
  onPressQR: () => void;
  onPressSearch: () => void;
}

const HeaderActionButtons: React.FC<Props> = ({
  showQR,
  isReverse,
  onPressBack,
  onPressQR,
  onPressSearch,
}) => {
  if (isReverse) {
    return (
      <View style={styles.reverseBackButtonWrapper}>
        <IconButton
          style={styles.backButton}
          iconStyle={styles.backIcon}
          name="md-arrow-back"
          onPress={onPressBack}
        />
      </View>
    );
  }

  return (
    <View style={styles.backButtonWrapper}>
      {showQR && (
        <IconButton
          style={styles.viewIconContainer}
          iconStyle={styles.viewIcon}
          name="qr-code-sharp"
          iconType="IonIcons"
          onPress={onPressQR}
        />
      )}
      <IconButton iconStyle={styles.backIcon} name="md-search" onPress={onPressSearch} />
    </View>
  );
};

export default HeaderActionButtons;
