import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AdminDashboardScreen } from '../screens/admin/AdminDashboardScreen';
import { AdminBookingsScreen } from '../screens/admin/AdminBookingsScreen';
import { AdminMoviesScreen } from '../screens/admin/AdminMoviesScreen';
import { AdminShowtimesScreen } from '../screens/admin/AdminShowtimesScreen';
import { AdminTicketsScreen } from '../screens/admin/AdminTicketsScreen';
import { AdminUsersScreen } from '../screens/admin/AdminUsersScreen';

const Stack = createNativeStackNavigator();

export function AdminNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#06070d' },
      }}
    >
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      <Stack.Screen name="AdminBookings" component={AdminBookingsScreen} />
      <Stack.Screen name="AdminMovies" component={AdminMoviesScreen} />
      <Stack.Screen name="AdminShowtimes" component={AdminShowtimesScreen} />
      <Stack.Screen name="AdminTickets" component={AdminTicketsScreen} />
      <Stack.Screen name="AdminUsers" component={AdminUsersScreen} />
    </Stack.Navigator>
  );
}

