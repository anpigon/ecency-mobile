import { REGISTER_TOOLTIP } from '../constants/constants';

export interface WalkthroughItem {
  walkthroughIndex: number;
  isShown?: boolean;
}
interface State {
  walkthroughMap: Map<number, WalkthroughItem>;
}

const initialState: State = {
  walkthroughMap: new Map(),
};
export default function walkthroughtReducer(
  state = initialState,
  action = { type: '', payload: {} },
) {
  const { type, payload } = action;
  switch (type) {
    case REGISTER_TOOLTIP:
      if (!state.walkthroughMap) {
        state.walkthroughMap = new Map<number, WalkthroughItem>();
      }
      state.walkthroughMap.set(payload.walkthroughIndex, payload);
      return {
        ...state,
      };

    default:
      return state;
  }
}
