import React from 'react';
import {View, Text, Image} from 'react-native';
import NO_POST from '../../../../assets/no_post.png';
import styles from './noPostStyles';
import {MainButton} from '../../../mainButton';

function NoPost({
  text,
  name,
  defaultText,
  source,
  imageStyle,
  style,
  isButtonText,
  handleOnButtonPress,
}) {
  return (
    <View style={[styles.wrapper, style]}>
      <Image style={[styles.image, imageStyle]} source={source || NO_POST} />
      {name && !isButtonText ? (
        <Text style={styles.text}>{`@${name} ${text}`}</Text>
      ) : (
        !isButtonText && <Text style={styles.text}>{defaultText}</Text>
      )}
      {isButtonText && (
        <MainButton
          style={{width: 150}}
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
