import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { moderateScale, verticalScale, IS_TABLET } from "../utils/responsive";
import { getStoredUser } from "../config/apiConfig";

import HomeScreen from "../tabs/HomeScreen";
import ProfileScreen from "../tabs/ProfileScreen";
import IncomeExpenseScreen from "../tabs/IncomeExpenseScreen";

export type MainTabParamList = {
  HomeTab: undefined;
  FinanceTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_ITEMS = [
  { name: "HomeTab", label: "Home", icon: "home", component: HomeScreen },
  { name: "FinanceTab", label: "Accounts", icon: "account-balance-wallet", component: IncomeExpenseScreen },
  // { name: "ProfileTab", label: "Profile", icon: "person", component: ProfileScreen },
];

const TAB_BAR_HEIGHT = verticalScale(IS_TABLET ? 72 : 60);

export default function MainTabNavigator() {
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom > 0 ? insets.bottom : verticalScale(12);

  const [showAccounts, setShowAccounts] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const user = await getStoredUser<any>();
      if (user) {
        if (user.user_type === 'super_admin') {
          setShowAccounts(true);
        } else if (user.tracker_permissions && user.tracker_permissions.length > 0) {
          setShowAccounts(true);
        } else {
          setShowAccounts(false);
        }
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  if (loading) {
    return null;
  }

  const dynamicTabItems = TAB_ITEMS.filter(item => {
    if (item.name === "FinanceTab") return showAccounts;
    return true;
  });

  return (
    <View style={styles.rootContainer}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarShowLabel: true,
          tabBarHideOnKeyboard: true,

          tabBarStyle: dynamicTabItems.length === 1 ? { display: 'none' } : {
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "#FFFFFF",
            borderTopWidth: 1,
            borderTopColor: "#E2E8F0",
            height: TAB_BAR_HEIGHT + bottomInset,
            paddingBottom: bottomInset,
            paddingTop: verticalScale(8),
            elevation: 0,
            shadowOpacity: 0,
          },

          tabBarIcon: ({ focused }) => {
            const item = TAB_ITEMS.find((t) => t.name === route.name);
            return (
              <View style={styles.iconContainer}>
                {focused && <View style={styles.topIndicator} />}
                <View style={[styles.iconWrapper, focused && styles.activeIconWrapper]}>
                  <MaterialIcons
                    name={item?.icon as any}
                    size={moderateScale(IS_TABLET ? 24 : 22)}
                    color={focused ? "#3B82F6" : "#94A3B8"}
                  />
                </View>
              </View>
            );
          },

          tabBarLabel: ({ focused }) => {
            const item = TAB_ITEMS.find((t) => t.name === route.name);
            return (
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
                style={[
                  styles.tabLabel,
                  focused && styles.tabLabelActive,
                ]}
              >
                {item?.label}
              </Text>
            );
          }
        })}
      >
        {dynamicTabItems.map((item) => (
          <Tab.Screen 
            key={item.name}
            name={item.name as keyof MainTabParamList} 
            component={item.component} 
          />
        ))}
      </Tab.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: "#F4F7FF",
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: '100%',
  },
  topIndicator: {
    position: 'absolute',
    top: -verticalScale(12), // Adjust up to the very top edge of the tab bar
    width: moderateScale(40),
    height: 3,
    backgroundColor: "#3B82F6",
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  iconWrapper: {
    alignItems: "center",
    justifyContent: "center",
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    marginTop: verticalScale(2),
  },
  activeIconWrapper: {
    backgroundColor: "#EFF6FF",
  },
  tabLabel: {
    fontSize: moderateScale(IS_TABLET ? 10 : 9),
    fontWeight: "500",
    color: "#94A3B8",
    letterSpacing: 0.3,
    marginTop: verticalScale(2),
    marginBottom: Platform.OS === "ios" ? 0 : verticalScale(4),
    textAlign: "center",
  },
  tabLabelActive: {
    fontWeight: "600",
    color: "#3B82F6",
  },
});