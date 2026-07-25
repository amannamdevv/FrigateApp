import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { DashboardScreen } from '../screens/DashboardScreen';
import { CamerasScreen, CameraLiveScreen } from '../screens/CamerasScreen';
import { EventsScreen } from '../screens/EventsScreen';
import { RecordingsScreen } from '../screens/RecordingsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const CamerasStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CamerasList" component={CamerasScreen} />
      <Stack.Screen name="CameraLive" component={CameraLiveScreen} />
    </Stack.Navigator>
  );
};

export const MainNavigator = () => {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName = 'home';
          if (route.name === 'DashboardTab') iconName = 'view-dashboard';
          else if (route.name === 'CamerasTab') iconName = 'cctv';
          else if (route.name === 'EventsTab') iconName = 'motion-sensor';
          else if (route.name === 'RecordingsTab') iconName = 'video';
          else if (route.name === 'SettingsTab') iconName = 'cog';

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: '#333',
        }
      })}
    >
      <Tab.Screen name="DashboardTab" component={DashboardScreen} options={{ title: 'Dashboard' }} />
      <Tab.Screen name="CamerasTab" component={CamerasStack} options={{ title: 'Cameras' }} />
      <Tab.Screen name="EventsTab" component={EventsScreen} options={{ title: 'Events' }} />
      <Tab.Screen name="RecordingsTab" component={RecordingsScreen} options={{ title: 'Recordings' }} />
      <Tab.Screen name="SettingsTab" component={SettingsScreen} options={{ title: 'Settings' }} />
    </Tab.Navigator>
  );
};
