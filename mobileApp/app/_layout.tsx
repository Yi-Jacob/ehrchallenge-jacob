import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import LoginScreen from '../components/LoginScreen';
import AppointmentsScreen from '../components/AppointmentsScreen';
import ChatScreen from '../components/ChatScreen';
import ProfileScreen from '../components/ProfileScreen';
// import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Ionicons } from '@expo/vector-icons';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Helper to show a notification
// export async function notify(title: string, body: string) {
//   await Notifications.scheduleNotificationAsync({
//     content: { title, body },
//     trigger: null,
//   });
// }

// Local notification implementation
// export async function notify(title: string, body: string) {
//   await Notifications.scheduleNotificationAsync({
//     content: { title, body },
//     trigger: { seconds: 1 }, // local notification after 1 second
//   });
// }

function MainTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Appointments"
        component={AppointmentsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-ellipses-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function RootLayout() {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem('token');
      
      setIsAuthenticated(!!token);
      setLoading(false);
    };
    checkAuth();
  }, []);

  // Request notification permissions on app start
  // useEffect(() => {
  //   async function registerForPushNotificationsAsync() {
  //     if (Device.isDevice) {
  //       const { status: existingStatus } = await Notifications.getPermissionsAsync();
  //       let finalStatus = existingStatus;
  //       if (existingStatus !== 'granted') {
  //         const { status } = await Notifications.requestPermissionsAsync();
  //         finalStatus = status;
  //       }
  //       if (finalStatus !== 'granted') {
  //         alert('Failed to get push token for push notification!');
  //         return;
  //       }
  //     } else {
  //       alert('Must use physical device for Push Notifications');
  //     }
  //   }
  //   registerForPushNotificationsAsync();
  // }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return isAuthenticated ? (
    <MainTabs />
  ) : (
    <Stack.Navigator>
      <Stack.Screen name="Login" options={{ headerShown: false }}>
        {props => <LoginScreen {...props} onLogin={() => setIsAuthenticated(true)} /* notify={notify} */ />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
