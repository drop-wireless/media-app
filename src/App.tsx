import React, { useEffect } from 'react';
import AppNavigator from './navigation/AppNavigator';
import {setCustomText, setCustomTextInput} from 'react-native-global-props';
import sizes from './constants/sizes';
import Toast from 'react-native-toast-message';
import {persistor, store} from './redux/store';
import {PersistGate} from 'redux-persist/integration/react';
import {Provider} from 'react-redux';
import '../global';
import {LogBox, Platform} from 'react-native';
import Orientation from 'react-native-orientation-locker';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  "The provided value 'ms-stream' is not a valid 'responseType'",
  "The provided value 'moz-chunked-arraybuffer' is not a valid 'responseType'",
]);

Orientation.lockToPortrait();

const customTextProps = {
  style: {
    fontFamily: 'Montserrat-Regular',
    fontSize: sizes.sz_md,
    color: 'black',
  },
};

const customTextInputProps = {
  underlineColorAndroid: 'rgba(0,0,0,0)',
  style: {
    fontFamily: 'Montserrat-Regular',
    backgroundColor: 'lightgray',
    borderRadius: 5,
    padding: sizes.sz_2xs,
    paddingHorizontal: sizes.sz_sm,
    color: 'black',
  },
};

setCustomText(customTextProps);
setCustomTextInput(customTextInputProps);


function App() {
  return (
    <Provider store={store}>
      <PersistGate persistor={persistor} />
        <GestureHandlerRootView style={{ flex: 1 }}>
          <AppNavigator />
        </GestureHandlerRootView>
      <Toast position="bottom" />
    </Provider>
  );
}

export default App;
