import { BackHandler } from 'react-native';
import { NavigationActions } from '@react-navigation/compat';

let _navigator;

let navigationStack = [];

const setTopLevelNavigator = (navigatorRef) => {
  _navigator = navigatorRef;
  if (navigationStack.length > 0) {
    navigationStack.forEach((item) => navigate(item));
    navigationStack = [];
  }
};

const navigate = (navigationProps) => {
  if (!_navigator) {
    navigationStack.push(navigationProps);
  } else {
    _navigator.dispatch(
      NavigationActions.navigate({
        ...navigationProps,
      }),
    );
  }
};

const navigateBack = () => {
  if (_navigator) {
    const { index } = _navigator.state.nav.routes[0];
    if (index) {
      _navigator.dispatch(NavigationActions.back());
    } else {
      BackHandler.exitApp();
    }
  }
};

// add other navigation functions that you need and export them

export { navigate, setTopLevelNavigator, navigateBack };
