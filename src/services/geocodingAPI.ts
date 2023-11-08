import axios from 'axios';
import Config from 'react-native-config';

const baseURL1 = Config.GEOCODING_API;
const baseURL2 = '&format=json';

const axiosClient = axios.create({
  headers: {
    'User-Agent': 'DropMedia',
  },
});

export default function locationSearch(query: string) {
  return axiosClient.get(baseURL1 + query + baseURL2);
}
