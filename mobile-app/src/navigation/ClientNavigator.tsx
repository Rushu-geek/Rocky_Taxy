import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import ClientHomeScreen from '../screens/client/ClientHome.screen';
import BookRideScreen from '../screens/client/BookRide.screen';
import RideHistoryScreen from '../screens/client/RideHistory.screen';
import { Colors, Typography } from '../constants/theme';

export type ClientTabParamList = {
  ClientHome: undefined;
  BookRide: undefined;
  RideHistory: undefined;
};

const Tab = createBottomTabNavigator<ClientTabParamList>();

const ClientNavigator = () => {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: [
          styles.tabBar,
          {
            height: 64 + insets.bottom,
            paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          }
        ],
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.4)',
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = 'home';
          if (route.name === 'ClientHome') iconName = 'home';
          if (route.name === 'BookRide')   iconName = 'plus-circle';
          if (route.name === 'RideHistory') iconName = 'list';
          return (
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              <Feather name={iconName} size={22} color={color} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen
        name="ClientHome"
        component={ClientHomeScreen}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="BookRide"
        component={BookRideScreen}
        options={{ tabBarLabel: 'Book' }}
      />
      <Tab.Screen
        name="RideHistory"
        component={RideHistoryScreen}
        options={{ tabBarLabel: 'History' }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.primary,   // Pure black — Uber-style
    borderTopWidth: 0,
    paddingTop: 8,
  },
  tabItem: {
    paddingTop: 4,
  },
  iconWrap: {
    width: 44,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  iconWrapActive: {
    backgroundColor: 'rgba(245,166,35,0.15)',  // Subtle amber highlight
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.2,
    marginTop: -2,
  },
});

export default ClientNavigator;
