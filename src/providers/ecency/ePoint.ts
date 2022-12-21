import {Alert} from 'react-native';
import ePointApi from '../../config/api';
import ecencyApi from '../../config/ecencyApi';
import bugsnagInstance from '../../config/bugsnag';
import {EcencyUser, UserPoint} from './ecency.types';

/**
 * Records user activty and reward poinsts
 * @param ty points
 * @param bl block number
 * @param tx transaction id
 * @returns
 */
export const userActivity = async (ty: number, tx: string = '', bl: string | number = '') => {
  /* try {
    const data: {
      ty: number;
      bl?: string | number;
      tx?: string | number;
    } = {ty};

    if (bl) data.bl = bl;
    if (tx) data.tx = tx;

    const response = await ecencyApi.post('/private-api/usr-activity', data);
    return response.data;
  } catch (error) {
    console.warn('Failed to push user activity point', error);
    bugsnagInstance.notify(error);
    throw error;
  } */
  return Promise.resolve();
};

export const getPointsSummary = async (username: string): Promise<EcencyUser> => {
  /* try {
    const data = {username};
    const response = await ecencyApi.post('/private-api/points', data);
    console.log('returning user points data', response.data);
    return response.data;
  } catch (error) {
    console.warn('Failed to get points', error);
    bugsnagInstance.notify(error);
    throw new Error(error.response?.data?.message || error.message);
  } */
  return Promise.resolve({username} as EcencyUser);
};

export const getPointsHistory = (username: string): Promise<UserPoint[]> => {
  /* return new Promise(resolve => {
    ePointApi
      .get(`/users/${username}/points`)
      .then(res => {
        resolve(res.data);
      })
      .catch(error => {
        Alert.alert('Error', error.message);
        bugsnagInstance.notify(error);
      });
  }); */
  return Promise.resolve([]);
};

export const claimPoints = async () => {
  /* try {
    const response = await ecencyApi.post('/private-api/points-claim');
    return response.data;
  } catch (error) {
    console.warn('Failed to calim points', error);
    bugsnagInstance.notify(error);
    throw new Error(error.response?.data?.message || error.message);
  } */
};

export const gameStatusCheck = (username: string, type: string) => {
  /* return new Promise((resolve, reject) => {
    ePointApi
      .get(`/game/${username}`, {
        params: {
          type,
        },
      })
      .then(res => {
        resolve(res.data);
      })
      .catch(error => {
        reject(error);
      });
  }); */
  return Promise.resolve({} as any);
};

export const gameClaim = (username: string, type: string, key: string) => {
  /* return new Promise((resolve, reject) => {
    ePointApi
      .post(`/game/${username}?type=${type}`, {
        key,
      })
      .then(res => {
        resolve(res.data);
      })
      .catch(error => {
        reject(error);
      });
  }); */
  return Promise.resolve({} as any);
};
