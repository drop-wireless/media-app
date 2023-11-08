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
import {authStyles} from './styles/authStyles';
import {styles} from './styles/styles';
import EmailValidator from 'email-validator';
import {advertisementAPI} from '../services/advertisementAPI';
import {validateUsername, validatePassword} from '../utils/validate';
import sizes from '../constants/sizes';

export default function Register({navigation}: any) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function onRegisterPress() {
    setLoading(true);
    if (!(username && email && password)) {
      Toast.show({type: 'error', text1: 'All fields are required'});
    } else {
      if (!validateUsername(username)) {
        Toast.show({
          type: 'error',
          text1: 'Invalid username',
          // text2: "Alphanumeric, ., _, -, ^, *, and complete Korean letters"
        });
      } else if (!EmailValidator.validate(email)) {
        Toast.show({type: 'error', text1: 'Invalid email'});
      } else if (!validatePassword(password)) {
        Toast.show({
          type: 'error',
          text1: 'Invalid password',
          text2: 'Need at least 8 characters, one letter, and one number',
        });
      } else {
        await advertisementAPI
          .registerUser(username, email, password)
          .then(res => {
            // console.log('registerUser res:', res);
            Toast.show({
              type: 'success',
              text1: 'Please check your email to verify registration',
            });
            setLoading(false);
            navigation.goBack();
          })
          .catch(err => {
            console.log('registerUser err:', err);
            Toast.show({
              type: 'error',
              text1: 'Account registration failed',
            });
          });
      }
    }
    setLoading(false);
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
          <Text style={styles.signInText}>Register.</Text>
          <View>
            <AuthInput
              onChangeText={(input: string) =>
                setUsername(input.replace(/\s/g, ''))
              }
              value={username}
              label="USERNAME"
            />
            <AuthInput
              onChangeText={(input: string) =>
                setEmail(input.replace(/\s/g, ''))
              }
              value={email}
              label="EMAIL"
            />
            <AuthInput
              onChangeText={setPassword}
              value={password}
              label="PASSWORD"
              secureTextEntry
            />
          </View>
          <View style={authStyles.divider} />
          <Text style={localStyles.verifyInstructionsText}>
            You will need to check your email and verify the registration before
            you can log in.
          </Text>
          <TouchableOpacity
            style={{...styles.darkButton, marginTop: sizes.sz_4xl}}
            disabled={loading}
            onPress={() => onRegisterPress()}>
            <Text style={styles.darkButtonText}>
              {loading ? 'Registering...' : 'Register'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  verifyInstructionsText: {
    color: 'black',
    fontSize: sizes.sz_md,
    textAlign: 'center',
  },
});
