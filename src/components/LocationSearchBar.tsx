import {Keyboard, StyleSheet, TouchableOpacity, View} from 'react-native';
import {TextInput} from 'react-native-gesture-handler';
import sizes from '../constants/sizes';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useRef, useState} from 'react';
import locationSearch from '../services/geocodingAPI';
import Toast from 'react-native-toast-message';

export default function LocationSearchBar(props: any) {
  const [searchInput, setSearchInput] = useState('');
  // const textInputRef = useRef<TextInput>();

  async function handleSearchPress() {
    Keyboard.dismiss();
    await locationSearch(searchInput)
      .then(res => {
        // console.log('locationSearch res:', res.data);
        if (res.data.length) {
          const location = res.data[0];
          setSearchInput(location.display_name);
          props.centerMapOnCoords(
            parseFloat(location.lat),
            parseFloat(location.lon),
          );
        } else {
          console.log('location not found');
          Toast.show({type: 'error', text1: 'Location not found'});
        }
      })
      .catch(err => {
        console.log('locationSearch err:', err);
        Toast.show({type: 'error', text1: 'Location search failed'});
      });
  }
  async function handleClear() {
    setSearchInput('');
    // textInputRef.current?.focus();
  }

  return (
    <View style={localStyles.searchBar}>
      <TextInput
        // ref={textInputRef}
        placeholder="Location Search"
        placeholderTextColor={'gray'}
        value={searchInput}
        onChangeText={setSearchInput}
        onSubmitEditing={() => handleSearchPress()}
        style={{
          flex: 1,
          backgroundColor: 'white',
          paddingVertical: 0,
          color: 'black',
        }}
      />
      { searchInput &&
      <TouchableOpacity onPress={() => handleClear()}>
        <Icon
          name="clear"
          size={sizes.sz_4xl}
          style={{color: 'gray'}}
        />
      </TouchableOpacity>
      }
      <TouchableOpacity onPress={() => handleSearchPress()}>
        <Icon
          name="arrow-forward"
          size={sizes.sz_4xl}
          style={{color: 'gray'}}
        />
      </TouchableOpacity>
    </View>
  );
}

const localStyles = StyleSheet.create({
  searchBar: {
    flexDirection: 'row',
    padding: sizes.sz_2xs,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '90%',
    height: sizes.sz_8xl,
    backgroundColor: 'white',
    position: 'absolute',
    top: sizes.screenHeight / 15,
  },
});
