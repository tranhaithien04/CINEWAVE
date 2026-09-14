import React from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { colors } from '../constants/theme';
import { HomeScreen } from '../screens/HomeScreen';
import { MoviesScreen } from '../screens/MoviesScreen';
import { TicketsScreen } from '../screens/TicketsScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Trang chủ',
          tabBarIcon: ({ color }) => <Text style={[styles.tabIcon, { color }]}>🏠</Text>,
        }}
      />

      <Tab.Screen
        name="MoviesTab"
        component={MoviesScreen}
        options={{
          tabBarLabel: 'Phim',
          tabBarIcon: ({ color }) => <Text style={[styles.tabIcon, { color }]}>🎬</Text>,
        }}
      />

      <Tab.Screen
        name="TicketsTab"
        component={TicketsScreen}
        options={{
          tabBarLabel: 'Vé của tôi',
          tabBarIcon: ({ color }) => <Text style={[styles.tabIcon, { color }]}>🎟️</Text>,
        }}
      />

      <Tab.Screen
        name="NotificationsTab"
        component={NotificationsScreen}
        options={{
          tabBarLabel: 'Thông báo',
          tabBarIcon: ({ color }) => <Text style={[styles.tabIcon, { color }]}>🔔</Text>,
        }}
      />

      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Tài khoản',
          tabBarIcon: ({ color }) => <Text style={[styles.tabIcon, { color }]}>👤</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#06070d',
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    borderTopWidth: 1,
    height: 60,
    paddingBottom: 8,
    paddingTop: 6,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  tabIcon: {
    fontSize: 18,
  },
});

