import React, { Fragment } from 'react';
import { View, SafeAreaView } from 'react-native';
import ScrollableTabView from 'react-native-scrollable-tab-view';
import { injectIntl } from 'react-intl';

// Components
import { TabBar, LeaderBoard, Notification, Header } from '../../../components';
import { LoggedInContainer } from '../../../containers';

// Styles
import styles from './notificationStyles';
import globalStyles from '../../../globalStyles';

function NotificationScreen({
  notifications,
  getActivities,
  intl,
  navigateToNotificationRoute,
  handleOnUserPress,
  readAllNotification,
  isNotificationRefreshing,
  isLoading,
  changeSelectedFilter,
  globalProps,
}) {
  return (
    <>
      <Header />
      <SafeAreaView style={styles.container}>
        <ScrollableTabView
          style={globalStyles.tabView}
          renderTabBar={() => (
            <TabBar style={styles.tabbar} tabUnderlineDefaultWidth={100} tabUnderlineScaleX={2} />
          )}
        >
          <View
            tabLabel={intl.formatMessage({
              id: 'notification.notification',
            })}
            style={styles.tabbarItem}
          >
            <LoggedInContainer>
              {() => (
                <Notification
                  getActivities={getActivities}
                  notifications={notifications}
                  navigateToNotificationRoute={navigateToNotificationRoute}
                  handleOnUserPress={handleOnUserPress}
                  readAllNotification={readAllNotification}
                  isNotificationRefreshing={isNotificationRefreshing}
                  isLoading={isLoading}
                  changeSelectedFilter={changeSelectedFilter}
                  globalProps={globalProps}
                />
              )}
            </LoggedInContainer>
          </View>
          <View
            tabLabel={intl.formatMessage({
              id: 'notification.leaderboard',
            })}
            style={styles.tabbarItem}
          >
            <LeaderBoard />
          </View>
        </ScrollableTabView>
      </SafeAreaView>
    </>
  );
}

export default injectIntl(NotificationScreen);
