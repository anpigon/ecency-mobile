import React from 'react';
import {FlatList, SafeAreaView} from 'react-native';
import {useIntl} from 'react-intl';

// Components
import {gestureHandlerRootHOC} from 'react-native-gesture-handler';
import {BasicHeader, UserListItem} from '../../../components';

// Container
import AccountListContainer from '../../../containers/accountListContainer';

// Utils
import globalStyles from '../../../globalStyles';
import {getTimeFromNow} from '../../../utils/time';

const renderUserListItem = (item, index, handleOnUserPress) => {
  return (
    <UserListItem
      index={index}
      username={item.account}
      description={getTimeFromNow(item.timestamp)}
      handleOnPress={() => handleOnUserPress(item.account)}
      isClickable
    />
  );
};

function ReblogScreen({navigation, route}) {
  const intl = useIntl();
  const headerTitle = intl.formatMessage({
    id: 'reblog.title',
  });

  const reblogs = route.params?.reblogs;

  return (
    <AccountListContainer data={reblogs}>
      {({data, filterResult, handleSearch, handleOnUserPress}) => (
        <SafeAreaView style={[globalStyles.container, {paddingBottom: 40}]}>
          <BasicHeader
            title={`${headerTitle} (${data && data.length})`}
            backIconName="close"
            isHasSearch
            handleOnSearch={text => handleSearch(text, 'account')}
          />
          <FlatList
            data={filterResult || data}
            keyExtractor={item => item.account}
            removeClippedSubviews={false}
            renderItem={({item, index}) => renderUserListItem(item, index, handleOnUserPress)}
          />
        </SafeAreaView>
      )}
    </AccountListContainer>
  );
}

export default gestureHandlerRootHOC(ReblogScreen);
