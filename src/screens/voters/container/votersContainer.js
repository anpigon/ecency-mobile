import React, { Component } from 'react';

// Services and Actions

// Middleware

// Constants

// Utilities

// Component
import { VotersScreen } from '..';

/*
  *            Props Name        Description                                     Value
  *@props -->  props name here   description here                                Value Type Here
  *
  */

class VotersContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  // Component Life Cycle Functions

  // Component Functions

  render() {
    const { navigation } = this.props;
    const activeVotes = navigation.state && navigation.state.params && navigation.state.params.activeVotes;

    return <VotersScreen votes={activeVotes} {...this.props} />;
  }
}

export default VotersContainer;