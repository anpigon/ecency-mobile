import React, {Component} from 'react';
import {Alert} from 'react-native';
import {connect} from 'react-redux';
import {injectIntl, IntlShape} from 'react-intl';
import ImagePicker, {ImageOrVideo} from 'react-native-image-crop-picker';
import {Dispatch, AnyAction} from '@reduxjs/toolkit';

import {NavigationProp, useNavigation} from '@react-navigation/native';
import {uploadImage} from '../providers/ecency/ecency';

import {profileUpdate, signImage} from '../providers/hive/dhive';
import {updateCurrentAccount} from '../redux/actions/accountAction';
import {setAvatarCacheStamp} from '../redux/actions/uiAction';
import {RootState} from '../redux/store/store';

const FORM_DATA = [
  {
    valueKey: 'name',
    type: 'text',
    label: 'display_name',
    placeholder: '',
  },
  {
    valueKey: 'about',
    type: 'text',
    label: 'about',
    placeholder: '',
  },
  {
    valueKey: 'location',
    type: 'text',
    label: 'location',
    placeholder: '',
  },
  {
    valueKey: 'website',
    type: 'text',
    label: 'website',
    placeholder: '',
  },
];

interface Props {
  children: any;
  currentAccount: any;
  isDarkTheme: boolean;
  intl: IntlShape;
  pinCode: string;
  dispatch: Dispatch<AnyAction>;
  navigation: NavigationProp<any>;
  route: any;
}

interface State {
  isLoading: boolean;
  isUploading: boolean;
  name: string;
  location: string;
  website: string;
  about: string;
  coverUrl: string;
  avatarUrl: string;
  pinned: any;
  saveEnabled: boolean;
}

class ProfileEditContainer extends Component<Props, State> {
  /* Props
   * ------------------------------------------------
   *   @prop { type }    name                - Description....
   */

  constructor(props: Props) {
    super(props);
    this.state = {
      isLoading: false,
      isUploading: false,
      saveEnabled: false,
      about: props.currentAccount?.about.profile.about,
      name: props.currentAccount?.about.profile.name,
      location: props.currentAccount?.about.profile.location,
      website: props.currentAccount?.about.profile.website,
      coverUrl: props.currentAccount?.about.profile.cover_image,
      pinned: props.currentAccount?.about.profile.pinned,
      avatarUrl: props.currentAccount?.avatar,
    };
  }

  // Component Life Cycles

  // Component Functions

  _handleOnItemChange = (val: any, key: keyof State) => {
    this.setState(prevState => ({...prevState, [key]: val, saveEnabled: true}));
  };

  _uploadImage = async (media: ImageOrVideo, action: 'coverUrl' | 'avatarUrl') => {
    const {intl, currentAccount, pinCode} = this.props;

    this.setState({isUploading: true});

    try {
      const sign = await signImage(media, currentAccount, pinCode);
      const res = await uploadImage(media, currentAccount.name, sign);
      if (res?.data && res?.data?.url) {
        this.setState(prevState => ({
          ...prevState,
          [action]: res.data.url,
          isUploading: false,
          saveEnabled: true,
        }));
      }
    } catch (error: any) {
      if (error) {
        Alert.alert(intl.formatMessage({id: 'alert.fail'}), error.message || error.toString());
      }
      this.setState({isUploading: false});
    }
  };

  _handleMediaAction = async (type: 'image' | 'camera', action: 'coverUrl' | 'avatarUrl') => {
    const options =
      action === 'avatarUrl' ? IMAGE_PICKER_AVATAR_OPTIONS : IMAGE_PICKER_COVER_OPTIONS;

    let media: ImageOrVideo | null = null;
    try {
      if (type === 'camera') {
        media = await ImagePicker.openCamera(options);
      } else if (type === 'image') {
        media = await ImagePicker.openPicker(options);
      }
      if (media) {
        await this._uploadImage(media, action);
      }
    } catch (error: any) {
      const {intl} = this.props;
      if (error?.code === 'E_PERMISSION_MISSING') {
        Alert.alert(
          intl.formatMessage({id: 'alert.permission_denied'}),
          intl.formatMessage({id: 'alert.permission_text'}),
        );
      }
    }
  };

  _handleOnSubmit = async () => {
    const {currentAccount, pinCode, dispatch, navigation, intl, route} = this.props;
    const {name, location, website, about, coverUrl, avatarUrl, pinned} = this.state;

    this.setState({isLoading: true});

    // TOOD: preserve pinned post permlink
    const params = {
      profile_image: avatarUrl,
      cover_image: coverUrl,
      name,
      website,
      about,
      location,
      pinned,
      version: 2,
    };

    try {
      await profileUpdate(params, pinCode, currentAccount);

      const _currentAccount = {...currentAccount, display_name: name, avatar: avatarUrl};
      _currentAccount.about.profile = {...params};

      dispatch(updateCurrentAccount(_currentAccount));
      dispatch(setAvatarCacheStamp(new Date().getTime()));
      this.setState({isLoading: false});
      route.params.fetchUser();
      navigation.goBack();
    } catch (err: any) {
      Alert.alert(intl.formatMessage({id: 'alert.fail'}), err?.message || err.toString());
      this.setState({isLoading: false});
    }
  };

  render() {
    const {children, currentAccount, isDarkTheme} = this.props;
    const {
      isLoading,
      isUploading,
      name,
      location,
      website,
      about,
      coverUrl,
      avatarUrl,
      saveEnabled,
    } = this.state;

    return (
      children &&
      children({
        about,
        avatarUrl,
        coverUrl,
        currentAccount,
        formData: FORM_DATA,
        handleMediaAction: this._handleMediaAction,
        handleOnItemChange: this._handleOnItemChange,
        handleOnSubmit: this._handleOnSubmit,
        isDarkTheme,
        isLoading,
        isUploading,
        location,
        name,
        website,
        saveEnabled,
      })
    );
  }
}

const mapStateToProps = (state: RootState) => ({
  currentAccount: state.account.currentAccount,
  isDarkTheme: state.application.isDarkTheme,
  pinCode: state.application.pin,
});

const mapHooksToProps = (props: any) => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const navigation = useNavigation();
  // eslint-disable-next-line react/jsx-props-no-spreading
  return <ProfileEditContainer {...props} navigation={navigation} />;
};

export default connect(mapStateToProps)(injectIntl(mapHooksToProps));

const IMAGE_PICKER_AVATAR_OPTIONS = {
  includeBase64: true,
  cropping: true,
  width: 512,
  height: 512,
};

const IMAGE_PICKER_COVER_OPTIONS = {
  includeBase64: true,
};
