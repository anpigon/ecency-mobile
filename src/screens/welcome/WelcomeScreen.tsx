import {useNavigation} from '@react-navigation/native';
import React, {useState, useEffect} from 'react';
import {useIntl} from 'react-intl';
import {Text, Image, View, SafeAreaView, TouchableOpacity} from 'react-native';

import {gestureHandlerRootHOC, ScrollView} from 'react-native-gesture-handler';
import VersionNumber from 'react-native-version-number';

import {MainButton} from '../../components';
import {ECENCY_TERMS_URL} from '../../config/ecencyApi';
import ROUTES from '../../constants/routeNames';
import {useAppDispatch, useAppSelector} from '../../hooks';
import {setLastAppVersion, setIsTermsAccepted} from '../../redux/actions/applicationActions';
import LaunchScreen from '../launch';
import WelcomeConsent from './components/WelcomeConsent';
import WelcomeInfo from './components/WelcomeInfo';

import styles from './WelcomeScreenStyles';

function WelcomeScreen() {
  const intl = useIntl();
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();

  const isTermsAccepted = useAppSelector(state => state.application.isTermsAccepted);
  const [showAnimation, setShowAnimation] = useState(true);
  const [isConsentChecked, setIsConsentChecked] = useState(isTermsAccepted);
  const [appVersion] = useState(VersionNumber.appVersion);

  useEffect(() => {
    const _showWelcomeModal = () => {
      setShowAnimation(true);
      setTimeout(() => {
        setShowAnimation(false);
      }, 3550);
    };
    _showWelcomeModal();
  }, []);

  const _handleButtonPress = () => {
    dispatch(setLastAppVersion(appVersion));
    dispatch(setIsTermsAccepted(isConsentChecked));
    navigation.navigate(ROUTES.STACK.MAIN);
  };

  const _onCheckPress = (_value: any, isCheck: boolean) => {
    setIsConsentChecked(isCheck);
  };

  const _onTermsPress = () => {
    const url = ECENCY_TERMS_URL;
    navigation.navigate({
      name: ROUTES.SCREENS.WEB_BROWSER,
      params: {url},
      key: url,
    });
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.container}>
        <Image
          style={styles.mascot}
          resizeMode="contain"
          source={require('../../assets/love_mascot.png')}
        />

        <View style={styles.topText}>
          <Text style={styles.welcomeText}>{intl.formatMessage({id: 'welcome.label'})}</Text>
          <Text style={styles.ecencyText}>{intl.formatMessage({id: 'welcome.title'})}</Text>
        </View>

        <ScrollView contentContainerStyle={styles.contentContainer}>
          <TouchableOpacity disabled={!isConsentChecked} onPress={_handleButtonPress}>
            <WelcomeInfo
              iconName="question"
              headingIntlId="welcome.line1_heading"
              bodyIntlId="welcome.line1_body"
            />
            <WelcomeInfo
              iconName="emotsmile"
              headingIntlId="welcome.line2_heading"
              bodyIntlId="welcome.line2_body"
            />
            <WelcomeInfo
              iconName="people"
              headingIntlId="welcome.line3_heading"
              bodyIntlId="welcome.line3_body"
            />
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.bottomContainer}>
          <WelcomeConsent
            isConsentChecked={isConsentChecked}
            onCheckPress={_onCheckPress}
            onTermsPress={_onTermsPress}
          />
          <MainButton
            onPress={_handleButtonPress}
            isDisable={!isConsentChecked}
            isLoading={false}
            style={styles.mainButton}
            text={intl.formatMessage({id: 'welcome.get_started'})}
          />
        </View>
      </View>

      {showAnimation && <LaunchScreen />}
    </SafeAreaView>
  );
}

export default gestureHandlerRootHOC(WelcomeScreen);
