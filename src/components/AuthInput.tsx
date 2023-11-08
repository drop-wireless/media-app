import {StyleSheet, Text, TextInput, View} from 'react-native';
import sizes from '../constants/sizes';

export default function AuthInput({
  label,
  value,
  onChangeText,
  secureTextEntry = false,
}: any) {
  return (
    <View style={{width: '100%'}}>
      <Text style={localStyles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        autoCapitalize="none"
      />
    </View>
  );
}

const localStyles = StyleSheet.create({
  label: {
    color: 'black',
    marginBottom: sizes.sz_2xs,
    marginLeft: sizes.sz_xl,
    marginTop: sizes.sz_xl,
    fontSize: sizes.sz_lg,
  },
});
