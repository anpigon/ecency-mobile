import React, { Component } from 'react';
import { withNavigation } from 'react-navigation';

// Constants
// import { default as ROUTES } from '../../../constants/routeNames';

// Components
import { BasicHeaderView } from '..';

class BasicHeaderContainer extends Component {
  /* Props
    * ------------------------------------------------
    *   @prop { funtion }    handleOnPressPreviewButton                - Preview button active handler....
    */

  constructor(props) {
    super(props);
    this.state = {};
  }

  // Component Life Cycles

  // Component Functions
  _handleOnPressBackButton = () => {
    const { navigation } = this.props;

    navigation.goBack();
  };

  render() {
    return (
      <BasicHeaderView handleOnPressBackButton={this._handleOnPressBackButton} {...this.props} />
    );
  }
}

export default withNavigation(BasicHeaderContainer);