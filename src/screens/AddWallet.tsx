import {useEffect, useState} from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Modal,
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
import EncryptedStorage from 'react-native-encrypted-storage';
import {setWalletAddress, setSkipWalletAddress} from '../redux/slices/userSlice';
import {useAppDispatch, useAppSelector} from '../redux/hooks';
import {web3Client} from '../services/web3Client';
import sizes from '../constants/sizes';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LogOutModal from '../components/LogOutModal';

export default function AddWallet({navigation}: any) {
  const [privateKey, setPrivateKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const [logOutModalVisible, setLogOutModalVisible] = useState(false);

  // const [previousPrivateKey, setPreviousPrivateKey] = useState("");
  
  const userName = useAppSelector(state => state.user.userName);

  useEffect(() => {
    try {
      EncryptedStorage.getItem("pk_"+userName).then(async res => {
        if (res) {
          setPrivateKey(res);
          // Toast.show({ type: "info", text1: ""})
        }
      });
    } catch (e) {
      console.log("error on retreiving pk:", e);
    }
  }, []);
  
  useEffect(() => {
    navigation.addListener('beforeRemove', (e: any) => {
      e.preventDefault();
    });
  }, [navigation]);

  const dispatch = useAppDispatch();

  async function handleAddWalletPress() {
    setLoading(true);
    if (!privateKey) {
      Toast.show({type: 'error', text1: 'Please enter your private key'});
      setLoading(false);
    } else {
      web3Client
        .getWalletAddress(privateKey)
        .then(res => {
          // EncryptedStorage.setItem('privateKey', privateKey);
          EncryptedStorage.setItem('pk_'+userName, privateKey);
          dispatch(setWalletAddress(res.address));
          dispatch(setSkipWalletAddress(false));
        })
        .catch(err => {
          Toast.show({type: 'error', text1: err.message});
          setLoading(false);
        });
    }
  }
  // async function handleUsePreviousWalletPress() {
  //   setPrivateKey(previousPrivateKey);
  // }

  async function handleSkipPress() {
    dispatch(setSkipWalletAddress(true));
  }

  return (
    <SafeAreaView style={authStyles.container}>
      <KeyboardAvoidingView style={{flex: 1}}>
        <ScrollView
          contentContainerStyle={authStyles.scrollViewContainer}
          keyboardShouldPersistTaps="handled">
          <TouchableOpacity
            style={localStyles.logOutIcon}
            onPress={() => {
              setLogOutModalVisible(true);
            }}>
            <Icon name="logout" size={sizes.sz_5xl} color="black" />
          </TouchableOpacity>
          <Text style={styles.signInText}>Add wallet.</Text>
          <View>
            <AuthInput
              onChangeText={setPrivateKey}
              value={privateKey}
              label="PRIVATE KEY"
              secureTextEntry
            />
            <TouchableHighlight
              underlayColor={'lightgray'}
              style={{
                ...styles.lightButton,
                ...authStyles.forgotPasswordButton,
              }}
              disabled={loading}
              onPress={() => {
                setHelpModalVisible(true);
              }}>
              <Text>Help</Text>
            </TouchableHighlight>
          </View>
          <View style={authStyles.divider} />
          <TouchableOpacity
            style={styles.darkButton}
            disabled={loading}
            onPress={() => handleAddWalletPress()}>
            <Text style={styles.darkButtonText}>
              {loading ? 'Adding Wallet...' : 'Add Wallet'}
            </Text>
          </TouchableOpacity>
          {/* <TouchableOpacity
            style={styles.darkButton}
            disabled={loading}
            onPress={() => handleUsePreviousWalletPress()}>
            <Text style={styles.darkButtonText}>Use previous wallet</Text>
          </TouchableOpacity> */}
          <TouchableOpacity
            style={[styles.darkButton, {marginTop: sizes.sz_md, backgroundColor: 'white'}]}
            disabled={loading}
            onPress={() => handleSkipPress()}>
            <Text style={[styles.darkButtonText, {color: 'gray'}]}>
              I'll set this later
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
      <Modal visible={helpModalVisible} animationType={'fade'}>
        <View style={localStyles.helpModalContainer}>
          <TouchableOpacity
            style={localStyles.helpModalCloseIcon}
            onPress={() => setHelpModalVisible(false)}>
            <Icon name="close" size={sizes.sz_3xl} color="black" />
          </TouchableOpacity>
          <Image
            source={require('../assets/images/privateKeyHelp.png')}
            style={{
              width: '69%',
              height: '69%',
              resizeMode: 'contain',
            }}
          />
          <View style={localStyles.helpModalTextContainer}>
            <Text>1) Go to "Receive" tab in Nesten Wallet app</Text>
            <Text>2) Select "Generate Private Key"</Text>
            <Text>3) Copy your Private Key</Text>
            <Text>4) Return here and paste your Private Key</Text>
          </View>
        </View>
      </Modal>
      <LogOutModal
        logOutModalVisible={logOutModalVisible}
        setLogOutModalVisible={setLogOutModalVisible}
      />
    </SafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  helpModalContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: sizes.sz_xl,
  },
  helpModalTextContainer: {
    marginTop: sizes.sz_md,
  },
  helpModalCloseIcon: {
    alignSelf: 'flex-end',
  },
  logOutIcon: {
    alignSelf: 'flex-end',
  },
});
