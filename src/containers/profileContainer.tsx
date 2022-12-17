import React, {Component} from 'react';
import {connect} from 'react-redux';
import {unionBy} from 'lodash';
import {Alert} from 'react-native';
import {injectIntl, IntlShape} from 'react-intl';
import {Dispatch, AnyAction} from '@reduxjs/toolkit';

// Providers
import {NavigationProp, useNavigation} from '@react-navigation/native';
import {
  followUser,
  unfollowUser,
  ignoreUser,
  getFollows,
  getUser,
  getRelationship,
  getAccountPosts,
} from '../providers/hive/dhive';

// Ecency providers
import {checkFavorite, addFavorite, deleteFavorite, addReport} from '../providers/ecency/ecency';

// Utilitites
import {getRcPower, getVotingPower} from '../utils/manaBar';
import {toastNotification, setRcOffer, showActionModal} from '../redux/actions/uiAction';

// Constants
import {default as ROUTES} from '../constants/routeNames';
import {updateCurrentAccount} from '../redux/actions/accountAction';
import {RootState} from '../redux/store/store';

interface Props {
  route: any;
  currentAccount: {name: string; mutes: any[]};
  navigation: NavigationProp<any>;
  isConnected: boolean;
  isLoggedIn: boolean;
  isHideImage: boolean;
  isDarkTheme: boolean;
  activeBottomTab: any;
  pinCode: string;
  dispatch: Dispatch<AnyAction>;
  intl: IntlShape;
  currency: any;
  children: any;
}

interface State {
  comments: any[];
  follows: any;
  forceLoadPost: boolean;
  isFavorite: boolean;
  isFollowing: boolean;
  isMuted: boolean;
  isProfileLoading: boolean;
  isReady: boolean;
  isOwnProfile: boolean;
  user: any | null;
  quickProfile: {
    reputation?: string;
    name?: string;
    display_name?: string;
  };
  reverseHeader: boolean;
  deepLinkFilter: any;
  username?: string;
  avatar?: any;
  error?: any;
}

// FIXME: functional components로 변환할 것
class ProfileContainer extends Component<Props, State> {
  constructor(props: Props) {
    super(props);

    // check if is signed in user profile
    const username = props.route.params?.username ?? '';
    const isOwnProfile = !username || props.currentAccount.name === username;

    this.state = {
      comments: [],
      follows: {},
      forceLoadPost: false,
      isFavorite: false,
      isFollowing: false,
      isMuted: false,
      isProfileLoading: false,
      isReady: false,
      isOwnProfile,
      user: null,
      quickProfile: {
        reputation: props.route.params.reputation || '',
        name: props.route.params.username || '',
      },
      reverseHeader: Boolean(username),
      deepLinkFilter: props.route.params.deepLinkFilter,
    };
  }

  componentDidMount() {
    const {route, navigation, isConnected, isLoggedIn, currentAccount} = this.props;
    const username = route.params?.username || '';
    const {isOwnProfile} = this.state;

    if (!isConnected) {
      return;
    }

    // FIXME: 로그인 체크를 전역에서 처리하도록 변경
    if (!isLoggedIn && !username) {
      navigation.navigate(ROUTES.SCREENS.LOGIN);
      return;
    }

    const targetUsername = isOwnProfile ? currentAccount.name : username;
    this._loadProfile(targetUsername);
  }

  UNSAFE_componentWillReceiveProps(nextProps: Props) {
    if (!nextProps.isConnected) {
      return;
    }

    const {isLoggedIn, navigation} = this.props;
    const {isOwnProfile} = this.state;

    if (isLoggedIn && !nextProps.isLoggedIn) {
      navigation.navigate(ROUTES.SCREENS.LOGIN);
      return;
    }

    if (isOwnProfile) {
      const {user} = this.state;
      const {activeBottomTab, currentAccount} = this.props;

      const currentUsername =
        currentAccount.name !== nextProps.currentAccount.name && nextProps.currentAccount.name;
      const isActiveTabChanged =
        activeBottomTab !== nextProps.activeBottomTab &&
        nextProps.activeBottomTab === ROUTES.TABBAR.PROFILE;

      if ((isActiveTabChanged && user) || currentUsername) {
        this._loadProfile(nextProps.currentAccount.name);
      }
    }
  }

  _getReplies = async (query?: {author: string | null; permlink?: string}) => {
    if (!query) {
      return;
    }
    const {isOwnProfile, comments} = this.state;
    this.setState({isProfileLoading: true});
    const params = {
      account: query.author,
      limit: 5,
      observer: '',
      sort: isOwnProfile ? 'replies' : 'comments',
      ...(comments.length > 0 && {
        start_author: query.author,
        start_permlink: query.permlink,
      }),
    };
    const result = await getAccountPosts(params);
    this.setState({
      comments: unionBy(comments, result, 'permlink'),
      isProfileLoading: false,
    });
  };

