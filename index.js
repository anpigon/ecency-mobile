/**
 * @format
 */

import {AppRegistry, LogBox} from 'react-native';
import AppCenter from 'appcenter';
import {name as appName} from './app.json';
import 'core-js';
import 'intl';
import 'intl/locale-data/jsonp/en-US';

import App from './src/index';

// set check frequency options
AppCenter.setLogLevel(AppCenter.LogLevel.VERBOSE);

// TODO Remove ignoreLogs when referenced issue is fixed properly
// ref: https://github.com/ecency/ecency-mobile/issues/2466
// ignore warnings
LogBox.ignoreLogs(['Require cycle:', 'Remote debugger']);

AppRegistry.registerComponent(appName, () => App);
