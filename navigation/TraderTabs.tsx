// Tradertabs.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';

// ✅ Shared Profile Screen (used for all roles)
import ProfileScreen from '../src/screens/shared/ProfileScreen';
// TraderTabs.tsx
import WorkshopReceivedScreen from '../src/screens/Trader/WorkshopReceivedScreen';

// ✅ Trader Screens
import CollectedItemsScreen from '../src/screens/Trader/CollectedItemsScreen';
import PickupReadyScreen from '../src/screens/Trader/PickupReadyScreen';
import PlaceOrderScreen from '../src/screens/Trader/PlaceOrderScreen';
import OrderHistoryScreen from '../src/screens/Trader/OrderHistoryScreen';

const Tab = createBottomTabNavigator();

const TraderTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#007bff',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: { paddingVertical: 5, height: 60 },
        tabBarIcon: ({ color, size }) => {
          let iconName = 'home';

          switch (route.name) {
            case 'Collected':
              iconName = 'cube-outline';
              break;
            case 'PickupReady':
              iconName = 'checkmark-done-outline';
              break;
            case 'PlaceOrder':
              iconName = 'cart-outline';
              break;
            case 'OrderHistory':
              iconName = 'time-outline';
              break;
            case 'Profile':
              iconName = 'person-circle-outline';
              break;
            default:
              iconName = 'ellipse-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="PlaceOrder" component={PlaceOrderScreen} />
      
      <Tab.Screen name="Collected" component={CollectedItemsScreen} />
      
       <Tab.Screen name="Workshop" component={WorkshopReceivedScreen} />
       
      <Tab.Screen name="PickupReady" component={PickupReadyScreen} />

      <Tab.Screen name="OrderHistory" component={OrderHistoryScreen} />

      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default TraderTabs;
