import {NavigationContainer} from '@react-navigation/native';
import {useAppDispatch, useAppSelector} from '../redux/hooks';
import AuthNavigator from './AuthNavigator';
import HomeNavigator from './HomeNavigator';
import SplashScreen from 'react-native-splash-screen';
import {useEffect, useState} from 'react';
import NetInfo from "@react-native-community/netinfo";
import { setInternetReachable } from '../redux/slices/userSlice';

export default function AppNavigator() {
  const signedIn = useAppSelector(state => state.user.signedIn);

  /* Hacky way of preventing SignIn page from briefly showing
   * before switching to Map page on app startup.
   * Issue is caused by signedIn state taking a second to load.
   */

  const [delayed, setDelayed] = useState(false);

  const dispatch = useAppDispatch();
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      console.log("NetInfo updated, Connection type:", state.type, "Internet Reachable:", state.isInternetReachable);
      dispatch(setInternetReachable(state.isInternetReachable || false));
    });
    
    return (() => {
      console.log("unsubscribing netinfo");
      unsubscribe();
    });
  }, []);
  useEffect(() => {
    delay(1000);
  });

  useEffect(() => {
    if (delayed) SplashScreen.hide();
  }, [delayed]);

  async function delay(ms: number) {
    await new Promise(resolve => setTimeout(resolve, ms));
    setDelayed(true);
  }

  return (
    <NavigationContainer>
      {signedIn ? <HomeNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