  handleFollowUnfollowUser = async (isFollowAction = false) => {
    const {isFollowing, username} = this.state;
    const {currentAccount, pinCode, dispatch, intl} = this.props;
    const follower = currentAccount.name || '';
    const following = username;

    this.setState({isProfileLoading: true});

    try {
      const followAction = isFollowAction && !isFollowing ? followUser : unfollowUser;
      await followAction(currentAccount, pinCode, {follower, following});

      // means user is now being followed
      if (!isFollowing) {
        const mutes = currentAccount.mutes || [];
        const mutedIndex = mutes.indexOf(username);
        if (mutedIndex >= 0) {
          mutes.splice(mutedIndex, 1);
          currentAccount.mutes = mutes;
          dispatch(updateCurrentAccount(currentAccount));
        }
      }

      dispatch(
        toastNotification(
          intl.formatMessage({
            id: isFollowAction ? 'alert.success_follow' : 'alert.success_unfollow',
          }),
        ),
      );

      this.setState({isFollowing: isFollowAction});

      this._profileActionDone(null, false);
    } catch (err: any) {
      this._profileActionDone(err);
    }
  };

  handleMuteUnmuteUser = async (isMuteAction = false) => {
    if (isMuteAction) {
      this.handleMuteUser();
    } else {
      this.handleFollowUnfollowUser();
    }
  };

  handleMuteUser = async () => {
    const {username} = this.state;
    const {currentAccount, pinCode, dispatch, intl} = this.props;
    const follower = currentAccount.name;
    const following = username;

    this.setState({isProfileLoading: true});

    try {
      await ignoreUser(currentAccount, pinCode, {
        follower,
        following,
      });

      this.setState({
        isMuted: true,
        isProfileLoading: false,
      });

      const curMutes = currentAccount.mutes || [];
      if (curMutes.indexOf(username) < 0) {
        // check to avoid double entry corner case
        currentAccount.mutes = [username, ...curMutes];
      }
      dispatch(updateCurrentAccount(currentAccount));

      dispatch(
        toastNotification(
          intl.formatMessage({
            id: 'alert.success_mute',
          }),
        ),
      );
    } catch (err: any) {
      this._profileActionDone(err);
    }
  };

  _profileActionDone = (error: any = null, shouldFetchProfile = true) => {
    const {username} = this.state;
    const {intl, dispatch} = this.props;

    this.setState({isProfileLoading: false});

    if (error) {
      if (error.jse_shortmsg && error.jse_shortmsg.includes('wait to transact')) {
        // when RC is not enough, offer boosting account
        dispatch(setRcOffer(true));
      } else {
        // when other errors
        this.setState({error}, () =>
          Alert.alert(
            intl.formatMessage({
              id: 'alert.fail',
            }),
            error.message || error.toString(),
          ),
        );
      }
    } else if (shouldFetchProfile) {
      this._fetchProfile(username, true);
    }
  };

  _fetchProfile = async (username: string | null = null, isProfileAction = false) => {
    const {intl} = this.props;
    try {
      const {username: _username, isFollowing, isMuted, isOwnProfile} = this.state;

      if (username) {
        const {currentAccount} = this.props;
        let _isFollowing;
        let _isMuted;
        let isFavorite;
        let follows;

        if (!isOwnProfile) {
          const res = await getRelationship(currentAccount.name, username);
          _isFollowing = res && res.follows;
          _isMuted = res && res.ignores;
          isFavorite = await checkFavorite(username);
        }

        try {
          follows = await getFollows(username);
        } catch (err) {
          follows = null;
        }

        if (isProfileAction && isFollowing === _isFollowing && isMuted === _isMuted) {
          this._fetchProfile(_username, true);
        } else {
          this.setState({
            follows,
            isFollowing: _isFollowing,
            isMuted: _isMuted,
            isFavorite,
            isReady: true,
            isProfileLoading: false,
          });
        }
      }
    } catch (error: any) {
      console.warn('Failed to fetch complete profile data', error);
      Alert.alert(
        intl.formatMessage({
          id: 'alert.fail',
        }),
        error.message || error.toString(),
      );
    }
  };

  _loadProfile = async (username: string | null = null) => {
    let user: any;
    try {
      user = await getUser(username);
      this._fetchProfile(username);
    } catch (error) {
      this._profileActionDone(error);
    }

    console.log('_loadProfile', user);
    this.setState(
      prevState =>
        ({
          ...prevState,
          quickProfile: {
            ...prevState.quickProfile,
            display_name: user?.display_name,
            reputation: user?.reputation,
          },
          user,
          username,
        } as State),
    );

    this._getReplies({author: username, permlink: undefined});
  };

  handleFollowsPress = async (isFollowingPress: boolean) => {
    const {navigation} = this.props;
    const {username, follows} = this.state;
    const count = isFollowingPress ? follows.following_count : follows.follower_count;

    navigation.navigate({
      name: ROUTES.SCREENS.FOLLOWS,
      params: {
        isFollowingPress,
        count,
        username,
      },
      key: `${username}${count}`,
    });
  };

