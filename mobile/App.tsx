import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/context/auth-context';
import { CatalogProvider } from './src/context/catalog-context';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor="#06070d" />
      <AuthProvider>
        <CatalogProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </CatalogProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

