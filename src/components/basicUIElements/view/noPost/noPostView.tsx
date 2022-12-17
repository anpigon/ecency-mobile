import React from 'react';
import {View, Text, Image, ViewStyle, ImageStyle, ImageSourcePropType} from 'react-native';
import styles from './noPostStyles';
import {MainButton} from '../../../mainButton';

interface Props {
  text?: string;
  name?: string;
  defaultText?: string;
  source?: ImageSourcePropType;
  imageStyle?: ImageStyle;
  style?: ViewStyle;
  isButtonText?: boolean;
  handleOnButtonPress?: () => void;
}

NoPost.defaultProps = {
  text: '',
  name: '',
  defaultText: '',
};

function NoPost({
  text = '',
  name = '',
  defaultText = '',
  source,
  imageStyle,
  style,
  isButtonText = false,
  handleOnButtonPress,
}: Props) {
  return (
    <View style={[styles.wrapper, style]}>
      <Image
        style={[styles.image, imageStyle]}
        source={source || require('../../../../assets/no_post.png')}
      />
      {name && !isButtonText ? (
        <Text style={styles.text}>{`@${name} ${text}`}</Text>
      ) : (
        !isButtonText && <Text style={styles.text}>{defaultText}</Text>
      )}
      {isButtonText && (
        <MainButton
          style={styles.mainButton}
          onPress={handleOnButtonPress}
          iconName="person"
          iconColor="white"
          text={defaultText}
        />
      )}
    </View>
  );
}

export default NoPost;
