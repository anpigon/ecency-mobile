import React, {forwardRef, useRef, useImperativeHandle, useState, useEffect} from 'react';
import {get} from 'lodash';
import {
  FlatListProps,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  View,
  ListRenderItem,
} from 'react-native';
import {PostCard} from '../../postCard';
import styles from '../view/postsListStyles';
import {useAppSelector} from '../../../hooks';

export interface PostsListRef {
  scrollToTop: () => void;
}

interface PostsListContainerProps extends Partial<FlatListProps<any>> {
  promotedPosts: Array<any>;
  isFeedScreen: boolean;
  onLoadPosts?: (shouldReset: boolean) => void;
  isLoading: boolean;
  isRefreshing: boolean;
  pageType: 'main' | 'profile' | 'ownProfile' | 'community';
  showQuickReplyModal: (post: any) => void;
}

let _onEndReachedCalledDuringMomentum = true;

const PostsListContainer = forwardRef<any, PostsListContainerProps>(
  (
    {
      promotedPosts,
      isFeedScreen,
      onLoadPosts,
      isRefreshing,
      isLoading,
      pageType,
      showQuickReplyModal,
      ListEmptyComponent,
      onScroll,
      onScrollEndDrag,
      data,
    },
    ref,
  ) => {
    const flatListRef = useRef<any>(null);

    const [imageHeights, setImageHeights] = useState(new Map<string, number>());

    const isHideImages = useAppSelector(state => state.application.hidePostsThumbnails);
    const isDarkTheme = useAppSelector(state => state.application.isDarkThem);
    const posts: any[] = useAppSelector(state => {
      return isFeedScreen ? state.posts.feedPosts : state.posts.otherPosts;
    });
    const mutes = useAppSelector(state => state.account.currentAccount.mutes);

    const scrollPosition = useAppSelector(state => {
      return isFeedScreen ? state.posts.feedScrollPosition : state.posts.otherScrollPosition;
    });

    useImperativeHandle(ref, () => ({
      scrollToTop() {
        flatListRef.current?.scrollToOffset({x: 0, y: 0, animated: true});
      },
    }));

    useEffect(() => {
      if (posts && posts.length === 0) {
        flatListRef.current?.scrollToOffset({
          offset: 0,
          animated: false,
        });
      }
    }, [posts]);

    useEffect(() => {
      flatListRef.current?.scrollToOffset({
        offset: posts && posts.length === 0 ? 0 : scrollPosition,
        animated: false,
      });
    }, [scrollPosition]);

    const _setImageHeightInMap = (mapKey: string, height: number) => {
      if (mapKey && height) {
        setImageHeights(imageHeights.set(mapKey, height));
      }
    };

    const _renderFooter = () => {
      if (isLoading && !isRefreshing) {
        return (
          <View style={styles.flatlistFooter}>
            <ActivityIndicator animating size="large" color="#2e3d51" />
          </View>
        );
      }
      return null;
    };

    const _onEndReached = () => {
      if (onLoadPosts && !_onEndReachedCalledDuringMomentum) {
        onLoadPosts(false);
        _onEndReachedCalledDuringMomentum = true;
      }
    };

    const _renderItem: ListRenderItem<any> = ({item, index}) => {
      const e: JSX.Element[] = [];

      if (index % 3 === 0) {
        const ix = index / 3 - 1;
        if (promotedPosts[ix] !== undefined) {
          const promotedPost = promotedPosts[ix];
          const isMuted = mutes && mutes.indexOf(promotedPost.author) > -1;

          if (
            !isMuted &&
            promotedPost?.author &&
            posts &&
            posts.filter(x => x.permlink === promotedPost.permlink).length <= 0
          ) {
            // get image height from cache if available
            const localId = promotedPost.author + promotedPost.permlink;
            const imgHeight = imageHeights.get(localId);

            e.push(
              <PostCard
                key={`${promotedPost.author}-${promotedPost.permlink}-prom`}
                content={promotedPost}
                isHideImage={isHideImages}
                imageHeight={imgHeight}
                pageType={pageType}
                setImageHeight={_setImageHeightInMap}
                showQuickReplyModal={showQuickReplyModal}
                mutes={mutes}
              />,
            );
          }
        }
      }

      const isMuted = mutes && mutes.indexOf(item.author) > -1;
      if (!isMuted && get(item, 'author', null)) {
        // get image height from cache if available
        const localId = item.author + item.permlink;
        const imgHeight = imageHeights.get(localId);

        e.push(
          <PostCard
            key={`${item.author}-${item.permlink}`}
            content={item}
            isHideImage={isHideImages}
            imageHeight={imgHeight}
            setImageHeight={_setImageHeightInMap}
            pageType={pageType}
            showQuickReplyModal={showQuickReplyModal}
            mutes={mutes}
          />,
        );
      }

      return <>{e.map(a => a)}</>;
    };

    return (
      <FlatList
        ListEmptyComponent={ListEmptyComponent}
        onScroll={onScroll}
        onScrollEndDrag={onScrollEndDrag}
        ref={flatListRef}
        data={data}
        showsVerticalScrollIndicator={false}
        renderItem={_renderItem}
        keyExtractor={(content, index) => `${content.author}/${content.permlink}-${index}`}
        removeClippedSubviews
        onEndReachedThreshold={1}
        maxToRenderPerBatch={3}
        initialNumToRender={3}
        windowSize={5}
        extraData={imageHeights}
        onEndReached={_onEndReached}
        onMomentumScrollBegin={() => {
          _onEndReachedCalledDuringMomentum = false;
        }}
        ListFooterComponent={_renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              if (onLoadPosts) {
                onLoadPosts(true);
              }
            }}
            progressBackgroundColor="#357CE6"
            tintColor={!isDarkTheme ? '#357ce6' : '#96c0ff'}
            titleColor="#fff"
            colors={['#fff']}
          />
        }
      />
    );
  },
);

export default PostsListContainer;
