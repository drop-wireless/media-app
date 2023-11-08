import {Modal, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import sizes from '../constants/sizes';
import {useAppDispatch} from '../redux/hooks';
import {logOut} from '../redux/slices/userSlice';
import {styles} from '../screens/styles/styles';

export default function LogOutModal({
  logOutModalVisible,
  setLogOutModalVisible,
}: any) {
  const dispatch = useAppDispatch();

  function handleLogOutPress() {
    dispatch(logOut());
  }

  return (
    <Modal
      visible={logOutModalVisible}
      transparent={true}
      animationType={'fade'}>
      <View style={styles.logOutModalContainer}>
        <Text style={styles.logOutConfirmationText}>
          Are you sure you want to log out?
        </Text>
        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
          <TouchableOpacity
            style={localStyles.button}
            onPress={() => setLogOutModalVisible(false)}>
            <Text>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={localStyles.button}
            onPress={() => handleLogOutPress()}>
            <Text>Log Out</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const localStyles = StyleSheet.create({
  button: {
    padding: sizes.sz_md,
  },
});
