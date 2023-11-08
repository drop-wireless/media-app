import {configureStore, ThunkAction, Action} from '@reduxjs/toolkit';
import userReducer from './slices/userSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  persistStore,
  persistReducer,
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
  PersistedState,
} from 'redux-persist';
import EncryptedStorage from 'react-native-encrypted-storage';

const STORAGE_VERSION = 0;

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  version: STORAGE_VERSION,
  migrate: async (state: PersistedState) => {
    console.log(JSON.stringify(state));
    if (state) {
        const prev_version = state._persist.version;
        console.log("REDUX PERSIST: current storage version is: " + prev_version);
        console.log("REDUX PERSIST: latest storage version is: " + STORAGE_VERSION);
        if (prev_version == null || prev_version < STORAGE_VERSION) {
            // need a migration, version is nullable, but usually set to default, -1.
            console.log("REDUX PERSIST: initiating the migration.");

            // FOR ALL VERSIONS
            const stateData = (state as any);
            if (stateData.userName && stateData.walletAddress) {
              try {
                const storedPrivateKey = await EncryptedStorage.getItem("privateKey");
                if (storedPrivateKey) {
                  console.log("previous key found. copying to user key");
                  await EncryptedStorage.setItem("pk_" + stateData.userName, storedPrivateKey);
                  console.log("copied:", stateData.userName, stateData.walletAddress);
                  await EncryptedStorage.removeItem("privateKey");
                  console.log("removed previous key");
                }
              } catch (e) {
                console.log("key migration error:", e);
              }
            }
            // init internet reachable
            stateData.internetReachable = false;

            console.log("REDUX PERSIST: successfully migrated to storage version " + STORAGE_VERSION);
            return Promise.resolve({...stateData});
        }
    }
    else {  // no previes state
        console.log("REDUX PERSIST: no previous state for reducer.");
    }
    return Promise.resolve(state);  // no migration needed. return same state.
  }
};

const persistedUserReducer = persistReducer(persistConfig, userReducer);

export const store = configureStore({
  reducer: {
    user: persistedUserReducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
