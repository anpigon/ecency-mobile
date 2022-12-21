import React from 'react';
import {Text, View} from 'react-native';
import {useIntl} from 'react-intl';
import EStyleSheet from 'react-native-extended-stylesheet';

import {Icon} from '../../../components';

import styles from '../WelcomeScreenStyles';

interface Props {
  iconName: string;
  headingIntlId: string;
  bodyIntlId: string;
}

const WelcomeInfo: React.FC<Props> = ({iconName, headingIntlId, bodyIntlId}) => {
  const intl = useIntl();

  return (
    <View style={styles.sectionRow}>
      <Icon
        iconType="SimpleLineIcons"
        name={iconName}
        color={EStyleSheet.value('$primaryBlue')}
        size={30}
      />
      <View>
        <Text style={styles.sectionTitle}>{intl.formatMessage({id: headingIntlId})}</Text>
        <Text style={styles.sectionText}>{intl.formatMessage({id: bodyIntlId})}</Text>
      </View>
    </View>
  );
};

export default WelcomeInfo;
