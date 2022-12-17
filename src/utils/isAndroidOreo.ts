import {Platform} from 'react-native';

const isAndroidOreo = () =>
  Platform.OS === 'android' && (Platform.Version === 26 || Platform.Version === 27);

export default isAndroidOreo;
