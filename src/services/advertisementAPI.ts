import axios from 'axios';
import Config from 'react-native-config';

const baseURL = Config.AD_API;

const axiosClient = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  }
});
const axiosClientWithTimeout = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000
});

export const advertisementAPI = {
  signIn(userName: string, password: string) {
    const body = {userName, password};
    return axiosClientWithTimeout.post('user/login', body);
  },
  registerUser(username: string, email: string, password: string) {
    const body = {
      userName: username,
      email: email,
      password: password,
      address: '',
    };
    return axiosClient.post('user/register', body);
  },
  getVerificationCode(email: string) {
    const body = {userName: email}; // this is confusing
    return axiosClient.post('user/forgotPassword', body);
  },
  resetPasswordWithVerificationCode(
    email: string,
    verificationCode: string,
    password: string,
  ) {
    const body = {
      userName: email, // this is confusing
      verificationCode: verificationCode,
      newPassword: password,
    };
    return axiosClient.post('user/confirmPassword', body);
  },
  getAllGateways() {
    return axiosClient.get('sensor');
  },
  getGateway(gatewayId: string) {
    return axiosClient.get('sensor/sensorid/' + gatewayId);
  },
  getFutureReservationTimes(gatewayId: string) {
    return axiosClient.get('reservation/futureReservationTimes/' + gatewayId);
  },
  reservationCheck(startTime: Date, duration: number, gatewayId: string) {
    const body = {
      reservationtimestamp: startTime.toISOString(),
      duration: duration,
      gateway_id: gatewayId,
    };
    return axiosClient.post('reservation/check', body);
  },
  paymentCheck(paymentData: any) {
    return axiosClient.post('payment', paymentData);
  },
  makeReservation(reservationData: any, setUploadPercentage: any) {
    const headers = {
      'Content-Type': 'multipart/form-data',
      new_upload: true,
    };
    return axiosClient.post('upload/uploadfile', reservationData, {
      headers,
      onUploadProgress: progressEvent => {
        console.log('progressEvent.loaded:', progressEvent.loaded);
        console.log('progressEvent.total:', progressEvent.total);
        console.log('progressEvent.progress:', progressEvent.progress);
        setUploadPercentage(
          progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0,
        );
      },
    });
  },
  getOngoingBookings(userName: string, slice: number) {
    return axiosClient.get(
      `reservation/myongoingbookings/${userName}/${slice}/10`,
    );
  },
  getUpcomingBookings(userName: string, slice: number) {
    return axiosClient.get(
      `reservation/myupcomingbookings/${userName}/${slice}/10`,
    );
  },
  getPastBookings(userName: string, slice: number) {
    return axiosClient.get(
      `reservation/mypastbookings/${userName}/${slice}/10`,
    );
  },
  deleteAccount(userName: string, password: string) {
    return axiosClient.post("user/deleteAccount", {userName, password});
  },
  getCredits(username: string) {
    return axiosClient.post("credits", {username});
  },
  purchaseCredits(username: string, platform: string, receipt: string) {
    return axiosClient.post("credits/purchase", { username, receipt, platform });
  },
  payWithCredits(username: string, amount: number) {
    return axiosClient.post("credits/payment", { username, amount });
  },
  askRefund(escrowID: string) {
    return axiosClient.post("payment/refund", { escrow_id: escrowID });
  }
};
