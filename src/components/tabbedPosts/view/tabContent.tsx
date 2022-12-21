/* eslint-disable max-len */
import React, {useState, useEffect, useRef} from 'react';
import {
  AppState,
  NativeEventSubscription,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import {debounce} from 'lodash';
import {PostsList} from '../../postsList';
import {fetchPromotedEntries, loadPosts} from '../services/tabbedPostsFetch';
import {LoadPostsOptions, TabContentProps, TabMeta} from '../services/tabbedPostsModels';
import TabEmptyView from './listEmptyView';
import {setInitPosts} from '../../../redux/actions/postsAction';
import {showReplyModal} from '../../../redux/actions/uiAction';
import {calculateTimeLeftForPostCheck} from '../services/tabbedPostsHelpers';
import {PostsListRef} from '../../postsList/container/postsListContainer';
import ScrollTopPopup from './scrollTopPopup';
import {useAppDispatch, useAppSelector} from '../../../hooks';
import {RootState} from '../../../redux/store/store';

const DEFAULT_TAB_META = {
  startAuthor: '',
  startPermlink: '',
  isLoading: false,
  isRefreshing: false,
} as TabMeta;

let scrollOffset = 0;
let blockPopup = false;
const SCROLL_POPUP_THRESHOLD = 5000;

const TabContent: React.FC<TabContentProps> = props => {
  const {
    filterKey,
    isFeedScreen,
    isInitialTab,
    pageType,
    forceLoadPosts,
    filterScrollRequest,
    feedUsername,
    tag,
    pinnedPermlink,
    onScrollRequestProcessed,
    handleOnScroll,
    getFor,
  } = props;
  let _isMounted = true;

  // redux properties
  const dispatch = useAppDispatch();
  const isLoggedIn = useAppSelector(state => state.application.isLoggedIn);
  const nsfw = useAppSelector(state => state.application.nsfw);
  const isConnected = useAppSelector(state => state.application.isConnected);
  const currentAccount = useAppSelector(state => state.account.currentAccount);
  const initPosts = useAppSelector(state => state.posts.initPosts);

  const {username} = currentAccount;
  const userPinned = currentAccount.about?.profile?.pinned;

  // state
  const [posts, setPosts] = useState<any[]>([]);
  const [promotedPosts, setPromotedPosts] = useState<any[]>([]);
  const [sessionUser, setSessionUser] = useState(username);
  const [tabMeta, setTabMeta] = useState(DEFAULT_TAB_META);
  const [latestPosts, setLatestPosts] = useState<any[]>([]);
  const [postFetchTimer, setPostFetchTimer] = useState(0);
  const [enableScrollTop, setEnableScrollTop] = useState(false);
  const [curPinned, setCurPinned] = useState(pinnedPermlink);

  // refs
  const postsListRef = useRef<PostsListRef>();
  const appState = useRef(AppState.currentState);
  const appStateSubRef = useRef<NativeEventSubscription | null>();
  const postsRef = useRef(posts);
  const sessionUserRef = useRef(sessionUser);

  // init state refs;
  postsRef.current = posts;
  sessionUserRef.current = sessionUser;

  // side effects
  useEffect(() => {
    if (isFeedScreen) {
      appStateSubRef.current = AppState.addEventListener('change', _handleAppStateChange);
    }

    _initContent(true, feedUsername);

    return _cleanup;
  }, [tag]);

  useEffect(() => {
    if (isConnected && (username !== sessionUser || forceLoadPosts)) {
      _initContent(false, username);
    }
  }, [username, forceLoadPosts]);

  useEffect(() => {
    if (filterScrollRequest && filterScrollRequest === filterKey) {
      _scrollToTop();
      if (onScrollRequestProcessed) {
        onScrollRequestProcessed();
      }
    }
  }, [filterScrollRequest]);

  useEffect(() => {
    if (pageType === 'ownProfile' && userPinned !== curPinned) {
      _scrollToTop();
      _loadPosts({shouldReset: true, _pinnedPermlink: userPinned});
      setCurPinned(userPinned);
    }
  }, [userPinned]);

  const _cleanup = () => {
    _isMounted = false;
    if (postFetchTimer) {
      clearTimeout(postFetchTimer);
    }
    if (isFeedScreen && appStateSubRef.current) {
      appStateSubRef.current.remove();
    }
  };

  // actions
  const _handleAppStateChange = (nextAppState: RootState) => {
    if (
      appState.current.match(/inactive|background/) &&
      nextAppState === 'active' &&
      posts.length > 0
    ) {
      const isLatestPostsCheck = true;
      _loadPosts({
        shouldReset: false,
        isLatestPostsCheck,
      });
    }

    appState.current = nextAppState;
  };

  const _initContent = (isFirstCall = false, _feedUsername: string = '') => {
    _scrollToTop();

    const initialPosts = isFirstCall && isFeedScreen && isInitialTab ? initPosts : [];

    setPosts(initialPosts);
    setTabMeta(DEFAULT_TAB_META);
    setSessionUser(_feedUsername);
    setLatestPosts([]);

    if (postFetchTimer) {
      clearTimeout(postFetchTimer);
    }

    if (username || (filterKey !== 'friends' && filterKey !== 'communities')) {
      _loadPosts({
        shouldReset: !isFirstCall,
        isFirstCall,
        isLatestPostsCheck: false,
        _feedUsername,
        _posts: initialPosts,
        _tabMeta: DEFAULT_TAB_META,
      });
      _getPromotedPosts();
    }
  };

  // fetch posts from server
  const _loadPosts = async ({
    shouldReset = false,
    isLatestPostsCheck = false,
    isFirstCall = false,
    _feedUsername = isFeedScreen ? sessionUserRef.current : feedUsername,
    _posts = postsRef.current,
    _tabMeta = tabMeta,
    _pinnedPermlink = curPinned,
  }: {
    shouldReset?: boolean;
    isLatestPostsCheck?: boolean;
    isFirstCall?: boolean;
    _feedUsername?: string;
    _posts?: any[];
    _tabMeta?: TabMeta;
    _pinnedPermlink?: string;
  }) => {
    const options = {
      setTabMeta: (meta: TabMeta) => {
        if (_isMounted) {
          setTabMeta(meta);
        }
      },
      filterKey,
      prevPosts: _posts,
      tabMeta: _tabMeta,
      isLoggedIn,
      nsfw,
      isConnected,
      isFeedScreen,
      refreshing: shouldReset,
      pageType,
      isLatestPostsCheck,
      feedUsername: _feedUsername,
      pinnedPermlink: _pinnedPermlink,
      tag,
      getFor,
    } as LoadPostsOptions;

    const result = await loadPosts(options);
    console.log(result)
    if (_isMounted && result) {
      if (shouldReset || isFirstCall) {
        setPosts([]);
      }
      _postProcessLoadResult(result);
    }
  };

  const _getPromotedPosts = async () => {
    if (pageType === 'profile' || pageType === 'ownProfile' || pageType === 'community') {
      return;
    }
    const pPosts = await fetchPromotedEntries(username);
    if (pPosts) {
      setPromotedPosts(pPosts);
    }
  };

  // schedules post fetch
  const _scheduleLatestPostsCheck = (firstPost: any) => {
    if (firstPost) {
      if (postFetchTimer) {
        clearTimeout(postFetchTimer);
      }

      const timeLeft = calculateTimeLeftForPostCheck(firstPost);
      const _postFetchTimer = window.setTimeout(() => {
        const isLatestPostsCheck = true;
        _loadPosts({
          shouldReset: false,
          isLatestPostsCheck,
        });
      }, timeLeft);
      setPostFetchTimer(_postFetchTimer);
    }
  };

  // processes response from loadPost
  const _postProcessLoadResult = ({updatedPosts, latestPosts: _latestPosts}: any) => {
    // process new posts avatart
    if (_latestPosts && Array.isArray(_latestPosts)) {
      if (_latestPosts.length > 0) {
        setLatestPosts(_latestPosts);
      } else {
        _scheduleLatestPostsCheck(posts[0]);
      }
    }

    // process returned data
    if (Array.isArray(updatedPosts)) {
      if (updatedPosts.length) {
        // match new and old first post
        const firstPostChanged =
          posts.length === 0 || posts[0].permlink !== updatedPosts[0].permlink;
        if (isFeedScreen && firstPostChanged) {
          // schedule refetch of new posts by checking time of current post
          _scheduleLatestPostsCheck(updatedPosts[0]);

          if (isInitialTab) {
            dispatch(setInitPosts(updatedPosts));
          }
        }
      } else if (isFeedScreen && isInitialTab) {
        // clear posts cache if no first tab posts available, precautionary measure for accoutn change
        dispatch(setInitPosts([]));
      }
      setPosts(updatedPosts);
    }
  };

  // view related routines
  const _onPostsPopupPress = () => {
    _scrollToTop();
    _getPromotedPosts();
    setPosts([...latestPosts, ...posts]);
    _scheduleLatestPostsCheck(latestPosts[0]);
    setLatestPosts([]);
  };

  const _scrollToTop = () => {
    postsListRef.current?.scrollToTop();
    setEnableScrollTop(false);
    scrollPopupDebouce.cancel();
    blockPopup = true;
    setTimeout(() => {
      blockPopup = false;
    }, 1000);
  };

  const _handleOnScroll = () => {
    if (handleOnScroll) {
      handleOnScroll();
    }
  };

  // view rendereres
  const _renderEmptyContent = () => {
    return <TabEmptyView filterKey={filterKey} isNoPost={tabMeta.isNoPost} />;
  };

  const scrollPopupDebouce = debounce(
    value => {
      setEnableScrollTop(value);
    },
    500,
    {leading: true},
  );

  const _onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentOffset = event.nativeEvent.contentOffset.y;
    const scrollUp = currentOffset < scrollOffset;
    scrollOffset = currentOffset;

    if (scrollUp && !blockPopup && currentOffset > SCROLL_POPUP_THRESHOLD) {
      scrollPopupDebouce(true);
    }
  };

  // show quick reply modal
  const _showQuickReplyModal = (post: any) => {
    if (isLoggedIn) {
      dispatch(showReplyModal(post));
    } else {
      // TODO: show proper alert message
      console.log('Not LoggedIn');
    }
  };

  const handleLoadPosts = (shouldReset: boolean) => {
    _loadPosts({shouldReset});
    if (shouldReset) {
      _getPromotedPosts();
    }
  };

  return (
    <>
      <PostsList
        ref={postsListRef}
        data={posts}
        isFeedScreen={isFeedScreen}
        promotedPosts={promotedPosts}
        onLoadPosts={handleLoadPosts}
        onScroll={_onScroll}
        onScrollEndDrag={_handleOnScroll}
        isRefreshing={tabMeta.isRefreshing}
        isLoading={tabMeta.isLoading}
        ListEmptyComponent={_renderEmptyContent}
        pageType={pageType}
        showQuickReplyModal={_showQuickReplyModal}
      />
      <ScrollTopPopup
        popupAvatars={latestPosts.map(post => post.avatar || '')}
        enableScrollTop={enableScrollTop}
        onPress={_onPostsPopupPress}
        onClose={() => {
          setLatestPosts([]);
          setEnableScrollTop(false);
        }}
      />
    </>
  );
};

export default TabContent;
/* eslint-enable max-len */
