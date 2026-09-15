import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TabNavigator } from './TabNavigator';
import { MovieDetailScreen } from '../screens/MovieDetailScreen';
import { SeatMapScreen } from '../screens/SeatMapScreen';
import { CheckoutScreen } from '../screens/CheckoutScreen';
import { TicketDetailScreen } from '../screens/TicketDetailScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { VerifyEmailScreen } from '../screens/VerifyEmailScreen';
import { ChangeShowtimeScreen } from '../screens/ChangeShowtimeScreen';
import { StaffScanScreen } from '../screens/StaffScanScreen';
import { AdminNavigator } from './AdminNavigator';

const Stack = createNativeStackNavigator();

export function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#06070d' },
      }}
    >
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen name="MovieDetail" component={MovieDetailScreen} />
      <Stack.Screen name="SeatMap" component={SeatMapScreen} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen name="TicketDetail" component={TicketDetailScreen} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="ChangeShowtime" component={ChangeShowtimeScreen} />
      <Stack.Screen name="StaffScan" component={StaffScanScreen} />
      <Stack.Screen name="AdminSuite" component={AdminNavigator} />
    </Stack.Navigator>
  );
}

