import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useAppDispatch, useAppSelector} from '../redux/hooks';
import AddWallet from '../screens/AddWallet';
import Checkout from '../screens/Checkout';
import Scheduler from '../screens/Scheduler';
import UploadMedia from '../screens/UploadMedia';
import TabNavigator from './TabNavigator';

import {
  initConnection,
  purchaseErrorListener,
  purchaseUpdatedListener,
  type ProductPurchase,
  type PurchaseError,
  flushFailedPurchasesCachedAsPendingAndroid,
  finishTransaction,
  getProducts,
  // SubscriptionPurchase,
} from 'react-native-iap';
import iap from '../constants/iap';
import { advertisementAPI } from '../services/advertisementAPI';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { updateCredits } from '../redux/slices/userSlice';
import Toast from 'react-native-toast-message';

const Stack = createNativeStackNavigator();

export default function HomeNavigator() {
  const walletAddress = useAppSelector(state => state.user.walletAddress);
  const skipWalletAddress = useAppSelector(state => state.user.skipWalletAddress);


  let purchaseUpdateSubscription : any = null;
  let purchaseErrorSubscription : any = null;
  
  const userName = useAppSelector(state => state.user.userName);
  const signedIn = useAppSelector(state => state.user.signedIn);
  const dispatch = useAppDispatch();

  useEffect(() => {
    console.log("app lodaed");
    initIAP();
    return (() => {
      console.log("app unlodaed");
      clearIAPListeners();
    });
  }, []);

  async function initIAP() {
    console.log("IAP:initializing");
    await initConnection();
    console.log("IAP:initialized");
    if (Platform.OS === 'android') {
      try {
        // we make sure that "ghost" pending payment are removed
        // (ghost = failed pending payment that are still marked as pending in Google's native Vending module cache)
        await flushFailedPurchasesCachedAsPendingAndroid();
        console.log("IAP:flushFailedPurchasesCachedAsPendingAndroid:done");
      } catch (e) {
        // exception can happen here if:
        // - there are pending purchases that are still pending (we can't consume a pending purchase)
        // in any case, you might not want to do anything special with the error
        console.error("IAP:", e);
      }
    }
    purchaseUpdateSubscription = purchaseUpdatedListener(
      async (purchase: ProductPurchase) => {
        console.log("IAP:purchaseUpdatedListener", purchase);

        const receipt = purchase.transactionReceipt;
        if (receipt) {
          console.log("IAP:receipt:", receipt);
          if (signedIn && userName) {
            try {
              Toast.show({type: 'success', text1: 'Verifying purchase...'});
              await advertisementAPI.purchaseCredits(userName, Platform.OS, receipt);
              // Tell the store that you have delivered what has been paid for.
              // Failure to do this will result in the purchase being refunded on Android and
              // the purchase event will reappear on every relaunch of the app until you succeed
              // in doing the below. It will also be impossible for the user to purchase consumables
              // again until you do this.
              await finishTransaction({purchase, isConsumable: true});
              const newCredits = await advertisementAPI.getCredits(userName);
              dispatch(updateCredits(Number(newCredits.data)));
              Toast.show({type: 'success', text1: 'Successfully purchased Drop Credits'});
            } catch (e) {
              console.log("IAP: failed to verify receipt from server:", e);
              Toast.show({type: 'error', text1: 'Failed to get purchase verification'});
              //       // Retry / conclude the purchase is fraudulent, etc...
            }
          }
          else {
            console.log("IAP:not logged in for the IAP transaction:", purchase, receipt, userName);
            Toast.show({type: 'error', text1: 'There is unhandled purchase, please log in'});
          }
        }
      },
    );

    purchaseErrorSubscription = purchaseErrorListener(
      (error: PurchaseError) => {
        console.log('IAP:purchaseErrorListener', error);
      },
    );
    console.log("IAP:listeners added");
    const products = await getProducts({ skus: [iap.productID] });
    console.log("IAP products:", products);
    console.log("IAP:product:" + iap.productID);
  }
  async function clearIAPListeners() {
    if (purchaseUpdateSubscription) {
      purchaseUpdateSubscription.remove();
      purchaseUpdateSubscription = null;
    }

    if (purchaseErrorSubscription) {
      purchaseErrorSubscription.remove();
      purchaseErrorSubscription = null;
    }
    console.log("IAP:listeners removed");
  }


  return (
    <Stack.Navigator>
      {(!walletAddress && !skipWalletAddress) && (
        <Stack.Screen
          name="AddWallet"
          component={AddWallet}
          options={{headerShown: false}}
        />
      )}
      <Stack.Screen
        name="Home"
        component={TabNavigator}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="Scheduler"
        component={Scheduler}
        options={{title: 'Select a Time'}}
      />
      <Stack.Screen
        name="UploadMedia"
        component={UploadMedia}
        options={{title: 'Upload Media'}}
      />
      <Stack.Screen name="Checkout" component={Checkout} />
    </Stack.Navigator>
  );
}
