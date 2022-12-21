import {fetchGlobalProps} from '../../providers/hive/dhive';
import {
  ADD_OTHER_ACCOUNT,
  FETCH_ACCOUNT_FAIL,
  REMOVE_OTHER_ACCOUNT,
  REMOVE_ALL_OTHER_ACCOUNT,
  SET_GLOBAL_PROPS,
  UPDATE_CURRENT_ACCOUNT,
  UPDATE_UNREAD_ACTIVITY_COUNT,
} from '../constants/constants';
import {AppDispatch} from '../store/store';

export const fetchGlobalProperties = () => (dispatch: AppDispatch) =>
  fetchGlobalProps().then(res =>
    dispatch({
      type: SET_GLOBAL_PROPS,
      payload: {...res},
    }),
  );

export const updateCurrentAccount = (payload: any) => ({
  type: UPDATE_CURRENT_ACCOUNT,
  payload,
});

export const addOtherAccount = (payload: any) => ({
  type: ADD_OTHER_ACCOUNT,
  payload,
});

export const failedAccount = (payload: any) => ({
  type: FETCH_ACCOUNT_FAIL,
  payload,
});

export const updateUnreadActivityCount = (payload: any) => ({
  type: UPDATE_UNREAD_ACTIVITY_COUNT,
  payload,
});

export const removeOtherAccount = (payload: any) => ({
  type: REMOVE_OTHER_ACCOUNT,
  payload,
});

export const removeAllOtherAccount = () => ({
  type: REMOVE_ALL_OTHER_ACCOUNT,
});

export const setGlobalProps = (payload: any) => ({
  type: SET_GLOBAL_PROPS,
  payload,
});
