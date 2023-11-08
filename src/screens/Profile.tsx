import {
  ActivityIndicator,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import sizes from '../constants/sizes';
import {useAppDispatch, useAppSelector} from '../redux/hooks';
import {styles} from './styles/styles';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useEffect, useState} from 'react';
import LogOutModal from '../components/LogOutModal';
import {setSkipWalletAddress, setWalletAddress, updateCredits} from '../redux/slices/userSlice';
import {web3Client} from '../services/web3Client';
import {ScrollView} from 'react-native-gesture-handler';
import AuthInput from '../components/AuthInput';
import {logOut} from '../redux/slices/userSlice';
import {advertisementAPI} from '../services/advertisementAPI';
import Toast from 'react-native-toast-message';
import {useIsFocused} from '@react-navigation/native';
import iap from '../constants/iap';
import Config from 'react-native-config';
import EncryptedStorage from 'react-native-encrypted-storage';

import { requestPurchase } from 'react-native-iap';

export default function Profile({navigation}: any) {
  const userName = useAppSelector(state => state.user.userName);
  const email = useAppSelector(state => state.user.email);
  const walletAddress = useAppSelector(state => state.user.walletAddress);
  const skipWalletAddress = useAppSelector(state => state.user.skipWalletAddress);
  const dropCredits = useAppSelector(state => state.user.credits);

  const [logOutModalVisible, setLogOutModalVisible] = useState(false);
  const [editWalletModalVisible, setEditWalletModalVisible] = useState(false); 
  const [deleteAccountModalVisible, setDeleteAccountModalVisible] = useState(false);
  const [balances, setBalances] = useState({nit: '', dwin: '', iotx: ''});

  const [loadingBalance, setLoadingBalance] = useState(false);
  const [loadingCredit, setLoadingCredit] = useState(false);
  // const [dropCredits, setDropCredits] = useState(0);

  const [iapProcessing, setIAPProcessing] = useState(false);

  const isTabFocused = useIsFocused();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (isTabFocused) {
      getBalances();
      getCredits();
    }
  }, [isTabFocused]);

  useEffect(() => {
    if (!walletAddress && !skipWalletAddress) {
      setEditWalletModalVisible(false);
      navigation.navigate('AddWallet');
    }
  }, [walletAddress, skipWalletAddress]);

  async function getBalances() {
    if (walletAddress) {
      setLoadingBalance(true);
      const nitBalance = await web3Client.getBalance('NIT', walletAddress);
      const dwinBalance = await web3Client.getBalance('DWIN', walletAddress);
      const iotxBalance = await web3Client.getBalance('IOTX', walletAddress);
      setBalances({
        nit: nitBalance ? nitBalance : '',
        dwin: dwinBalance ? dwinBalance : '',
        iotx: iotxBalance ? iotxBalance : '',
      });
    }
    setLoadingBalance(false);
  }

  async function getCredits() {
    setLoadingCredit(true);
    try {
      const response = await advertisementAPI.getCredits(userName);
      dispatch(updateCredits(Number(response.data)));
      // dispat
    } catch (e) {
      console.log("Exception while getting credits", e);
    }

    setLoadingCredit(false);
  }

  async function purchase(sku: string)  {
    console.log("IAP: initiating purchase", sku);
    setIAPProcessing(true);
    try {
      await requestPurchase({
        sku,
        skus: [sku],
        andDangerouslyFinishTransactionAutomaticallyIOS: false,
      });
      console.log("IAP: purchase completed.");
      // Below will be done on purchaeUpdateListener
      // Toast.show({type: 'success', text1: 'Successfully purchased Drop Credits'});
      // getCredits();
    } catch (err: any) {
      console.log("IAP: purchase failed: ", err.code, err.message);
      Toast.show({type: 'error', text1: 'Purchase canceled.'});
    }
    setIAPProcessing(false);
  };

  function handleEditWalletAddressPress() {
    if (!walletAddress)
      dispatch(setSkipWalletAddress(false));
    else
      setEditWalletModalVisible(true);
  }

  return (
    <SafeAreaView style={localStyles.container}>
      <View style={localStyles.subContainer}>
        <View style={localStyles.header}>
          <Icon name="logout" size={sizes.sz_5xl} color="rgba(0,0,0,0)" />
          <Text style={localStyles.profileText}>Profile</Text>
          <TouchableOpacity
            onPress={() => {
              setLogOutModalVisible(true);
            }}>
            <Icon name="logout" size={sizes.sz_5xl} color="black" />
          </TouchableOpacity>
        </View>
        <ScrollView
          style={{marginBottom: sizes.screenHeight / 5}}
          showsVerticalScrollIndicator={false}
        >
        {/* <ScrollView style={{marginBottom: sizes.screenHeight/2}}> */}
          <View style={localStyles.userInfoItem}>
            <Text style={styles.titleText}>Username</Text>
            <Text style={localStyles.userInfoText}>{userName}</Text>
          </View>
          <View style={localStyles.userInfoItem}>
            <Text style={styles.titleText}>Email</Text>
            <Text style={localStyles.userInfoText}>{email}</Text>
          </View>
          <View style={localStyles.userInfoItem}>
            <Text style={styles.titleText}>Wallet Address</Text>
            <View style={localStyles.rowCenterAligned}>
              <Icon name="edit" size={sizes.sz_2xl} color="rgba(0,0,0,0)" />
              <Text style={localStyles.userInfoText}>{walletAddress || "-"}</Text>
              <TouchableOpacity onPress={handleEditWalletAddressPress}>
                <Icon name="edit" size={sizes.sz_2xl} color="gray" />
              </TouchableOpacity>
            </View>
          </View>
          { walletAddress &&
            <View style={localStyles.userInfoItem}>
              <View style={localStyles.rowCenterAligned}>
                <Text style={styles.titleText}>Wallet Balance</Text>
                {/* <TouchableOpacity onPress={() => getBalances()}>
                  <Icon name="refresh" size={sizes.sz_2xl} color="gray" />
                </TouchableOpacity> */}
              </View>
              <View style={localStyles.balanceContainer}>
                <Text style={{...localStyles.userInfoText, fontWeight: 'bold'}}>
                  NIT
                </Text>
                <Text style={localStyles.userInfoText}>{loadingBalance ? '-' : balances.nit}</Text>
              </View>
              <View style={localStyles.balanceContainer}>
                <Text style={{...localStyles.userInfoText, fontWeight: 'bold'}}>
                  DWIN
                </Text>
                <Text style={localStyles.userInfoText}>{loadingBalance ? '-' : balances.dwin}</Text>
              </View>
              <View style={localStyles.balanceContainer}>
                <Text style={{...localStyles.userInfoText, fontWeight: 'bold'}}>
                  IOTX
                </Text>
                <Text style={localStyles.userInfoText}>{loadingBalance ? '-' : balances.iotx}</Text>
              </View>
            </View>
          }
          <View style={localStyles.userInfoItem}>
            <View style={localStyles.rowCenterAligned}>
              <Text style={styles.titleText}>Drop Credits </Text>
              <TouchableOpacity onPress={() => purchase(iap.productID)}>
                <Icon name="add-box" size={sizes.sz_2xl} color="gray" />
              </TouchableOpacity>
            </View>
            <View style={localStyles.rowCenterAligned}>
              <View style={localStyles.balanceContainer}>
                <Text style={localStyles.userInfoText}>{loadingCredit ? '-' : dropCredits}</Text>
              </View>
              {/* <TouchableOpacity
                style={{alignSelf: 'center'}}
                onPress={() => setDeleteAccountModalVisible(true)}>
                <Icon name="add" size={sizes.sz_2xl} color="black" />
              </TouchableOpacity> */}
            </View>
          </View>
          <View style={[localStyles.userInfoItem]}>
            <Text style={styles.titleText}>App Version</Text>
            <Text style={localStyles.userInfoText}>{Config.APP_VERSION}</Text>
          </View>
          <TouchableOpacity
            style={{alignSelf: 'center', marginTop: sizes.sz_5xl}}
            onPress={() => setDeleteAccountModalVisible(true)}>
            <Text>Delete Account</Text>
          </TouchableOpacity>
          {/* <View style={[localStyles.userInfoItem, {marginTop: sizes.sz_12xl}]}>
            <Text style={localStyles.userInfoText}>v1.2.1</Text>
          </View> */}
        </ScrollView>
        {/* <View style={{ position:'absolute', bottom: (sizes.screenHeight/10) + 50,  width: '100%', flexDirection: 'row', justifyContent: 'flex-end' }}>
          <Text style={{ fontSize: sizes.sz_sm }}>v1.2.1</Text>
        </View> */}
        {/* <Loader visible={iapProcessing} /> */}
        <LogOutModal
          logOutModalVisible={logOutModalVisible}
          setLogOutModalVisible={setLogOutModalVisible}
        />
        <EditWalletModal
          modalVisible={editWalletModalVisible}
          setModalVisible={setEditWalletModalVisible}
        />
        <DeleteAccountModal
          username={userName}
          modalVisible={deleteAccountModalVisible}
          setModalVisible={setDeleteAccountModalVisible}
        />
        <IAPLoaderModal 
          modalVisible={iapProcessing}
          setModalVisible={setIAPProcessing}
        />
      </View>
    </SafeAreaView>
  );
}
// All modals are pulled out from the component above.
// Nested components refresh on every state hook updates, so it may block whole screen if getBalances() updates the balances while the modal is opened.
function IAPLoaderModal({modalVisible, setModalVisible}: any) {
  return (
    <Modal visible={modalVisible} transparent={false}>
      <View style={styles.loaderModal}>
        <ActivityIndicator style={{marginBottom: "10%"}} size="large" />
        <Text>Communicating with {Platform.OS === "ios" ? "App Store" : Platform.OS === "android" ? "Play Store" : "Unknown"}</Text>
        <Text>Please wait...</Text>
      </View>
    </Modal>
  );
}
function EditWalletModal({modalVisible, setModalVisible}: any) {
  const userName = useAppSelector(state => state.user.userName);
  const walletAddress = useAppSelector(state => state.user.walletAddress);
  const dispatch = useAppDispatch();

  async function handleEditWalletPress() {
    await EncryptedStorage.removeItem("pk_"+userName);
    dispatch(setSkipWalletAddress(false));
    dispatch(setWalletAddress(''));
  }

  return (
    <Modal
      visible={modalVisible}
      transparent={true}
      animationType={'fade'}>
      <View style={styles.logOutModalContainer}>
        <Text style={styles.logOutConfirmationText}>
          You are about to unlink your wallet from this app. You will need
          your wallet's private key to re-add it. Are you sure you want to
          proceed?
        </Text>
        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
          <TouchableOpacity
            style={localStyles.button}
            onPress={() => setModalVisible(false)}>
            <Text>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={localStyles.button}
            onPress={() => handleEditWalletPress()}>
            <Text>Edit Wallet</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
function DeleteAccountModal({username, modalVisible, setModalVisible}: any) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const dispatch = useAppDispatch();

  async function handleDeleteAccount() {
    setLoading(true);
    console.log(username);
    const success = await requestDeleteAccount(username, password);
    setModalVisible(false);
    if (success) {
      dispatch(logOut());
    }
  }
  async function requestDeleteAccount(username: string, password: string) {
    try {
      const res: any = await advertisementAPI.deleteAccount(username, password);
      Toast.show({
        type: 'success',
        text1: 'Your account and associated data have been deleted',
      });
      return res.status == 200;
    }
    catch (e: any) {
      if (e.response) {
        switch (e.response.status) {
          case 401:
            console.log('wrong password/param');
            Toast.show({
              type: 'error',
              text1: 'Please check your password and try again',
            });
            break;
          case 500:
            console.log("server/cognitor error");
            Toast.show({
              type: 'error',
              text1: 'Please try again later',
            });
            break;
          default:
            console.log("unknown error on request account:", e.response.status);
            break;
        }
      }
      else {
        console.log("exception on requestDeleteAccount:", e);
      }
    }
    return false;
  }

  return (
    <Modal
      visible={modalVisible}
      transparent={true}
      animationType={'fade'}>
      <View style={{...styles.logOutModalContainer, top:'33%'}}>
        { loading ?
          <View style={styles.logOutConfirmationText}>
            <Text>
              Please wait
            </Text>
            <ActivityIndicator size="large" />
          </View>
          :
          <>
            <Text style={styles.logOutConfirmationText}>
              All related personal data and Drop Credits will be removed
            </Text>
            <Text style={styles.logOutConfirmationText}>
              This action cannot be undone
            </Text>
            <AuthInput
              onChangeText={(input: string) => { console.log(input); setPassword(input); }}
              value={password}
              label="CONFIRM PASSWORD"
              secureTextEntry
            />
            <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
              <TouchableOpacity
                style={{...localStyles.button, alignSelf: 'center'}}
                onPress={() => setModalVisible(false)}>
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{...localStyles.button, alignSelf: 'center'}}
                onPress={() => handleDeleteAccount()}>
                <Text>Delete Account</Text>
              </TouchableOpacity>
            </View>
          </>
        }
      </View>
    </Modal>
  );
}

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  subContainer: {
    marginHorizontal: sizes.sz_4xl,
  },
  profileText: {
    fontSize: sizes.sz_5xl,
    color: 'black',
    fontFamily: 'PlayfairDisplay-ExtraBold',
    marginRight: 'auto',
    marginLeft: 'auto',
  },
  userInfoItem: {
    marginBottom: sizes.sz_lg,
    marginHorizontal: sizes.sz_lg,
    alignItems: 'center',
  },
  rowCenterAligned: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    marginVertical: sizes.sz_5xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    padding: sizes.sz_md,
  },
  userInfoText: {
    color: 'black',
    fontSize: sizes.sz_md,
    paddingHorizontal: sizes.sz_xs,
  },
  balanceContainer: {
    paddingVertical: sizes.sz_2xs,
    alignItems: 'center',
  },
});
