import {useState} from 'react';
import {
  KeyboardAvoidingView,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableHighlight,
  TouchableOpacity,
  View,
} from 'react-native';
import AuthInput from '../components/AuthInput';
import {authStyles} from './styles/authStyles';
import {styles} from './styles/styles';
import EmailValidator from 'email-validator';
import Toast from 'react-native-toast-message';
import {advertisementAPI} from '../services/advertisementAPI';

export default function ForgotPassword({navigation}: any) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');

  async function handleGetVerificationCodePress() {
    if (!email) {
      Toast.show({type: 'error', text1: 'Email address is required'});
    } else if (!EmailValidator.validate(email)) {
      Toast.show({type: 'error', text1: 'Invalid email address'});
    } else {
      setLoading(true);
      await advertisementAPI
        .getVerificationCode(email)
        .then(res => {
          // console.log('getVerificationCode res:', res);
          Toast.show({
            type: 'success',
            text1: 'Please check your email for your verification code',
          });
          setLoading(false);
          navigation.navigate('ForgotPasswordReset', {email: email});
        })
        .catch(err => {
          console.log('getVerificationCode err:', err);
          Toast.show({type: 'error', text1: 'Unable to get verification code'});
        });
      setLoading(false);
    }
  }

  function handleAlreadyHaveVerificationCodePress() {
    if (!email) {
      Toast.show({type: 'error', text1: 'Email address is required'});
    } else if (!EmailValidator.validate(email)) {
      Toast.show({type: 'error', text1: 'Invalid email address'});
    } else {
      navigation.navigate('ForgotPasswordReset', {email: email});
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
            onPress={() => navigation.goBack()}>
            <Text>Sign In</Text>
          </TouchableHighlight>
          <Text style={styles.signInText}>Forgot Password?</Text>
          <View>
            <AuthInput
              onChangeText={(input: string) =>
                setEmail(input.replace(/\s/g, ''))
              }
              value={email}
              label="EMAIL"
            />
          </View>
          <View style={authStyles.divider} />
          <TouchableOpacity
            style={styles.darkButton}
            disabled={loading}
            onPress={() => handleGetVerificationCodePress()}>
            <Text style={styles.darkButtonText}>
              {loading
                ? 'Getting Verification Code...'
                : 'Get Verification Code'}
            </Text>
          </TouchableOpacity>
          <TouchableHighlight
            underlayColor={'lightgray'}
            style={{
              ...styles.lightButton,
              ...authStyles.forgotPasswordButton,
            }}
            disabled={loading}
            onPress={() => handleAlreadyHaveVerificationCodePress()}>
            <Text>Already have a verification code?</Text>
          </TouchableHighlight>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
