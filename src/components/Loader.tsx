import {ActivityIndicator, Modal, StyleSheet, Text, View} from 'react-native';
import sizes from '../constants/sizes';

export default function Loader(props: any) {
  return (
    <Modal visible={props.visible} transparent={true}>
      <View style={localStyles.container}>
        <ActivityIndicator size="large" />
        <Text>Please wait...</Text>
      </View>
    </Modal>
  );
}

const localStyles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 5,
    backgroundColor: 'white',
    width: '50%',
    padding: sizes.sz_md,
    position: 'absolute',
    top: '50%',
    transform: [{translateY: -50}],
  },
});
