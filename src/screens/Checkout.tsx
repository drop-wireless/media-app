import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Video from 'react-native-video';
import sizes from '../constants/sizes';
import {advertisementAPI} from '../services/advertisementAPI';
import {styles} from './styles/styles';
import Toast from 'react-native-toast-message';
import {web3Client} from '../services/web3Client';
import {useEffect, useState} from 'react';
import {useAppDispatch, useAppSelector} from '../redux/hooks';
import {updateCredits} from '../redux/slices/userSlice';
import { useIsFocused } from '@react-navigation/native';
import LoaderWithProgress from '../components/LoaderWithProgress';

export default function Checkout({navigation, route}: any) {
  const {gateway, startTimeInMilliseconds, duration, mediaFile} = route.params;
  const startTime = new Date(startTimeInMilliseconds);
  const total = gateway.cost * duration;
  const durationHours = duration / 60;

  const userName = useAppSelector(state => state.user.userName);
  let credits = useAppSelector(state => state.user.credits);
  const walletAddress = useAppSelector(state => state.user.walletAddress);

  const endTime = new Date(startTime.getTime() + duration * 60000);

  const [loading, setLoading] = useState(false);
  const [tokenName, setTokenName] = useState('Credits'); // useState('NIT');
  const [uploadPercentage, setUploadPercentage] = useState(0);
  const [loaderMessage, setLoaderMessage] = useState('');
  const [loaderIndetermenate, setLoaderIndetermenate] = useState(true);

  const dispatch = useAppDispatch();

  const [gasFee, setGasFee] = useState("-");

  const [balances, setBalances] = useState<any[string]>([]);

  const isFocused = useIsFocused();

  useEffect(() => {
    estimateGasFee();
    // loadBalances();
  }, []);

  useEffect(() => {
    loadBalances();
  }, [isFocused])

  // useEffect(() => {
  //   let newBalanceStatement: string = `${balances[tokenName]} ${tokenName}`;
  //   if (tokenName === "DWIN") {
  //     newBalanceStatement += `, ${balances["IOTX"]} IOTX`
  //   }
  //   setBalanceStatement(newBalanceStatement);
  // }, [tokenName]);

  useEffect(() => {
    console.log('uploadPercentage:', uploadPercentage);
  }, [uploadPercentage]);

  async function loadBalances() {
    console.log('updating balances', balances);
    // setBalances([]);
    let newBalances: any[string] = {};
    if (walletAddress) {
      newBalances["DWIN"] = await web3Client.getBalance("DWIN", walletAddress);
      newBalances["IOTX"] = await web3Client.getBalance("IOTX", walletAddress);
      newBalances["NIT"] = await web3Client.getBalance("NIT", walletAddress);
    }
    await refreshCredits();
    newBalances["Credits"] = credits;
    setBalances(newBalances);
    console.log('updated balances', newBalances);
  }
  async function estimateGasFee() {
    if (walletAddress) {
      const estimatedGasFee = await web3Client.estimateGas(
        'DWIN',
        walletAddress,
        duration * gateway.cost,
      );
      setGasFee(estimatedGasFee || "-");
    }
  }

  async function refreshCredits() {
    try {
      const currentCredit = Number((await advertisementAPI.getCredits(userName)).data);
      console.log("currentCredit:", currentCredit);
      dispatch(updateCredits(currentCredit));
      credits = currentCredit;
    } catch (e) {
      console.log("Exception on refreshing credit balance", e);
      Toast.show({type: 'error', text1: 'An error occured', text2: 'Please try again'});
    }
  }

  async function handleCheckoutPress() {
    // // uncomment below to skip actual checkout for debug
    // navigation.navigate('ReservationNavigator', {screen: 'Reservations', params: { tabName: 'Upcoming' }});
    // return;

    setLoading(true);
    setLoaderMessage("Checking out...");
    if (!walletAddress && tokenName !== "Credits") { // No wallet attached
      // TO DO: intended.... for...
      // Toast.show({type: 'info', text1: `Zero ${tokenName} Balance`, text2: `Either deposit ${tokenName} or use Drop Credits`});
      Toast.show({type: 'info', text1: `No wallet linked for ${tokenName}`, text2: `Link your wallet from Profile tab, or use Drop Credits`});
      setLoading(false);
      return;
    }
    // TO DO: check all balances before insert rows...... Credits only for now
    if (tokenName === "Credits") {
      await refreshCredits();
      if (credits < total) {
        Toast.show({
          type: 'error',
          text1: 'Insufficient Credits',
          text2: 'You can top up Drop Credits from Profile tab',
        });
        setLoading(false);
        return;
      }
    }
    await advertisementAPI
      .reservationCheck(startTime, durationHours, gateway.id)
      .then(async res => {
        console.log('reservationCheck complete');
        // reservation time available
        // console.log('reservationCheck res:', res);
        await advertisementAPI
          .getGateway(gateway.id)
          .then(async res => {
            console.log('getGateway complete');
            // console.log('getGateway res:', res);
            const escrow = res.data.escrow;
            // await advertisementAPI.payWithCredits(userName, total)).data
            // console.log('escrow:', escrow);
            const txHash = tokenName === "Credits" ? 
              (await advertisementAPI.payWithCredits(userName, total)).data
              :
              await web3Client.transferToken(
                tokenName,
                walletAddress,
                escrow.address,
                total,
                userName
              );
            console.log('transferToken complete');
            const paymentData = {
              fromadd: walletAddress,
              amount: total,
              escrow_id: escrow.id,
              escrowTxhash: txHash,
            };
            console.log('paymentData', paymentData);
            await advertisementAPI.paymentCheck(paymentData);
            console.log('paymentCheck complete');
            let reservationData = new FormData();
            reservationData.append('file', {
              uri: mediaFile.encoded ? "file://" + mediaFile.uri : mediaFile.uri,
              type: mediaFile.type,
              name: mediaFile.name,
            });
            console.log("reservation data file:", {
              uri: mediaFile.encoded ? "file://" + mediaFile.uri : mediaFile.uri,
              type: mediaFile.type,
              name: mediaFile.name,
            });
            reservationData.append('startTime', startTime.toISOString());
            reservationData.append('duration', durationHours);
            reservationData.append('gatewayId', gateway.id);
            reservationData.append('userName', userName);
            reservationData.append('escrowId', escrow.id);
            reservationData.append('token_name', tokenName);
            // console.log("reservation data:", reservationData);
            try {
              setLoaderIndetermenate(false);
              setLoaderMessage("Uploading media...");
              await advertisementAPI.makeReservation(
                reservationData,
                setUploadPercentage,
              );
              console.log('makeReservation complete');
              Toast.show({
                type: 'success',
                text1: 'Payment complete. Reservation scheduled.',
              });
            } catch (makeReservationError: any) { // already paid to escrow, but failed to make reservation, due to schedule conflict, most likely
              console.log("makeReservation error:", makeReservationError);
              if (makeReservationError.response)
                console.log("makeReservation error body:", makeReservationError.response.data);
              Toast.show({
                type: 'error',
                text1: 'Failed to make a reservation',
                text2: 'Any payment made will be refunded soon.',
              });
              try {
                console.log("asking refund");
                await advertisementAPI.askRefund(escrow.id);
                console.log("refund ask completed");
              } catch (askRefundError) {
                console.log("askRefundError error:", askRefundError);
              }
            }
            // navigation.navigate('ReservationNavigator');
            // always go to the screen, and set nested tab with nested params
            navigation.navigate('ReservationNavigator', {screen: 'Reservations', params: { tabName: 'Upcoming' }});
          })
          .catch(err => {
            console.log('Checkout err:', err);    /// need to refund if failed to ...? this is most likely caused by failed to make payments
            Toast.show({
              type: 'error',
              text1: 'An error occured',
              text2: 'Please try again',
            });
          });
      })
      .catch(err => {
        // reservation time unavailable
        console.log('reservationCheck err:', err);
        Toast.show({
          type: 'error',
          text1: 'Requested time unavailable',
          text2: 'Please select a different time',
        });
      });
    loadBalances(); // in case of staying on the same screen
    setLoading(false);
  }

  return (
    <SafeAreaView style={localStyles.container}>
      <ScrollView
        style={{paddingRight: sizes.sz_xl, marginBottom: sizes.sz_sm}}>
        <View style={styles.mediaContainer}>
          {isFocused && mediaFile.type.startsWith('video') && (
            <Video
              key={"CheckoutVideo"}
              source={{uri: mediaFile.uri}}
              resizeMode="cover"
              controls={true}
              style={styles.fullSize}
            />
          )}
          {mediaFile && mediaFile.type.startsWith('image') && (
            <Image
              source={{uri: mediaFile.uri}}
              resizeMode="cover"
              style={styles.fullSize}
            />
          )}
        </View>
        <View style={localStyles.tokenSelectionContainer}>
          <TouchableOpacity
            style={{
              ...styles.darkButton,
              width: '22%',
              opacity: tokenName === 'Credits' ? 1 : 0.69,
              padding: sizes.sz_xs
            }}
            onPress={() => setTokenName('Credits')}>
            <Text style={styles.darkButtonText}>{"Drop\nCredits"}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              ...styles.darkButton,
              width: '22%',
              opacity: tokenName === 'DWIN' ? 1 : 0.69,
            }}
            onPress={() => setTokenName('DWIN')}>
            <Text style={styles.darkButtonText}>DWIN</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              ...styles.darkButton,
              width: '22%',
              opacity: tokenName === 'NIT' ? 1 : 0.69,
            }}
            onPress={() => setTokenName('NIT')}>
            <Text style={styles.darkButtonText}>NIT</Text>
          </TouchableOpacity>
        </View>
        <View style={localStyles.costContainer}>
          <Text style={styles.titleText}>Cost</Text>
          <Text style={styles.subtitleText}>
            {gateway.cost} {tokenName} / minute
          </Text>
        </View>
        <View style={localStyles.timeBoxesContainer}>
          <View style={localStyles.timeBox}>
            <Text style={localStyles.timeLabelText}>Start Time</Text>
            <Text>{startTime.toLocaleDateString()}</Text>
            <Text>
              {startTime.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
          <View style={localStyles.timeBox}>
            <Text style={localStyles.timeLabelText}>End Time</Text>
            <Text>{endTime.toLocaleDateString()}</Text>
            <Text>
              {endTime.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        </View>
        {/* <Text>Paying to</Text>
      <Text>{gateway.owner}</Text> */}
        <View style={localStyles.costContainer}>
          <Text style={styles.titleText}>Total</Text>
          <Text style={styles.subtitleText}>
            {total} {tokenName}
          </Text>
          { balances[tokenName] != null ? 
          (
            tokenName === 'DWIN' ? (
              <>
              <Text style={{color: 'black'}}>Estimated gas fee: {gasFee} IOTX</Text>
              <Text style={{color: 'black', marginTop: 10}}>Balance: {balances['DWIN']} DWIN, {balances['IOTX']} IOTX</Text>
              </>
            ) :
            (
              <Text style={{color: 'black', marginTop: 10}}>Balance: {balances[tokenName]} {tokenName}</Text>
            )
          ) : null
          }
          {/* {tokenName === "Credits" && 
                  <TouchableOpacity><Icon name="add-box" size={sizes.sz_md} color="gray" /></TouchableOpacity>} */}
        </View>
      </ScrollView>
        <TouchableOpacity
          style={styles.bottomDarkButton}
          onPress={() => handleCheckoutPress()}>
          <Text style={styles.darkButtonText}>Checkout</Text>
        </TouchableOpacity>
      {/* <Loader visible={loading} /> */}
      <LoaderWithProgress visible={loading} message={loaderMessage} progress={uploadPercentage/100} cancelAction={null} indeterminate={loaderIndetermenate} />
    </SafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  timeBox: {
    borderWidth: 2,
    borderColor: 'gray',
    borderRadius: 10,
    padding: sizes.sz_md,
    justifyContent: 'center',
    alignItems: 'center',
    width: '40%',
    marginHorizontal: sizes.sz_sm,
  },
  timeBoxesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: sizes.sz_2xl,
  },
  timeLabelText: {
    color: 'red',
    fontSize: sizes.sz_lg,
  },
  costContainer: {
    alignSelf: 'flex-start',
    marginLeft: sizes.sz_4xl,
  },
  tokenSelectionContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: sizes.sz_sm,
  },
});
