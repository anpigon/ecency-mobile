import React from 'react';
import {View, TouchableOpacity, Text, Platform, ActivityIndicator} from 'react-native';
import {View as AnimatedView} from 'react-native-animatable';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import {injectIntl, useIntl} from 'react-intl';

// Images
import FastImage from 'react-native-fast-image';
import EStyleSheet from 'react-native-extended-stylesheet';
import LIGHT_COVER_IMAGE from '../../assets/default_cover_image.png';
import DARK_COVER_IMAGE from '../../assets/dark_cover_image.png';

// Components
import {FormInput} from '../formInput';
import {IconButton} from '../iconButton';

// Utils
import {getResizedImage} from '../../utils/image';

// Styles
import styles from './profileEditFormStyles';
import {MainButton} from '../mainButton';

interface ProfileEditFormProps {
  coverUrl: string;
  formData: any;
  handleOnItemChange: () => void;
  handleOnSubmit: () => void;
  intl: any;
  isDarkTheme: boolean;
  isLoading: boolean;
  isUploading: boolean;
  showImageUploadActions: boolean;
  saveEnabled: boolean;
}

function ProfileEditFormView({
  coverUrl,
  formData,
  handleOnItemChange,
  handleOnSubmit,
  isDarkTheme,
  isLoading,
  isUploading,
  showImageUploadActions,
  saveEnabled,
  ...props
}: ProfileEditFormProps) {
  const intl = useIntl();

  return (
    <View style={styles.container}>
      <KeyboardAwareScrollView
        enableAutoAutomaticScroll={Platform.OS === 'ios'}
        contentContainerStyle={styles.contentContainer}
        enableOnAndroid={true}>
        <TouchableOpacity style={styles.coverImgWrapper} onPress={showImageUploadActions}>
          <FastImage
            style={styles.coverImg}
            source={
              coverUrl
                ? {uri: getResizedImage(coverUrl, 600)}
                : isDarkTheme
                ? DARK_COVER_IMAGE
                : LIGHT_COVER_IMAGE
            }
          />
          {isUploading && (
            <ActivityIndicator
              style={styles.activityIndicator}
              color={EStyleSheet.value('$white')}
              size="large"
            />
          )}

          <IconButton
            iconStyle={styles.addIcon}
            style={styles.addButton}
            iconType="MaterialCommunityIcons"
            name="plus"
            onPress={showImageUploadActions}
            size={15}
          />
        </TouchableOpacity>

        {formData.map(item => (
          <View style={styles.formItem} key={item.valueKey}>
            <Text style={styles.label}>
              {intl.formatMessage({
                id: `profile.edit.${item.label}`,
              })}
            </Text>
            <FormInput
              wrapperStyle={styles.formStyle}
              isValid
              height={40}
              onChange={value => handleOnItemChange(value, item.valueKey)}
              placeholder={item.placeholder}
              isEditable
              type="none"
              value={props[item.valueKey]}
              inputStyle={styles.input}
            />
          </View>
        ))}
      </KeyboardAwareScrollView>

      {saveEnabled && (
        <AnimatedView style={styles.floatingContainer} animation="bounceInRight">
          <MainButton
            style={{width: isLoading ? null : 120, marginBottom: 24, alignSelf: 'flex-end'}}
            onPress={handleOnSubmit}
            iconName="save"
            iconType="MaterialIcons"
            iconColor="white"
            text="SAVE"
            isLoading={isLoading}
          />
        </AnimatedView>
      )}
    </View>
  );
}

export default injectIntl(ProfileEditFormView);
