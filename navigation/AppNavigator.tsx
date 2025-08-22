import React, { useContext } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AccessCodeLoginScreen from '../src/screens/AccessCodeLoginScreen';
import { AuthContext } from '../context/AuthContext';
import TraderTabs from './TraderTabs';
import RiderTabs from './RiderTabs';
import ReceiptScreen from '../src/screens/Trader/ReceiptScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { isLoggedIn, role } = useContext(AuthContext);
  const normalizedRole = role?.toLowerCase();

  console.log("🧠 AppNavigator AuthContext =>", { isLoggedIn, role });

  if (!isLoggedIn) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={AccessCodeLoginScreen} />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {normalizedRole === 'trader' ? (
        <>
          <Stack.Screen name="TraderTabs" component={TraderTabs} />
          <Stack.Screen name="ReceiptScreen" component={ReceiptScreen} />
        </>
      ) : normalizedRole === 'rider' ? (
        <Stack.Screen name="RiderTabs" component={RiderTabs} />
      ) : (
        <Stack.Screen name="Login" component={AccessCodeLoginScreen} />
      )}
    </Stack.Navigator>
  );
}
