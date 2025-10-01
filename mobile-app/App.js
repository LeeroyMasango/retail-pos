import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider } from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import LoginScreen from './src/screens/LoginScreen';
import ScanScreen from './src/screens/ScanScreen';
import CartScreen from './src/screens/CartScreen';
import CheckoutScreen from './src/screens/CheckoutScreen';
import InventoryScreen from './src/screens/InventoryScreen';
import AnalyticsScreen from './src/screens/AnalyticsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ProductDetailsScreen from './src/screens/ProductDetailsScreen';
import ReceiptScreen from './src/screens/ReceiptScreen';
import AddProductScreen from './src/screens/AddProductScreen';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import { OfflineProvider } from './src/context/OfflineContext';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => {
  const { user } = useAuth();
  const isManagerOrAdmin = user?.role === 'admin' || user?.role === 'manager';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Scan') {
            iconName = 'barcode-scan';
          } else if (route.name === 'Cart') {
            iconName = 'cart';
          } else if (route.name === 'Inventory') {
            iconName = 'package-variant';
          } else if (route.name === 'Analytics') {
            iconName = 'chart-line';
          } else if (route.name === 'Settings') {
            iconName = 'cog';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#6200ee',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Scan" component={ScanScreen} options={{ title: 'Scan Items' }} />
      <Tab.Screen name="Cart" component={CartScreen} options={{ title: 'Cart' }} />
      {isManagerOrAdmin && (
        <Tab.Screen name="Inventory" component={InventoryScreen} options={{ title: 'Inventory' }} />
      )}
      {isManagerOrAdmin && (
        <Tab.Screen name="Analytics" component={AnalyticsScreen} options={{ title: 'Analytics' }} />
      )}
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen 
            name="ProductDetails" 
            component={ProductDetailsScreen}
            options={{ headerShown: true, title: 'Product Details' }}
          />
          <Stack.Screen 
            name="Checkout" 
            component={CheckoutScreen}
            options={{ headerShown: true, title: 'Checkout' }}
          />
          <Stack.Screen 
            name="Receipt" 
            component={ReceiptScreen}
            options={{ headerShown: true, title: 'Receipt' }}
          />
          <Stack.Screen 
            name="AddProduct" 
            component={AddProductScreen}
            options={{ headerShown: true, title: 'Add Product' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

export default function App() {
  return (
    <PaperProvider>
      <AuthProvider>
        <OfflineProvider>
          <CartProvider>
            <NavigationContainer>
              <AppNavigator />
            </NavigationContainer>
          </CartProvider>
        </OfflineProvider>
      </AuthProvider>
    </PaperProvider>
  );
}
