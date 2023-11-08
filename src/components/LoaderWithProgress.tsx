import {Modal, StyleSheet, Text, View, TouchableOpacity} from 'react-native';
import sizes from '../constants/sizes';
import * as Progress from 'react-native-progress';

export default function LoaderWithProgress(props: any) {

  // TO DO: visual progress bar

  return (
    <Modal visible={props.visible} transparent={true}>
      <View style={localStyles.container}>
        {/* <ActivityIndicator color={'darkslateblue'} style={{marginTop:sizes.sz_sm}} size="large" /> */}
        <Text style={localStyles.textbox}>{props.message}</Text>
        <Progress.Bar indeterminate={props.indeterminate} progress={Number(props.progress)} color={'darkslateblue'}  width={150} height={5} style={{marginVertical:8}} />
        { props.cancelAction &&
        <TouchableOpacity style={localStyles.cancelButton} onPress={props.cancelAction}>
          <Text style={localStyles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        }
      </View>
    </Modal>
  );
}

const localStyles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: 'white',
    width: '60%',
    paddingVertical: sizes.sz_xl,
    paddingHorizontal: sizes.sz_md,
    position: 'absolute',
    top: '50%',
    transform: [{translateY: -50}],
  },
  textbox: {
    color: 'black',
    fontSize: sizes.sz_lg,
  },
  cancelButton: {
    backgroundColor: 'darkslateblue',
    paddingHorizontal: sizes.sz_xl,
    paddingVertical: 4,
    borderRadius: 5,
    marginTop: sizes.sz_xl,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: sizes.sz_sm,
  },
});
