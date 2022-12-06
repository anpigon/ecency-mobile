import {REGISTER_TOOLTIP} from '../constants/constants';
import {WalkthroughItem} from '../reducers/walkthroughReducer';

export const registerTooltip = (walkthrough: WalkthroughItem) => ({
  payload: walkthrough,
  type: REGISTER_TOOLTIP,
});
