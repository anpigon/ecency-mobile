import React, {PureComponent, Fragment} from 'react';
import {gestureHandlerRootHOC} from 'react-native-gesture-handler';
import {RedeemContainer, PointsContainer} from '../../../containers';

import {Promote, PostBoost} from '../../../components';

class RedeemScreen extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {};
  }

  // Component Life Cycle Functions

  // Component Functions

  render() {
    const {route} = this.props;
    return (
      <PointsContainer route={route}>
        {({
          accounts,
          currentAccountName,
          balance,
          navigationParams,
          redeemType,
          getESTMPrice,
          user,
        }) => (
          <RedeemContainer>
            {({handleOnSubmit, SCPath, isSCModalOpen, handleOnSCModalClose, isLoading}) => (
              <>
                {redeemType === 'promote' && (
                  <Promote
                    isLoading={isLoading}
                    accounts={accounts}
                    currentAccountName={currentAccountName}
                    balance={balance}
                    navigationParams={navigationParams}
                    handleOnSubmit={handleOnSubmit}
                    redeemType={redeemType}
                    isSCModalOpen={isSCModalOpen}
                    handleOnSCModalClose={handleOnSCModalClose}
                    SCPath={SCPath}
                    getESTMPrice={getESTMPrice}
                  />
                )}

                {redeemType === 'boost' && (
                  <PostBoost
                    isLoading={isLoading}
                    accounts={accounts}
                    currentAccountName={currentAccountName}
                    balance={balance}
                    navigationParams={navigationParams}
                    handleOnSubmit={handleOnSubmit}
                    redeemType={redeemType}
                    isSCModalOpen={isSCModalOpen}
                    handleOnSCModalClose={handleOnSCModalClose}
                    SCPath={SCPath}
                    getESTMPrice={getESTMPrice}
                    user={user}
                  />
                )}
              </>
            )}
          </RedeemContainer>
        )}
      </PointsContainer>
    );
  }
}

export default gestureHandlerRootHOC(RedeemScreen);
