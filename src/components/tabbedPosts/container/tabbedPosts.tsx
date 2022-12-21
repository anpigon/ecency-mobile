import React, {useState, useMemo} from 'react';
import ScrollableTabView, {TabBarProps} from 'react-native-scrollable-tab-view';
import {TabbedPostsProps} from '../services/tabbedPostsModels';
import {StackedTabBar, TabItem} from '../view/stackedTabBar';
import TabContent from '../view/tabContent';

export const TabbedPosts: React.FC<TabbedPostsProps> = ({
  filterOptions,
  filterOptionsValue,
  selectedOptionIndex,
  feedSubfilterOptions = [],
  feedSubfilterOptionsValue = [],
  isFeedScreen,
  feedUsername,
  pageType,
  tabContentOverrides,
  imagesToggleEnabled,
  stackedTabs,
  onTabChange,
  ...props
}) => {
  // initialize state
  const initialTabIndex = useMemo(
    () => (selectedOptionIndex === 0 && stackedTabs ? filterOptions.length : selectedOptionIndex),
    [selectedOptionIndex, stackedTabs, filterOptions.length],
  );

  const mainFilters = useMemo(
    () =>
      filterOptions.map<TabItem>((label, index) => ({
        filterKey: filterOptionsValue[index],
        label,
      })),
    [filterOptions, filterOptionsValue],
  );

  const subFilters = useMemo(
    () =>
      feedSubfilterOptions
        ? feedSubfilterOptions.map<TabItem>((label, index) => ({
            filterKey: feedSubfilterOptionsValue[index],
            label,
          }))
        : [],
    [feedSubfilterOptions, feedSubfilterOptionsValue],
  );

  const combinedFilters = useMemo(() => [...mainFilters, ...subFilters], [mainFilters, subFilters]);

  const [selectedFilter, setSelectedFilter] = useState(combinedFilters[initialTabIndex].filterKey);
  const [filterScrollRequest, createFilterScrollRequest] = useState<string | null>(null);

  // components actions
  const _onFilterSelect = (filter: string) => {
    if (filter === selectedFilter) {
      createFilterScrollRequest(selectedFilter);
    } else {
      setSelectedFilter(filter);
    }
  };

  const _onScrollRequestProcessed = () => {
    createFilterScrollRequest(null);
  };

  // initialize first set of pages
  const pages = combinedFilters.map((filter, index) => {
    if (tabContentOverrides && tabContentOverrides.has(index)) {
      return tabContentOverrides.get(index);
    }
    return (
      <TabContent
        tag={props.tag ?? ''}
        getFor={props.getFor}
        forceLoadPosts={props.forceLoadPosts ?? false}
        handleOnScroll={props.handleOnScroll ? props.handleOnScroll : () => {}}
        key={filter.filterKey}
        filterKey={filter.filterKey}
        isFeedScreen={isFeedScreen}
        isInitialTab={initialTabIndex === index}
        feedUsername={feedUsername}
        pageType={pageType}
        filterScrollRequest={filterScrollRequest}
        onScrollRequestProcessed={_onScrollRequestProcessed}
      />
    );
  });

  // render tab bar
  const _renderTabBar = (tabBarProps: TabBarProps) => (
    // @ts-expect-error
    <StackedTabBar
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...tabBarProps}
      firstStack={mainFilters}
      secondStack={subFilters}
      initialFirstStackIndex={selectedOptionIndex}
      onFilterSelect={_onFilterSelect}
      toggleHideImagesFlag={imagesToggleEnabled ?? false}
      pageType={pageType}
    />
  );

  return (
    <ScrollableTabView
      scrollWithoutAnimation={true}
      locked={true}
      initialPage={initialTabIndex}
      renderTabBar={_renderTabBar}
      // @ts-expect-error
      onTabChange={onTabChange}>
      {pages}
    </ScrollableTabView>
  );
};
