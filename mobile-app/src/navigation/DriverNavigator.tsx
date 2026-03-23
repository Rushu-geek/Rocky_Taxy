import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet, Platform } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import DriverHomeScreen from '../screens/driver/DriverHome.screen';
import ActiveRideScreen from '../screens/driver/ActiveRide.screen';
import FinanceDashboardScreen from '../screens/driver/FinanceDashboard.screen';
import { Colors } from '../constants/theme';

export type DriverTabParamList = {
  DriverHome: undefined;
  ActiveRide: undefined;
  FinanceDashboard: undefined;
};

const Tab = createBottomTabNavigator<DriverTabParamList>();

const DriverNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.4)',
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
        tabBarIcon: ({ focused, color }) => {
          let iconName = 'bell';
          if (route.name === 'DriverHome')      iconName = 'bell';
          if (route.name === 'ActiveRide')      iconName = 'zap';
          if (route.name === 'FinanceDashboard') iconName = 'dollar-sign';
          return (
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              <Feather name={iconName} size={22} color={color} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen
        name="DriverHome"
        component={DriverHomeScreen}
        options={{ tabBarLabel: 'Requests' }}
      />
      <Tab.Screen
        name="ActiveRide"
        component={ActiveRideScreen}
        options={{ tabBarLabel: 'Active' }}
      />
      <Tab.Screen
        name="FinanceDashboard"
        component={FinanceDashboardScreen}
        options={{ tabBarLabel: 'Earnings' }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.primary,
    borderTopWidth: 0,
    height: Platform.OS === 'ios' ? 82 : 64,
    paddingBottom: Platform.OS === 'ios' ? 22 : 8,
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
    backgroundColor: 'rgba(245,166,35,0.15)',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.2,
    marginTop: -2,
  },
});

export default DriverNavigator;
