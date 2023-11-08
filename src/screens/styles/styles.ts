import {StyleSheet} from 'react-native';
import sizes from '../../constants/sizes';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
  },
  containerUncentered: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'white',
  },
  fullSize: {
    width: '100%',
    height: '100%',
  },
  darkButton: {
    backgroundColor: 'darkslateblue',
    padding: sizes.sz_xl,
    borderRadius: 5,
  },
  darkButtonText: {
    color: 'white',
    alignSelf: 'center',
    fontWeight: 'bold',
  },
  bottomDarkButton: {
    backgroundColor: 'darkslateblue',
    padding: sizes.sz_xl,
    borderRadius: 5,
    width: '90%',
    marginTop: 'auto',
    marginBottom: sizes.sz_md,
    alignSelf: 'center',
  },
  lightButton: {
    alignItems: 'center',
    padding: sizes.sz_xl,
  },
  signInText: {
    fontFamily: 'PlayfairDisplay-ExtraBold',
    fontSize: sizes.sz_3xl,
    marginLeft: sizes.sz_xl,
    alignSelf: 'flex-start',
    color: 'black',
  },
  titleText: {
    fontSize: sizes.sz_xl,
    fontWeight: 'bold',
    color: 'black',
  },
  subtitleText: {
    fontSize: sizes.sz_lg,
    fontWeight: 'bold',
    color: 'black',
  },
  mediaContainer: {
    width: '100%',
    height: sizes.screenHeight / 4,
    marginBottom: sizes.sz_xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logOutModalContainer: {
    alignSelf: 'center',
    justifyContent: 'center',
    borderRadius: 5,
    backgroundColor: '#eeeeee',
    width: '80%',
    padding: sizes.sz_md,
    position: 'absolute',
    top: '50%',
    transform: [{translateY: -50}],
  },
  logOutConfirmationText: {
    alignSelf: 'center',
    color: 'black',
    fontSize: sizes.sz_xl,
    textAlign: 'center',
    marginVertical: sizes.sz_md,
  },
  loaderModal: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderModalContainer: {
    alignSelf: 'center',
    justifyContent: 'center',
    borderRadius: 5,
    backgroundColor: '#eeeeee',
    width: '80%',
    padding: sizes.sz_md,
  },
});
