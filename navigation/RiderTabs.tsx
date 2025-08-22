// navigation/RiderTabs.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import PendingOrdersScreen from '../src/screens/Rider/PendingOrdersScreen';
import HistoryScreen from '../src/screens/Rider/HistoryScreen';
import ProfileScreen from '../src/screens/shared/ProfileScreen'; // shared across roles

const Tab = createBottomTabNavigator();

const RiderTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName = 'list';

          if (route.name === 'Pending') iconName = 'time-outline';
          else if (route.name === 'History') iconName = 'checkmark-done';
          else if (route.name === 'Profile') iconName = 'person-circle-outline';

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#1E88E5',
        tabBarInactiveTintColor: 'gray',
        headerShown: true,
      })}
    >
      <Tab.Screen name="Pending" component={PendingOrdersScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default RiderTabs;
