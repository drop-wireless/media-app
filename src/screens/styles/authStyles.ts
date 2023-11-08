import {StyleSheet} from 'react-native';
import sizes from '../../constants/sizes';

export const authStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollViewContainer: {
    flexGrow: 1,
    padding: sizes.sz_2xl,
  },
  registerButton: {
    alignSelf: 'flex-end',
  },
  forgotPasswordButton: {
    marginTop: sizes.sz_4xl,
  },
  inputContainer: {
    marginVertical: sizes.sz_3xl,
    justifyContent: 'space-evenly',
    height: sizes.screenHeight * 0.4,
  },
  divider: {
    height: 4,
    width: '69%',
    marginVertical: sizes.sz_4xl,
    alignSelf: 'center',
    backgroundColor: 'aliceblue',
  },
});