  handleOnFavoritePress = async (isFavorite = false) => {
    const {dispatch, intl} = this.props;
    const {username = ''} = this.state;

    this.setState({isProfileLoading: true});

    try {
      const favoriteAction = isFavorite ? deleteFavorite : addFavorite;
      await favoriteAction(username);
      dispatch(
        toastNotification(
          intl.formatMessage({
            id: isFavorite ? 'alert.success_unfavorite' : 'alert.success_favorite',
          }),
        ),
      );
      this.setState({isFavorite: !isFavorite, isProfileLoading: false});
    } catch (error: any) {
      console.warn('Failed to perform favorite action');
      Alert.alert(intl.formatMessage({id: 'alert.fail'}), error.message || error.toString());
      this.setState({isProfileLoading: false});
    }
  };

  handleReportUser = () => {
    const {dispatch, intl} = this.props;
    const {username = ''} = this.state;

    const _onConfirm = async () => {
      try {
        await addReport('user', username);
        dispatch(toastNotification(intl.formatMessage({id: 'report.added'})));
      } catch {
        dispatch(toastNotification(intl.formatMessage({id: 'report.added'})));
      }
    };

    dispatch(
      showActionModal({
        title: intl.formatMessage({id: 'report.confirm_report_title'}),
        body: intl.formatMessage({id: 'report.confirm_report_body'}),
        buttons: [
          {
            text: intl.formatMessage({id: 'alert.cancel'}),
            onPress: () => {},
          },
          {
            text: intl.formatMessage({id: 'alert.confirm'}),
            onPress: _onConfirm,
          },
        ],
      }),
    );
  };

  handleDelegateHp = () => {
    const {route, navigation} = this.props;
    const username = route.params?.username ?? '';
    navigation.navigate({
      name: ROUTES.SCREENS.TRANSFER,
      params: {
        transferType: 'delegate',
        fundType: 'HIVE_POWER',
        referredUsername: username,
      },
    });
  };

  handleOnBackPress = () => {
    const {route} = this.props;
    if (route && route.params && route.params.fetchData) {
      route.params.fetchData();
    }
  };

  // eslint-disable-next-line class-methods-use-this
  setEstimatedWalletValue = () => {
    // _setEstimatedWalletValue
    console.log('_setEstimatedWalletValue');
  };

  changeForceLoadPostState = (value: any) => {
    this.setState({forceLoadPost: value});
  };

  handleOnPressProfileEdit = () => {
    const {navigation, currentAccount} = this.props;
    navigation.navigate({
      name: ROUTES.SCREENS.PROFILE_EDIT,
      params: {
        fetchUser: () => this.setState({user: currentAccount}),
      },
    });
  };

  render() {
    const {
      avatar,
      comments,
      error,
      follows,
      forceLoadPost,
      isFavorite,
      isFollowing,
      isMuted,
      isOwnProfile,
      isProfileLoading,
      isReady,
      quickProfile,
      user,
      username,
      reverseHeader,
      deepLinkFilter,
    } = this.state;
    const {currency, isDarkTheme, isLoggedIn, children, isHideImage, route} = this.props;
    const activePage = route.params?.state ?? 0;
    const votingPower = user ? getVotingPower(user).toFixed(1) : '';
    const resourceCredits = user ? getRcPower(user).toFixed(1) : '';

    return (
      children &&
      children({
        about: user?.about?.profile,
        activePage,
        avatar,
        setEstimatedWalletValue: this.setEstimatedWalletValue,
        changeForceLoadPostState: this.changeForceLoadPostState,
        comments,
        currency,
        currencyRate: currency.currencyRate,
        currencySymbol: currency.currencySymbol,
        votingPower,
        resourceCredits,
        error,
        follows,
        forceLoadPost,
        getReplies: this._getReplies,
        handleFollowUnfollowUser: this.handleFollowUnfollowUser,
        handleMuteUnmuteUser: this.handleMuteUnmuteUser,
        handleOnBackPress: this.handleOnBackPress,
        handleOnFavoritePress: this.handleOnFavoritePress,
        handleOnFollowsPress: this.handleFollowsPress,
        handleOnPressProfileEdit: this.handleOnPressProfileEdit,
        handleReportUser: this.handleReportUser,
        handleDelegateHp: this.handleDelegateHp,
        isDarkTheme,
        isFavorite,
        isFollowing,
        isHideImage,
        isLoggedIn,
        isMuted,
        isOwnProfile,
        isProfileLoading,
        isReady,
        quickProfile,
        selectedUser: user,
        username,
        reverseHeader,
        deepLinkFilter,
      })
    );
  }
}
const mapStateToProps = (state: RootState) => ({
  currency: state.application.currency,
  isConnected: state.application.isConnected,
  isDarkTheme: state.application.isDarkTheme,
  isLoggedIn: state.application.isLoggedIn,
  pinCode: state.application.pin,
  activeBottomTab: state.ui.activeBottomTab,
  currentAccount: state.account.currentAccount,
  isHideImage: state.application.hidePostsThumbnails,
});

const mapHooksToProps = (props: any) => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const navigation = useNavigation();
  // eslint-disable-next-line react/jsx-props-no-spreading
  return <ProfileContainer navigation={navigation} {...props} />;
};

export default connect(mapStateToProps)(injectIntl(mapHooksToProps));
