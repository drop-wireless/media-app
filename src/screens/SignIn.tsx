import {useState} from 'react';
import {
  KeyboardAvoidingView,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableHighlight,
  TouchableOpacity,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import AuthInput from '../components/AuthInput';
import {advertisementAPI} from '../services/advertisementAPI';
import {authStyles} from './styles/authStyles';
import {styles} from './styles/styles';
// import EncryptedStorage from 'react-native-encrypted-storage';
import {signInAsync, setUserName, setEmail} from '../redux/slices/userSlice';
import {useAppDispatch, useAppSelector} from '../redux/hooks';
import Config from 'react-native-config';
import sizes from '../constants/sizes';
import { validateUsername } from '../utils/validate';

export default function SignIn({navigation}: any) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const isInternetReachable = useAppSelector(state => state.user.internetReachable);

  const dispatch = useAppDispatch();

  async function signIn(username: string, password: string) {
    setLoading(true);
    try {
      const res: any = await advertisementAPI.signIn(username, password);
      // await EncryptedStorage.setItem('idToken', res.data.idToken);
      // await EncryptedStorage.setItem('refreshToken', res.data.refreshToken);
      // dispatch(setUserName(username));  // user input for username is either email or username, so this may cause confusion
      if (res?.data) {
        dispatch(setUserName(res.data.userdetails.username));
        dispatch(setEmail(res.data.userdetails.email));
        await dispatch(signInAsync(res.data.userdetails.uuid));
        if (!validateUsername(res.data.userdetails.username)) {
          Toast.show({type: "error", text1: "Not compatible username", text2: "Invalid special character is in the username"});
        }
      }
      else {
        Toast.show({type: 'error', text1: 'Failed to connect server'});
      }
      setLoading(false);
    } catch (err: any) {
      console.log('signIn err:', err); //.response.data);
      if (err.response?.data === 'UserNotConfirmedException') {
        Toast.show({
          type: 'error',
          text1: 'Please check your email to verify registration',
        });
      }
      else { 
        Toast.show({type: 'error', text1: 'Unable to sign in'});
      }
      setLoading(false);
    }
  }

  async function handleSignInPress() {
    if (!isInternetReachable) {
      Toast.show({type: 'error', text1: 'Cannot connect to the internet', text2: 'Please check your network connection'});
    } else if (!username) {
      Toast.show({type: 'error', text1: 'Please enter your username'});
    } else if (!password) {
      Toast.show({type: 'error', text1: 'Please enter your password'});
    } else {
      signIn(username, password);
    }
  }

  return (
    <SafeAreaView style={authStyles.container}>
      <KeyboardAvoidingView style={{flex: 1}}>
        <ScrollView
          contentContainerStyle={authStyles.scrollViewContainer}
          keyboardShouldPersistTaps="handled">
          <TouchableHighlight
            underlayColor={'lightgray'}
            style={{...styles.lightButton, ...authStyles.registerButton}}
            disabled={loading}
            onPress={() => navigation.navigate('Register')}>
            <Text>Register</Text>
          </TouchableHighlight>
          <Text style={styles.signInText}>Sign in.</Text>
          <View>
            <AuthInput
              onChangeText={(input: string) =>
                setUsername(input.replace(/\s/g, ''))
              }
              value={username}
              label="USERNAME"
            />
            <AuthInput
              onChangeText={setPassword}
              value={password}
              label="PASSWORD"
              secureTextEntry
            />
            <TouchableHighlight
              underlayColor={'lightgray'}
              style={{
                ...styles.lightButton,
                ...authStyles.forgotPasswordButton,
              }}
              disabled={loading}
              onPress={() => navigation.navigate('ForgotPassword')}>
              <Text>Forgot Password?</Text>
            </TouchableHighlight>
          </View>
          <View style={authStyles.divider} />
          <TouchableOpacity
            style={styles.darkButton}
            disabled={loading}
            onPress={() => handleSignInPress()}>
            <Text style={styles.darkButtonText}>
              {loading ? 'Signing In...' : 'Sign In'}
            </Text>
          </TouchableOpacity>
          <Text style={localStyles.versionText}>
            Version {Config.APP_VERSION}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  versionText: {
    paddingVertical: sizes.sz_xl,
    marginTop: 'auto',
  },
});
