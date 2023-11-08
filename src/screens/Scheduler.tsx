import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  CalendarViewMode,
  EventItem,
  RangeTime,
  TimelineCalendar,
  TimelineCalendarHandle,
} from '@howljs/calendar-kit';
import {useEffect, useRef, useState} from 'react';
import sizes from '../constants/sizes';
import {styles} from './styles/styles';
import Toast from 'react-native-toast-message';
import {advertisementAPI} from '../services/advertisementAPI';
import Loader from '../components/Loader';
import DatePicker from 'react-native-date-picker'

export default function Scheduler({navigation, route}: any) {
  const {gateway, duration} = route.params;
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<CalendarViewMode>('threeDays');

  const durationHours = duration / 60;
  const now = new Date();
  const today = getYearMonthDate(now);

  const [date, setDate] = useState(new Date());
  const [openPicker, setOpenPicker] = useState(false);

  const [unavailableHours, setUnavailableHours] = useState<any>({});

  const calendarRef = useRef<TimelineCalendarHandle>(null);

  const eventColor = '#A3C7D6';

  useEffect(() => {
    getUnavailableHours();
  }, []);


  function getYearMonthDate(date: Date) {
    const offset = date.getTimezoneOffset();
    date = new Date(date.getTime() - offset * 60 * 1000);
    return date.toISOString().split('T')[0];
  }

  function getTimeHours(date: Date) {
    return date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;
  }

  async function getUnavailableHours() {
    setLoading(true);
    const fiveMinsFromNow = new Date(
      Math.ceil(new Date().getTime() / 60000) * 60000 + 5 * 60000,
    );
    const unavailableHoursBeforeNow = getTimeHours(fiveMinsFromNow);

    let unavailableHours: any = {};
    unavailableHours[today] = [{start: 0, end: unavailableHoursBeforeNow}];

    await advertisementAPI
      .getFutureReservationTimes(gateway.id)
      .then(res => {
        console.log('getFutureReservationTimes res:', res.data);
        for (const timeslot of res.data) {
          const startDate = new Date(timeslot.start_time);
          const startYearMonthDate = getYearMonthDate(startDate);
          const startTimeHours = getTimeHours(startDate);
          const endDate = new Date(timeslot.end_time);
          const endTimeHours = getTimeHours(endDate);
          const newTimeslot = {start: startTimeHours, end: endTimeHours};
          if (startYearMonthDate in unavailableHours) {
            unavailableHours[startYearMonthDate].push(newTimeslot);
          } else {
            unavailableHours[startYearMonthDate] = [newTimeslot];
          }
        }
      })
      .catch(err => {
        console.log('getFutureReservationTimes err:', err);
        Toast.show({type: 'error', text1: 'Server connection failed'});
        setLoading(false);
        navigation.goBack();
      });
    setLoading(false);
    setUnavailableHours(unavailableHours);
  }

  function sortByTime(arr: [{start: number; end: number}]) {
    return arr.sort((a, b) => a.start - b.start);
  }

  function isIntersect(arr: [{start: number; end: number}]) {
    arr = sortByTime(arr);
    for (let i = 1; i < arr.length; i++)
      if (arr[i - 1].end > arr[i].start) return true;

    return false;
  }

  async function handleContinuePress() {
    setLoading(true);
    const startTime = new Date(events[0].start);
    await advertisementAPI
      .reservationCheck(startTime, durationHours, gateway.id)
      .then(async _ => {
        // Check gas fee later
        // const gasFee = await web3Client.estimateGas(
        //   'DWIN',
        //   walletAddress,
        //   duration * gateway.cost,
        // );
        setLoading(false);
        navigation.navigate('UploadMedia', {
          gateway: gateway,
          // startTime: startTime, // converted to serializable data
          startTimeInMilliseconds: startTime.getTime(),
          duration: duration,
          // gasFee: gasFee,
        });
      })
      .catch(err => {
        console.log('reservationCheck err:', err);
        Toast.show({
          type: 'error',
          text1: 'Requested time unavailable',
          text2: 'Please select a different time',
        });
      });
    setLoading(false);
  }

  function findFirstAvailableSlot() {
    const today = new Date();
    let currentDate = getYearMonthDate(today);

    for (let attempts = 0; attempts < 30; attempts++) {
      const sortedUnavailableSlots = unavailableHours[currentDate]
        ? sortByTime(unavailableHours[currentDate])
        : [];

      // Find the first available time slot on this date
      let availableStart = 0;
      let hasAvailableSlot = false;
      for (let i = 0; i < sortedUnavailableSlots.length; i++) {
        const slot = sortedUnavailableSlots[i];
        if (availableStart + duration / 60 <= slot.start) {
          hasAvailableSlot = true;
          break;
        }
        availableStart = slot.end;
      }

      if (!hasAvailableSlot && availableStart + duration / 60 <= 24) {
        // Check if there is a gap at the end of the day
        hasAvailableSlot = true;
      }

      if (hasAvailableSlot) {
        // Check if the end time of an unavailable slot on this date overlaps with the start time of the first available slot on the next date
        const nextDate = new Date(today.getTime() + 24 * 60 * 60 * 1000);
        const nextDateStr = getYearMonthDate(nextDate);
        const nextDateUnavailableSlots = unavailableHours[nextDateStr] ?? [];
        const nextDateFirstUnavailableSlot = nextDateUnavailableSlots[0];
        if (
          availableStart + duration / 60 > 24 &&
          nextDateFirstUnavailableSlot &&
          nextDateFirstUnavailableSlot.start <
            availableStart + duration / 60 - 24
        ) {
          // There is an overlap, skip this available slot and continue searching
          availableStart = nextDateFirstUnavailableSlot.end;
          continue;
        }
        // Found a valid available time slot
        const year = parseInt(currentDate.substring(0, 4));
        const month = parseInt(currentDate.substring(5, 7)) - 1;
        const day = parseInt(currentDate.substring(8, 10));
        const start = new Date(
          year,
          month,
          day,
          Math.floor(availableStart),
          Math.round((availableStart % 1) * 60),
          0,
        );
        const end = new Date(
          year,
          month,
          day,
          Math.floor(availableStart) + Math.floor(duration / 60),
          Math.round(((availableStart % 1) + (duration % 60) / 60) * 60),
          0,
        );
        const newEvent = {
          id: 'id',
          title: '',
          start: start.toISOString(),
          end: end.toISOString(),
          color: eventColor,
        };
        console.log('newEvent:', newEvent);
        setDate(start);
        setEvents([newEvent]);

        return;
      }

      // Move on to the next day
      today.setDate(today.getDate() + 1);
      currentDate = getYearMonthDate(today);
    }

    // No available time slot was found
    Toast.show({type: 'error', text1: 'No available times'});
  }

  function isValidTime(event: any) {
    const startDate = new Date(event.start);
    const startYearMonthDate = getYearMonthDate(startDate);
    const startTimeHours = getTimeHours(startDate);

    const endDate = new Date(event.end);
    const endTimeHours = getTimeHours(endDate);

    if (
      startYearMonthDate in unavailableHours &&
      isIntersect(
        unavailableHours[startYearMonthDate].concat([
          {start: startTimeHours, end: endTimeHours},
        ]),
      )
    ) {
      Toast.show({
        type: 'error',
        text1: 'Selected time unavailable',
        text2: 'Please select a different time',
      });
      return false;
    }
    return true;
  }

  function onDragCreateEnd(event: RangeTime) {
    console.log(event);
    if (isValidTime(event)) {
      const newEvent = {
        id: 'id',
        title: '',
        start: event.start,
        end: event.end,
        color: eventColor,
      };
      console.log('newEvent:', newEvent);
      setDate(new Date(event.start));
      setEvents([newEvent]);
    }
  }

  return (
    <SafeAreaView style={localStyles.container}>
      <View style={localStyles.viewModeContainer}>
        <TouchableOpacity onPress={() => setViewMode('day')}>
          <Text
            style={
              viewMode === 'day'
                ? localStyles.selectedViewModeText
                : localStyles.unselectedViewModeText
            }>
            Day
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setViewMode('threeDays')}>
          <Text
            style={
              viewMode === 'threeDays'
                ? localStyles.selectedViewModeText
                : localStyles.unselectedViewModeText
            }>
            3 Days
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setViewMode('week')}>
          <Text
            style={
              viewMode === 'week'
                ? localStyles.selectedViewModeText
                : localStyles.unselectedViewModeText
            }>
            Week
          </Text>
        </TouchableOpacity>
      </View>
      <TimelineCalendar
        ref={calendarRef}
        viewMode={viewMode}
        minDate={today}
        events={events}
        unavailableHours={unavailableHours}
        allowDragToCreate
        onDragCreateEnd={event => onDragCreateEnd(event)}
        dragCreateInterval={duration}
        dragStep={1}
        initialTimeIntervalHeight={420}
        maxTimeIntervalHeight={420}
        theme={{
          unavailableBackgroundColor: 'lightgray',
          hourText: {color: 'black'},
        }}
      />
      <View style={localStyles.footer}>
        {events[0] ? (
          <View>
            <DatePicker
              modal
              title={'Select start time'}
              minimumDate={new Date(Math.ceil(new Date().getTime() / 60000) * 60000 + 5 * 60000)}
              open={openPicker}
              date={date}
              // onDateChange={setDate}
              onConfirm={(date) => {
                setOpenPicker(false);
                const newEvent = {
                  id: 'id',
                  title: '',
                  start: date.toISOString(),
                  end: (new Date(date.getTime() + duration*60*1000)).toISOString(),
                  color: eventColor,
                };
                if (isValidTime(newEvent)) {
                  setEvents([newEvent]);
                  setDate(date);
                  calendarRef.current?.goToDate({date: newEvent.start, hourScroll: true, animatedDate: true});
                }
                else {
                  Toast.show({
                    type: 'error',
                    text1: 'Selected time unavailable',
                    text2: 'Please select a different time',
                  });
                }
              }}
              onCancel={() => {
                setOpenPicker(false);
              }}/>
            <TouchableOpacity 
              onPress={() => {setOpenPicker(true)}}>
              <Text style={{color: 'black', textAlign: 'center', fontSize: sizes.sz_md}}>
                {new Date(events[0].start).toLocaleString([], {
                  year: 'numeric',
                  month: 'numeric',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
                {' - '}
                {new Date(events[0].end).toLocaleString([], {
                  year: 'numeric',
                  month: 'numeric',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </Text>
              <Text style={{color: 'black', textAlign: 'center', fontSize: sizes.sz_sm}}>
                Tap to adjust
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{...styles.darkButton, marginTop: sizes.sz_sm}}
              onPress={() => handleContinuePress()}>
              <Text style={styles.darkButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <TouchableOpacity 
              onPress={() => { findFirstAvailableSlot(); setOpenPicker(true); }}>
              <Text>Long press on the calendar and drag, or tap here to select a time.</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{...styles.darkButton, marginTop: sizes.sz_xs}}
              onPress={() => findFirstAvailableSlot()}>
              <Text style={styles.darkButtonText}>
                Select First Available Time
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      <Loader visible={loading} />
    </SafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  footer: {
    backgroundColor: 'white',
    padding: sizes.sz_lg,
  },
  button: {
    ...styles.darkButton,
    width: '42%',
  },
  viewModeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginVertical: sizes.sz_md,
  },
  selectedViewModeText: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: sizes.sz_md,
  },
  unselectedViewModeText: {
    color: 'black',
    fontSize: sizes.sz_md,
  },
});
