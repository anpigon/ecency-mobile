/* eslint-disable react/no-array-index-key */
import React, {Component} from 'react';
import {Animated, Easing, View} from 'react-native';

// Styles
import styles from './pinAnimatedInputStyles';

class PinAnimatedInput extends Component {
  /* Props
   *
   *   @prop { string }    pin            - Description.
   *
   */
  constructor(props) {
    super(props);
    this.state = {};

    this.dots = [];

    this.dots[0] = new Animated.Value(0);
    this.dots[1] = new Animated.Value(0);
    this.dots[2] = new Animated.Value(0);
    this.dots[3] = new Animated.Value(0);
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    const {loading} = this.props;
    if (loading !== nextProps.loading) {
      if (nextProps.loading) {
        this._startLoadingAnimation();
      } else {
        this._stopLoadingAnimation();
      }
    }
  }

  _startLoadingAnimation = () => {
    [...Array(4)].map((_, index) => this.dots[index].setValue(0));
    Animated.sequence([
      ...this.dots.map(item =>
        Animated.timing(item, {
          toValue: 1,
          duration: 250,
          easing: Easing.linear,
          useNativeDriver: false, // setting it to false as animation is not being used
        }),
      ),
    ]).start(o => {
      if (o.finished) {
        this._startLoadingAnimation();
      }
    });
  };

  _stopLoadingAnimation = () => {
    [...Array(4)].map((_, index) => this.dots[index].stopAnimation());
  };

  render() {
    const {pin} = this.props;
    const marginBottom = [];

    // eslint-disable-next-line array-callback-return
    [...Array(4)].map((_, index) => {
      marginBottom[index] = this.dots[index].interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, 20, 0],
      });
    });

    return (
      <View style={[styles.container]}>
        {this.dots.map((_, index) => {
          if (pin.length > index) {
            return (
              <Animated.View
                key={`passwordItem-${index}`}
                style={[styles.input, styles.inputWithBackground, {bottom: marginBottom[index]}]}
              />
            );
          }
          return <View key={`passwordItem-${index}`} style={styles.input} />;
        })}
      </View>
    );
  }
}
export default PinAnimatedInput;
/* eslint-enable */
