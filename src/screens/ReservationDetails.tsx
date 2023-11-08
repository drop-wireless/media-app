import {ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, View} from 'react-native';
import sizes from '../constants/sizes';
import {styles} from './styles/styles';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { advertisementAPI } from '../services/advertisementAPI';
import Toast from 'react-native-toast-message';
import { useState } from 'react';

export default function ReservationDetails({navigation, route}: any) {
  const {details} = route.params;
  console.log('details:', details);

  const [asking, setAsking] = useState(false);

  async function askRefund() {
    setAsking(true);
    try {
      const askRefundResult = await advertisementAPI.askRefund(details.id);
      // got 200
      details.txhash_to = askRefundResult.data.txhash_to; // "dummy hash";
      Toast.show({type: "success", text1: "Successfully refunded"});

    } catch (e) {
      console.log("asking refund on reservation details error:", e);
      Toast.show({type: "error", text1: "Failed to ask refund", text2: "Please try again later"});
    }
    // details.txhash_to = "dummy hash";
    setAsking(false);
  }

  return (
    <ScrollView>
      <SafeAreaView style={localStyles.container}>
        <View style={localStyles.detailsItem}>
          <Text style={styles.subtitleText}>G2 Port Number</Text>
          <Text>{details.port}</Text>
        </View>
        <View style={localStyles.detailsItem}>
          <Text style={styles.subtitleText}>G2 Owner</Text>
          <Text>{details.owner_address}</Text>
        </View>
        <View style={localStyles.detailsItem}>
          <Text style={styles.subtitleText}>Start Time</Text>
          <Text>{new Date(details.start_time).toLocaleString()}</Text>
        </View>
        <View style={localStyles.detailsItem}>
          <Text style={styles.subtitleText}>End Time</Text>
          <Text>{new Date(details.end_time).toLocaleString()}</Text>
        </View>
        <View style={localStyles.detailsItem}>
          <Text style={styles.subtitleText}>Cost Per Minute</Text>
          <Text>
            {details.cost} {details.token_name} / min
          </Text>
        </View>
        <View style={localStyles.detailsItem}>
          <Text style={styles.subtitleText}>Total Cost</Text>
          <Text>
            {details.amount * 0.000000000000000001} {details.token_name}
          </Text>
        </View>
        <View style={localStyles.detailsItem}>
          <Text style={styles.subtitleText}>Payment transaction</Text>
          <Text>{details.txhash_from}</Text>
          <Text>{details.txhash_to}</Text>
        </View>
        <View style={localStyles.detailsItem}>
          <Text style={styles.subtitleText}>Status</Text>
          <Text>{details.played ? 'Played' : details.txhash_to ? 'Refunded' : 'Not Played'}</Text>
        </View>
        {!details.played && !details.txhash_to && new Date(details.end_time) < new Date() ?
          <TouchableOpacity
            style={styles.bottomDarkButton}
            onPress={askRefund}
            disabled={asking}>
              <Text style={styles.darkButtonText}>{asking ? "Requesting..." : "Request a Refund"}</Text>
          </TouchableOpacity>
          // <TouchableOpacity onPress={askRefund}>
          //   {asking ? 
          //   <ActivityIndicator />
          //   :
          //   <Text>Ask Refund</Text>
          //   }
          // </TouchableOpacity>
          : null
        }
      </SafeAreaView>
    </ScrollView>
  );
}

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    margin: sizes.sz_lg,
  },
  detailsItem: {
    marginBottom: sizes.sz_lg,
  },
});
