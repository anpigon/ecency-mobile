import React, {Component} from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import Slider from '@esteemapp/react-native-slider';
import {injectIntl} from 'react-intl';

// Constants

// Components
import {CheckBox, TransferFormItem, MainButton, TextInput, UserAvatar} from '../../../components';

// Styles
import styles from './transferStyles';

class WithdrawAccountModal extends Component {
  /* Props
   * ------------------------------------------------
   *   @prop { type }    name                - Description....
   */

  constructor(props) {
    super(props);
    this.state = {
      percent: 25,
      autoPowerUp: false,
      account: '',
      isValidUsername: false,
    };
  }

  // Component Life Cycles

  // Component Functions

  _checkValidUsers = username => {
    const {getAccountsWithUsername} = this.props;

    getAccountsWithUsername(username).then(res => {
      const isValid = res.includes(username);

      this.setState({isValidUsername: isValid});
    });
  };

  _renderInput = (placeholder, state, keyboardType, isTextArea) => (
    <TextInput
      style={[isTextArea ? styles.textarea : styles.input]}
      onChangeText={value => this.setState({[state]: value}, this._checkValidUsers(value))}
      value={this.state[state]}
      placeholder={placeholder}
      placeholderTextColor="#c1c5c7"
      autoCapitalize="none"
      multiline={isTextArea}
      numberOfLines={isTextArea ? 4 : 1}
      keyboardType={keyboardType}
    />
  );

  render() {
    const {intl, handleOnSubmit} = this.props;
    const {percent, autoPowerUp, account, isValidUsername} = this.state;

    const isValidForm = isValidUsername && percent > 0;

    return (
      <View style={styles.modalContainer}>
        <UserAvatar username={account} size="xl" style={styles.avatar} noAction />
        <TransferFormItem
          label={intl.formatMessage({id: 'transfer.from'})}
          rightComponent={() =>
            this._renderInput(
              intl.formatMessage({id: 'transfer.to_placeholder'}),
              'account',
              'default',
            )
          }
        />
        <TransferFormItem
          label={intl.formatMessage({id: 'transfer.percent'})}
          rightComponent={<Text style={styles.amountText}>{`${percent.toFixed(0)} %`}</Text>}
        />
        <View style={styles.informationView}>
          <Slider
            style={styles.slider}
            trackStyle={styles.track}
            thumbStyle={styles.thumb}
            minimumTrackTintColor="#357ce6"
            thumbTintColor="#007ee5"
            maximumValue={100}
            value={percent}
            onValueChange={value => {
              this.setState({percent: value});
            }}
          />
        </View>
        <Text style={styles.informationText}>
          {intl.formatMessage({id: 'transfer.percent_information'})}
        </Text>
        <TouchableOpacity onPress={() => this.setState({autoPowerUp: !autoPowerUp})}>
          <View style={styles.checkView}>
            <CheckBox locked isChecked={autoPowerUp} />
            <Text style={styles.informationText}>
              {intl.formatMessage({id: 'transfer.auto_vests'})}
            </Text>
          </View>
        </TouchableOpacity>
        <MainButton
          isDisable={!isValidForm}
          style={styles.button}
          onPress={() => handleOnSubmit(account, percent, autoPowerUp)}>
          <Text style={styles.buttonText}>{intl.formatMessage({id: 'transfer.save'})}</Text>
        </MainButton>
      </View>
    );
  }
}

export default injectIntl(WithdrawAccountModal);
