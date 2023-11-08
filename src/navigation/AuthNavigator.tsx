import {createNativeStackNavigator} from '@react-navigation/native-stack';
import ForgotPassword from '../screens/ForgotPassword';
import ForgotPasswordReset from '../screens/ForgotPasswordReset';
import Register from '../screens/Register';
import SignIn from '../screens/SignIn';

const Stack = createNativeStackNavigator();

export default function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="SignIn" component={SignIn} />
      <Stack.Screen name="Register" component={Register} />
      <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
      <Stack.Screen
        name="ForgotPasswordReset"
        component={ForgotPasswordReset}
      />
    </Stack.Navigator>
  );
}
