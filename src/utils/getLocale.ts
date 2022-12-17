import {NativeModules, Platform} from 'react-native';

const getLocale = () => {
  let locale = '';

  if (Platform.OS === 'ios') {
    locale =
      NativeModules.SettingsManager.settings.AppleLocale ||
      NativeModules.SettingsManager.settings.AppleLanguages[0];
  } else {
    locale = NativeModules.I18nManager.localeIdentifier;
  }

  return locale;
};

export default getLocale;
