import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AdminDashboardScreen } from '../screens/admin/AdminDashboardScreen';
import { AdminBookingsScreen } from '../screens/admin/AdminBookingsScreen';
import { AdminMoviesScreen } from '../screens/admin/AdminMoviesScreen';
import { AdminShowtimesScreen } from '../screens/admin/AdminShowtimesScreen';
import { AdminTicketsScreen } from '../screens/admin/AdminTicketsScreen';
import { AdminUsersScreen } from '../screens/admin/AdminUsersScreen';
import { AdminCinemasScreen } from '../screens/admin/AdminCinemasScreen';
import { AdminRoomsScreen } from '../screens/admin/AdminRoomsScreen';
import { AdminConcessionsScreen } from '../screens/admin/AdminConcessionsScreen';
import { AdminAgeVerificationsScreen } from '../screens/admin/AdminAgeVerificationsScreen';
import { AdminReportsScreen } from '../screens/admin/AdminReportsScreen';
import { AdminNotificationsScreen } from '../screens/admin/AdminNotificationsScreen';
import { AdminSystemScreen } from '../screens/admin/AdminSystemScreen';

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
      <Stack.Screen name="AdminCinemas" component={AdminCinemasScreen} />
      <Stack.Screen name="AdminRooms" component={AdminRoomsScreen} />
      <Stack.Screen name="AdminConcessions" component={AdminConcessionsScreen} />
      <Stack.Screen name="AdminAgeVerifications" component={AdminAgeVerificationsScreen} />
      <Stack.Screen name="AdminReports" component={AdminReportsScreen} />
      <Stack.Screen name="AdminNotifications" component={AdminNotificationsScreen} />
      <Stack.Screen name="AdminSystem" component={AdminSystemScreen} />
    </Stack.Navigator>
  );
}
