/* eslint-disable max-len */
import React, {useState, useMemo} from 'react';
import {View} from 'react-native';

// Components
import {gestureHandlerRootHOC} from 'react-native-gesture-handler';
import {Header, TabbedPosts} from '../../../components';

// Styles
import styles from './feedStyles';

import {getDefaultFilters, getFilterMap} from '../../../constants/options/filters';

import {useAppSelector} from '../../../hooks';

const FeedScreen: React.FC = () => {
  const mainTabs: string[] = useAppSelector(
    state => state.customTabs.mainTabs || getDefaultFilters('main'),
  );
  const currentAccount = useAppSelector(state => state.account.currentAccount);

  const filterOptions = useMemo(
    () =>
      mainTabs
        .map(key => {
          const item = getFilterMap('main');
          if (key in item) {
            return (item as any)[key];
          }
          return null;
        })
        .filter(e => e),
    [mainTabs],
  );

  const [lazyLoad, setLazyLoad] = useState(false);

  const _lazyLoadContent = () => {
    if (!lazyLoad) {
      setTimeout(() => {
        setLazyLoad(true);
      }, 100);
    }
  };

  return (
    <>
      <Header showQR={true} />
      <View style={styles.container} onLayout={_lazyLoadContent}>
        {lazyLoad && (
          <TabbedPosts
            key={JSON.stringify(filterOptions)} // this hack of key change resets tabbedposts whenever filters chanage, effective to remove filter change android bug
            filterOptions={filterOptions}
            filterOptionsValue={mainTabs}
            getFor={currentAccount?.name ? 'feed' : 'hot'}
            selectedOptionIndex={currentAccount?.name ? 0 : 2}
            feedUsername={currentAccount?.name}
            isFeedScreen={true}
            pageType="main"
          />
        )}
      </View>
    </>
  );
};

export default gestureHandlerRootHOC(FeedScreen);
/* eslint-enable max-len */
