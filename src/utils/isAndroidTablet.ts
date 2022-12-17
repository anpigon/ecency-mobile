import {Platform} from 'react-native';
import DeviceInfo from 'react-native-device-info';

const isAndroidTablet = () => Platform.OS === 'android' && DeviceInfo.isTablet();

export default isAndroidTablet;
