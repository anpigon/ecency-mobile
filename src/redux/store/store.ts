import {configureStore, StoreEnhancer, Middleware} from '@reduxjs/toolkit';

import {createMigrate, createTransform, persistReducer, persistStore} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

import reducers from '../reducers';
import MigrationHelpers from '../../utils/migrationHelpers';

const transformCacheVoteMap = createTransform(
  (inboundState: any) => ({
    ...inboundState,
    votes: Array.from(inboundState.votes),
    comments: Array.from(inboundState.comments),
    drafts: Array.from(inboundState.drafts),
    subscribedCommunities: Array.from(inboundState.subscribedCommunities),
    pointActivities: Array.from(inboundState.pointActivities),
  }),
  outboundState => ({
    ...outboundState,
    votes: new Map(outboundState.votes),
    comments: new Map(outboundState.comments),
    drafts: new Map(outboundState.drafts),
    subscribedCommunities: new Map(outboundState.subscribedCommunities),
    pointActivities: new Map(outboundState.pointActivities),
  }),
  {whitelist: ['cache']},
);

const transformWalkthroughMap = createTransform(
  (inboundState: any) => ({
    ...inboundState,
    walkthroughMap: Array.from(inboundState.walkthroughMap),
  }),
  outboundState => ({...outboundState, walkthroughMap: new Map(outboundState.walkthroughMap)}),
  {whitelist: ['walkthrough']},
);

// // Middleware: Redux Persist Config
const persistConfig = {
  // Root
  key: 'root',
  // Storage Method (React Native)
  storage: AsyncStorage,
  version: 2, // New version 0, default or previous version -1, versions are useful migrations
  // Blacklist (Don't Save Specific Reducers)
  blacklist: ['communities', 'user', 'ui'],
  transforms: [transformCacheVoteMap, transformWalkthroughMap],
  migrate: createMigrate(MigrationHelpers.reduxMigrations, {debug: false}),
};

// Middleware: Redux Persist Persisted Reducer
const persistedReducer = persistReducer(persistConfig, reducers);

const middleware: Middleware[] = [];
if (__DEV__) {
  const createDebugger = require('redux-flipper').default;
  middleware.push(createDebugger());
}

export const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(middleware),
});

export const persistor = persistStore(store);

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
