import {Dimensions} from 'react-native';
import {getStatusBarHeight} from 'react-native-status-bar-height';

const screenSize = Dimensions.get('window');

export default {
  sz_2xs: 10,
  sz_xs: 12,
  sz_sm: 14,
  sz_md: 16,
  sz_lg: 18,
  sz_xl: 20,
  sz_2xl: 24,
  sz_3xl: 28,
  sz_4xl: 32,
  sz_5xl: 36,
  sz_6xl: 40,
  sz_7xl: 48,
  sz_8xl: 56,
  sz_9xl: 64,
  sz_10xl: 72,
  sz_11xl: 80,
  sz_12xl: 96,
  screenHeight: screenSize.height,
  screenWidth: screenSize.width,
  statusBarHeight: getStatusBarHeight(),
};
