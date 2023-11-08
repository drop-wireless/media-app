import {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableHighlight,
  TouchableOpacity,
  View,
} from 'react-native';
import sizes from '../constants/sizes';
import {useAppSelector} from '../redux/hooks';
import {advertisementAPI} from '../services/advertisementAPI';
import {useIsFocused} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function Reservations({navigation, route}: any) {
  const tabs = ['Ongoing', 'Upcoming', 'Past'];
  const [currentTabIndex, setCurrentTabIndex] = useState(1);

  const getBookings = [
    advertisementAPI.getOngoingBookings,
    advertisementAPI.getUpcomingBookings,
    advertisementAPI.getPastBookings,
  ];
  const [bookings, setBookings] = useState<any>([]);
  const [nextSlice, setNextSlice] = useState(0); // less than 0 means no slices left
  const [isLoading, setIsLoading] = useState(false); // TO DO: replace this with synchronus lock?

  const userName = useAppSelector(state => state.user.userName);

  const isFocused = useIsFocused();

  // go to target tab everytime focused and tabName is set
  useEffect(() => {
    if (isFocused) {
      // console.log("focused", route.params?.tabName);
      if (route.params?.tabName) {
        const tabIndex = tabs.indexOf(route.params.tabName);
        if (tabIndex >= 0) {
          route.params.tabName = null;
          setCurrentTabIndex(tabIndex);
          // console.log("set index");
        }
      }
    }
  }, [isFocused]);

  // append next booking slice, if there is more left.
  function appendNextBookingsSlice() {
    if (nextSlice >= 0) {
      // there might me items to append
      setIsLoading(true);
      getBookings[currentTabIndex](userName, nextSlice)
        .then(res => {
          // console.log(
          //   `get${tabs[currentTabIndex]}Bookings res size:`,
          //   res.data.data.length,
          // );
          if (nextSlice === 0) {
            // if it's initial slice
            setBookings(res.data.data); // can be empty if there is no item
          } else if (res.data.data.length > 0) {
            // not initial slice AND found items to append
            setBookings(bookings.concat(res.data.data));
          } else {
            setNextSlice(-1); // makred as no more slices left.
          }
          setIsLoading(false);
        })
        .catch(err => {
          setIsLoading(false);
          // TO DO: something to handle if the request fails?
          console.log(`get${tabs[currentTabIndex]}Bookings err:`, err, userName, nextSlice);
        });
    }
  }
  // When tab changed or entering focus, refresh whole list by setting slice to 0
  // When leaving focus, remove bookings to reset scroll to top
  useEffect(() => {
    if (isFocused) {
      // console.log(`\ntab changed to:${tabs[currentTabIndex]}`);
      setNextSlice(0);
    } else {
      setBookings([]);
      setNextSlice(-1);
    }
  }, [currentTabIndex, isFocused]);
  // When tab changed or next slice is requested,
  useEffect(() => {
    if (nextSlice >= 0) {
      // console.log(
      //   'trying to append bookings at ' +
      //     tabs[currentTabIndex] +
      //     ', slice#' +
      //     nextSlice,
      // );
      appendNextBookingsSlice();
    }
  }, [currentTabIndex, nextSlice]);

  const onEndReached = () => {
    // pulled down, need to load more?
    // console.log('end reached');
    if (!isLoading) {
      // console.log('end reached & not loading');
      setNextSlice(nextSlice >= 0 ? nextSlice + 1 : -1);
    }
  };
  const onRefresh = () => {
    // console.log('refreshing...');
    // reset the slice to point 0
    setNextSlice(0);
  };
  const renderItem = ({item}: any) => (
    <TouchableOpacity
      style={localStyles.reservationItem}
      onPress={() => {
        navigation.navigate('ReservationDetails', {details: item});
      }}>
      <Text style={localStyles.gatewayNameText}>{item.port}</Text>
      <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
        <View>
          <Text>
            Total: {item.amount * 0.000000000000000001} {item.token_name}
          </Text>

          {!item.played && !item.txhash_to && new Date(item.end_time) < new Date() ? 
          <Text style={{fontSize: sizes.sz_xs, alignContent: 'center', justifyContent: 'center'}}>
            <Icon name="warning" size={sizes.sz_lg} color="orange" />
            {/* Refund Eligable */}
          </Text>
          : null}
          

        </View>
        <View>
          <View style={localStyles.flexEnd}>
            <Text>
              {new Date(item.start_time).toLocaleString([], {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
          <View style={localStyles.flexEnd}>
            <Text>
              -
              {new Date(
                new Date(item.end_time).getTime() + 1000,
              ).toLocaleString([], {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
  const Loader = () => {
    return (
      <View style={{marginBottom: sizes.sz_xs}}>
        <ActivityIndicator size="large" />
      </View>
    );
  };
  const Footer = () => {
    return isLoading ? <Loader /> : <View />;
    // return loading? <Loader /> : <View />;
    // return nextSlice < 0? <Loader /> : <View />;
  };

  return (
    <SafeAreaView style={{flex: 1}}>
      <Text style={localStyles.reservationsText}>Reservations</Text>
      <View style={localStyles.tabsContainer}>
        {tabs.map((el, i) => (
          <TouchableHighlight
            style={localStyles.tab}
            underlayColor={'lightgray'}
            key={i}
            disabled={i === currentTabIndex}
            onPress={() => setCurrentTabIndex(i)}>
            <Text
              style={
                i === currentTabIndex
                  ? localStyles.selectedTabText
                  : localStyles.unselectedTabText
              }>
              {el}
            </Text>
          </TouchableHighlight>
        ))}
      </View>
      <FlatList
        data={bookings}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={localStyles.listContainer}
        // onEndReachedThreshold={0.5}
        onEndReached={onEndReached}
        onRefresh={onRefresh}
        refreshing={false}
        ListFooterComponent={Footer}
      />
    </SafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  tabsContainer: {
    flexDirection: 'row',
    alignSelf: 'center',
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: sizes.sz_sm,
    width: '33%',
  },
  selectedTabText: {
    fontSize: sizes.sz_lg,
    color: 'black',
    fontWeight: 'bold',
  },
  unselectedTabText: {
    fontSize: sizes.sz_lg,
    color: 'black',
  },
  reservationsText: {
    fontSize: sizes.sz_5xl,
    color: 'black',
    marginTop: sizes.sz_5xl,
    marginBottom: sizes.sz_xs,
    alignSelf: 'center',
    fontFamily: 'PlayfairDisplay-ExtraBold',
  },
  reservationItem: {
    padding: sizes.sz_xs,
    backgroundColor: 'white',
    marginBottom: sizes.sz_xs,
    marginHorizontal: sizes.sz_xs,
    borderRadius: 5,
  },
  listContainer: {
    alignItems: 'stretch',
  },
  gatewayNameText: {
    color: 'black',
    fontSize: sizes.sz_md,
    fontWeight: 'bold',
  },
  flexEnd: {
    alignSelf: 'flex-end',
  },
});
