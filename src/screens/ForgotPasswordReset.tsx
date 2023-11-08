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
import Toast from 'react-native-toast-message';
import {advertisementAPI} from '../services/advertisementAPI';
import {validatePassword} from '../utils/validate';

export default function ForgotPassword({navigation, route}: any) {
  const {email} = route.params;

  const [loading, setLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [password, setPassword] = useState('');

  async function handleResetPasswordPress() {
    if (!(verificationCode && password)) {
      Toast.show({type: 'error', text1: 'All fields are required'});
    } else if (!validatePassword(password)) {
      Toast.show({
        type: 'error',
        text1: 'Invalid password',
        text2: 'Need at least 8 characters, one letter, and one number',
      });
    } else {
      setLoading(true);
      await advertisementAPI
        .resetPasswordWithVerificationCode(email, verificationCode, password)
        .then(res => {
          // console.log('resetPasswordWithVerificationCode res:', res);
          Toast.show({type: 'success', text1: 'Successfully reset password'});
          setLoading(false);
          navigation.popToTop();
        })
        .catch(err => {
          console.log('resetPasswordWithVerificationCode err:', err);
          Toast.show({type: 'error', text1: 'Password reset failed'});
        });
      setLoading(false);
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
            onPress={() => navigation.popToTop()}>
            <Text>Sign In</Text>
          </TouchableHighlight>
          <Text style={styles.signInText}>Reset Password.</Text>
          <View>
            <AuthInput
              onChangeText={(input: string) =>
                setVerificationCode(input.replace(/\s/g, ''))
              }
              value={verificationCode}
              label="VERIFICATION CODE"
            />
            <AuthInput
              onChangeText={setPassword}
              value={password}
              label="NEW PASSWORD"
              secureTextEntry
            />
          </View>
          <View style={authStyles.divider} />
          <TouchableOpacity
            style={styles.darkButton}
            disabled={loading}
            onPress={() => handleResetPasswordPress()}>
            <Text style={styles.darkButtonText}>
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
