/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/function-component-definition */
import React from 'react';
import {StyleSheet} from 'react-native';
import {Provider} from 'react-redux';
import {PersistGate} from 'redux-persist/integration/react';
import {IntlProvider} from 'react-intl';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {Host} from 'react-native-portalize';
import {PersistQueryClientProvider} from '@tanstack/react-query-persist-client';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {flattenMessages} from './utils/flattenMessages';
import messages from './config/locales';

import Application from './screens/application';
import {persistor, RootState, store} from './redux/store/store';
import {initQueryClient} from './providers/queries';
import {useAppSelector} from './hooks';

const queryClientProviderProps = initQueryClient();

const App: React.FC = () => {
  const locale: string = useAppSelector((state: RootState) => state.application.language);
  return (
    <PersistQueryClientProvider {...queryClientProviderProps}>
      <PersistGate loading={null} persistor={persistor}>
        {/* @ts-ignore */}
        <IntlProvider locale={locale} messages={flattenMessages((messages as any)[locale])}>
          <GestureHandlerRootView style={styles.container}>
            <SafeAreaProvider>
              <Host>
                <Application />
              </Host>
            </SafeAreaProvider>
          </GestureHandlerRootView>
        </IntlProvider>
      </PersistGate>
    </PersistQueryClientProvider>
  );
};

export default function Root() {
  return (
    <Provider store={store}>
      <App />
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
