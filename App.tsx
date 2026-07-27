/**
 * Frigate App - Main Navigation
 */

import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider, MD3DarkTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Screens
import { LoginScreen } from './src/screens/LoginScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { CamerasScreen } from './src/screens/CamerasScreen';
import { CameraDetailsScreen } from './src/screens/CameraDetailsScreen';
import { LiveViewScreen } from './src/screens/LiveViewScreen';
import { AllDetectionsScreen } from './src/screens/AllDetectionsScreen';
import { EventsScreen } from './src/screens/EventsScreen';
import { RecordingsScreen } from './src/screens/RecordingsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Define a dark theme that matches the screenshots
const customDarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    background: '#121418', // Very dark background
    surface: '#1e2129',   // Slightly lighter for cards/headers
    surfaceVariant: '#2a2e37',
    primary: '#3498db',   // Blue accents
    onSurface: '#ffffff',
    onSurfaceVariant: '#a0aab5',
    error: '#e74c3c',
  },
};

const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: customDarkTheme.colors.primary,
    background: customDarkTheme.colors.background,
    card: customDarkTheme.colors.surface,
    text: customDarkTheme.colors.onSurface,
    border: customDarkTheme.colors.surfaceVariant,
    notification: customDarkTheme.colors.primary,
  }
};

// Main Tab Navigator
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = 'view-dashboard';

          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'view-dashboard' : 'view-dashboard-outline';
              break;
            case 'Cameras':
              iconName = focused ? 'cctv' : 'camera-outline';
              break;
            case 'Events':
              iconName = focused ? 'bell' : 'bell-outline';
              break;
            case 'Recordings':
              iconName = focused ? 'video-box' : 'video-outline';
              break;
            case 'Settings':
              iconName = focused ? 'cog' : 'cog-outline';
              break;
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: customDarkTheme.colors.primary,
        tabBarInactiveTintColor: '#888',
        tabBarStyle: {
          backgroundColor: customDarkTheme.colors.surface,
          borderTopColor: customDarkTheme.colors.surfaceVariant,
          paddingBottom: 4,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        }
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Cameras" component={CamerasScreen} />
      <Tab.Screen name="Events" component={EventsScreen} />
      <Tab.Screen name="Recordings" component={RecordingsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={customDarkTheme}>
        <StatusBar barStyle="light-content" backgroundColor={customDarkTheme.colors.surface} />
        <NavigationContainer theme={navigationTheme}>
          <Stack.Navigator initialRouteName="MainApp" screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="MainApp" component={MainTabs} />
            <Stack.Screen name="CameraDetails" component={CameraDetailsScreen} />
            <Stack.Screen name="LiveView" component={LiveViewScreen} />
            <Stack.Screen name="AllDetections" component={AllDetectionsScreen} />
            <Stack.Screen name="Recordings" component={RecordingsScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

export default App;
