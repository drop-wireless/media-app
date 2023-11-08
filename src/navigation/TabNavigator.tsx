import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {Image} from 'react-native';
import sizes from '../constants/sizes';
import Map from '../screens/Map';
import Profile from '../screens/Profile';
import ReservationDetails from '../screens/ReservationDetails';
import Reservations from '../screens/Reservations';

const Tab = createBottomTabNavigator();
const ReservationStack = createNativeStackNavigator();
function ReservationNavigator({navigation, route}: any) {
  return (
    <ReservationStack.Navigator>
      <ReservationStack.Screen
        name="Reservations"
        component={Reservations}
        options={{headerShown: false}}
      />
      <ReservationStack.Screen
        name="ReservationDetails"
        component={ReservationDetails}
        options={{title: 'Reservation Details'}}
      />
    </ReservationStack.Navigator>
  );
}

export default function TabNavigator({navigation}: any) {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {height: sizes.screenHeight / 10},
        tabBarIcon: ({focused, color, size}) => {
          let icon;
          if (route.name === 'Map') {
            icon = focused
              ? require('../assets/icons/home_active.png')
              : require('../assets/icons/home.png');
          } else if (route.name === 'ReservationNavigator') {
            icon = focused
              ? require('../assets/icons/reservation_active.png')
              : require('../assets/icons/reservation.png');
          } else if (route.name === 'Profile') {
            icon = focused
              ? require('../assets/icons/profile_active.png')
              : require('../assets/icons/profile.png');
          }
          return (
            <Image
              source={icon}
              style={{height: '100%', width: sizes.screenWidth / 3}}
            />
          );
        },
      })}>
      <Tab.Screen name="Map" component={Map} />
      <Tab.Screen
        name="ReservationNavigator"
        component={ReservationNavigator}
      />
      <Tab.Screen name="Profile" component={Profile} />
    </Tab.Navigator>
  );
}
