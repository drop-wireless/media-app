import Geolocation from '@react-native-community/geolocation';
import {useEffect, useReducer, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Image,
  Keyboard,
  Linking,
  PermissionsAndroid,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {Details, Marker, Region} from 'react-native-maps';
import MapView from 'react-native-map-clustering';
import LocationSearchBar from '../components/LocationSearchBar';
import sizes from '../constants/sizes';
import {useAppDispatch, useAppSelector} from '../redux/hooks';
import {updateUserLocation} from '../redux/slices/userSlice';
import {advertisementAPI} from '../services/advertisementAPI';
import {Picker} from 'react-native-wheel-pick';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {styles} from './styles/styles';
import displayIcon from '../assets/images/displayIcon.png';

const updateGatewaysTimeLimit = 1200;
const defaultDeltas = { latitude: 0.0922, longitude: 0.0421 }

export default function Map({navigation}: any) {
  const dispatch = useAppDispatch();

  const userLocation = useAppSelector(state => state.user.location);

  const [regionDeltas, setRegionDeltas] = useState({
    latitudeDelta: defaultDeltas.latitude, //0.0922,
    longitudeDelta: defaultDeltas.longitude, // 0.0421,
  });
  const [gateways, setGateways] = useState<any>({});
  const [selectedGateway, setSelectedGateway] = useState('');
  const [durationPickerVisible, setDurationPickerVisible] = useState(false);
  const [duration, setDuration] = useState(1);
  const [_, forceUpdate] = useReducer((x) => x + 1, 0);

  const [updatingGateways, setUpdatingGateways] = useState(false);

  const mapRef = useRef<any>(null);

  useEffect(() => {
    updateGateways();

    if (Platform.OS === 'android') {
      PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ).then(async locationAllowed => {
        if (!locationAllowed) {
          await requestLocationPermission();
        } else {
          centerMapOnUser();
        }
      });

      const interval = setInterval(() => {
        getUserLocation();
      }, 30000);

      return () => {
        clearInterval(interval);
      };
    } else {
      centerMapOnUser();
    }
  }, []);

  const clearGatewaySelection = () => {
    setSelectedGateway(''); // clear selection on refreshing
    setDurationPickerVisible(false);  // close duration picker
  }
  const updateGateways = async () => {
    setUpdatingGateways(true);
    clearGatewaySelection();
    advertisementAPI
      .getAllGateways()
      .then(res => {
        console.log('getAllGateways res:', res.data);
        let gateways: any = {};
        res.data.data.forEach((gateway: any) => {
          gateways[gateway.gateway_id] = {
            cost: gateway.cost,
            lat: gateway.lat,
            long: gateway.long,
            port: gateway.port.toString(),
            owner: gateway.owner_address,
            id: gateway.gateway_id,
          };
        });
        setGateways(gateways);
        setTimeout(() => setUpdatingGateways(false), updateGatewaysTimeLimit); // to prevent too many requests
        forceUpdate();
      })
      .catch(err => {
        console.log('getAllGateways err:', err);
        setUpdatingGateways(false);
      });
  }

  const requestLocationPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'Nesten Advertising needs access to your location ',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('Location permission granted');
        centerMapOnUser();
      } else {
        console.log('Location permission denied');
      }
    } catch (err) {
      console.warn(err);
    }
  };

  function getUserLocation() {
    Geolocation.getCurrentPosition(pos => {
      dispatch(
        updateUserLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }),
      );
      // console.log('updated user location');
    });
  }

  function centerMapOnUser() {
    Geolocation.getCurrentPosition(pos => {
      clearGatewaySelection();
      mapRef.current?.animateToRegion(
        {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          latitudeDelta: regionDeltas.latitudeDelta,
          longitudeDelta: regionDeltas.longitudeDelta,
        },
        1000,
      );
      dispatch(
        updateUserLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }),
      );
    });
  }

  function centerMapOnCoords(lat: number, lon: number) {
    console.log('lat:', lat);
    console.log('lon:', lon);
    clearGatewaySelection();
    mapRef.current?.animateToRegion(
      {
        latitude: lat,
        longitude: lon,
        latitudeDelta: regionDeltas.latitudeDelta,
        longitudeDelta: regionDeltas.longitudeDelta,
      },
      1000,
    );
  }

  const onRegionChangeComplete = (region: Region, details: Details) => {
    setRegionDeltas({
      latitudeDelta: defaultDeltas.latitude, // region.latitudeDelta,
      longitudeDelta: defaultDeltas.longitude, // region.longitudeDelta,
    });
  };

  function handleContinueDurationPress() {
    setDurationPickerVisible(false);
    navigation.navigate('Scheduler', {
      gateway: gateways[selectedGateway],
      duration: duration,
    });
  }

  const onSelectGateway = (id: string, coordinate: any) => {
    setSelectedGateway(id);
    mapRef.current?.animateCamera({center: coordinate}, { /*duration: 500*/ }); // ios need to move camera to marker explicitly, so let's use unified one for both android and ios
  }

  let locations: any = {};

  return (
    <SafeAreaView style={styles.container}>
      <MapView
        onPress={(event) => {if (event.nativeEvent.action !== 'marker-press') {clearGatewaySelection(); Keyboard.dismiss();}}}
        ref={mapRef}
        style={styles.fullSize}
        showsUserLocation={Platform.OS === 'ios'}
        initialRegion={{
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: regionDeltas.latitudeDelta,
          longitudeDelta: regionDeltas.longitudeDelta,
        }}
        onRegionChangeComplete={(region, details) =>
          onRegionChangeComplete(region, details)
        }
        moveOnMarkerPress={false}  // disables native movement on android
      > 
        {Platform.OS === 'android' && userLocation.latitude !== 0 && (
          <Marker
            // @ts-ignore
            cluster={false}
            coordinate={userLocation}
            image={{uri: 'bluedot'}}
            style={{zIndex: 100}}
          />
        )}
        {Object.entries(gateways).map(([id, details]: [string, any]) => {
          let adjustedLat = details.lat;
          let location = `${details.lat}_${details.long}`;
          let adjusted = false;
          while (locations[location]) {
            adjustedLat -= 0.0001;
            location = `${adjustedLat}_${details.long}`;
            adjusted = true;
            for (let i = 0; i < Object.keys(locations).length; i++) {
              let existingLocation = Object.keys(locations)[i];
              let [existingLat, existingLong] = existingLocation.split('_');
              if (
                Math.abs(adjustedLat - parseFloat(existingLat)) < 0.0001 &&
                details.long === parseFloat(existingLong)
              ) {
                adjusted = false;
                break;
              }
            }
          }
          if (adjusted) {
            location = `${adjustedLat}_${details.long}`;
          }
          locations[location] = true;

          if (Platform.OS === 'ios') {
            return (
              <Marker
                key={id}
                coordinate={{
                  latitude: adjustedLat,
                  longitude: details.long,
                }}
                style={{  // This is not working on iOS release build. Added child Image component instead.
                  width: 50,
                  height: 50,
                }}
                title={details.port}
                onPress={() => onSelectGateway(id, {latitude: adjustedLat, longitude: details.long})}
              >
                <Image 
                  source={displayIcon}
                  style={{width: 50, height: 50}}
                  resizeMode="contain"
                />
              </Marker>
            );
          } else {
            return (
              <Marker
                key={id}
                coordinate={{
                  latitude: adjustedLat,
                  longitude: details.long,
                }}
                image={{uri: 'displayicon'}}
                title={details.port}
                onPress={() => onSelectGateway(id, {latitude: adjustedLat, longitude: details.long})}
              />
            );
          }
        })}
      </MapView>
      <View style={localStyles.mapUI}>
        {
          updatingGateways?
          <ActivityIndicator size="large" / >
          :
          <TouchableOpacity style={localStyles.mapUIItem} onPress={updateGateways}>
            <Icon name={"refresh"} size={sizes.sz_4xl} color="#333" />
          </TouchableOpacity>
        }
        <TouchableOpacity style={localStyles.mapUIItem} onPress={centerMapOnUser}>
          <Icon name="my-location" size={sizes.sz_4xl} color="#333" />
          {/* <Icon name="location-searching" size={sizes.sz_4xl} color="#333" /> */}
        </TouchableOpacity>
      </View>
      {selectedGateway && (
        <View style={localStyles.gatewayInfo}>
          <Text style={styles.titleText}>{gateways[selectedGateway].port}</Text>
          <View style={localStyles.bookingContainer}>
            <View style={{flexDirection: 'column'}}>
              <Text>Cost per minute</Text>
              <Text style={localStyles.costText}>
                {gateways[selectedGateway].cost} Drop Credits
              </Text>
              <Text style={localStyles.costText}>
                {gateways[selectedGateway].cost} DWIN
              </Text>
              <Text style={localStyles.costText}>
                {gateways[selectedGateway].cost} NIT
              </Text>
            </View>
            <TouchableOpacity
              style={{...styles.darkButton, alignSelf: 'flex-end'}}
              onPress={() => setDurationPickerVisible(true)}>
              <Text style={styles.darkButtonText}>Book Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      <LocationSearchBar centerMapOnCoords={centerMapOnCoords} />
      {durationPickerVisible && (
        <View style={localStyles.gatewayInfo}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
            <TouchableOpacity onPress={() => setDurationPickerVisible(false)}>
              <Icon name="close" size={sizes.sz_3xl} color="black" />
            </TouchableOpacity>
            <Text style={styles.titleText}>Duration (minutes)</Text>
            <Icon name="close" size={sizes.sz_3xl} color="rgba(0, 0, 0, 0)" />
          </View>
          <Picker
            pickerData={Array.from({length: 30}, (_, k) => k + 1)}
            selectedValue={duration}
            onValueChange={(value: any) => {
              setDuration(value);
            }}
            style={localStyles.durationPicker}
          />
          <TouchableOpacity
            style={styles.darkButton}
            onPress={() => handleContinueDurationPress()}>
            <Text style={styles.darkButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text
        style={{
          position: 'absolute',
          bottom: 8,
          color: 'blue',
        }}
        onPress={() => Linking.openURL('https://openstreetmap.org/copyright')}>
        OpenStreetMap
      </Text>
    </SafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  gatewayInfo: {
    position: 'absolute',
    bottom: sizes.sz_10xl,
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 15,
    width: '90%',
    padding: sizes.sz_lg,
  },
  bookingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: sizes.sz_md,
  },
  costText: {
    fontSize: sizes.sz_2xl,
    color: 'black',
  },
  durationPicker: {
    margin: sizes.sz_md,
    backgroundColor: 'white',
  },
  mapUI: {
    position: 'absolute',
    bottom: 20,
    right: 0,
    flex: 1,
    padding: sizes.sz_sm
  },
  mapUIItem: {
    padding: 8,
    marginTop: sizes.sz_sm,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  }
});
