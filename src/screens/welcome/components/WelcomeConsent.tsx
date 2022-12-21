import React from 'react';
import {GestureResponderEvent, Text, TouchableOpacity, View} from 'react-native';
import {useIntl} from 'react-intl';
import {CheckBox} from '../../../components';

import styles from '../WelcomeScreenStyles';

type CheckBoxProps = Parameters<typeof CheckBox>[0];

interface Props {
  isConsentChecked: boolean;
  onCheckPress: CheckBoxProps['clicked'];
  onTermsPress: (event: GestureResponderEvent) => void;
}

const WelcomeConsent: React.FC<Props> = ({isConsentChecked, onCheckPress, onTermsPress}) => {
  const intl = useIntl();

  return (
    <View style={styles.consentContainer}>
      <CheckBox isChecked={isConsentChecked} clicked={onCheckPress} style={styles.checkStyle} />
      <TouchableOpacity onPress={onTermsPress}>
        <View style={styles.consentTextContainer}>
          <Text style={styles.termsDescText}>
            {intl.formatMessage({id: 'welcome.terms_description'})}
            <Text style={styles.termsLinkText}>
              {' '}
              {intl.formatMessage({id: 'welcome.terms_text'})}
            </Text>
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default WelcomeConsent;
