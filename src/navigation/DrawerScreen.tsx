
import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from "react-native";
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerContentComponentProps,
} from "@react-navigation/drawer";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useIsFocused } from "@react-navigation/native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import MainTabNavigator from "./Tabs";
import { COLORS } from "../theme/colors";
import api, { getStoredUser, clearAuthSession } from "../config/apiConfig";

const Drawer = createDrawerNavigator();

const DRAWER_ITEMS = [
  { key: "landing", label: "Landing", icon: "web" },
  { key: "contact", label: "Contact", icon: "contact-page" },
  { key: "dm", label: "Insta DM", icon: "chat" },
  { key: "graphic", label: "Graphic", icon: "brush" },
  { key: "accounts", label: "Accounts", icon: "account-balance-wallet" },
  // { key: "my-bills", label: "My Bills", icon: "receipt-long" },
];

// Shape of the "user" object as it comes back from the login API response
type LoggedInUser = {
  id?: number;
  name?: string;
  email?: string;
  user_type?: string;
  website_permissions?: string[];
  tracker_permissions?: string[];
};

// Turns "Webbitech Admin" -> "WA", "John" -> "J", falls back to "?" if no name
const getInitials = (name?: string) => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const initials = parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "");
  return initials.join("") || "?";
};

// Turns "super_admin" -> "Super Admin" for display
const formatRole = (role?: string) => {
  if (!role) return "User";
  return role
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

function CustomDrawerContent(props: DrawerContentComponentProps) {
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const [activeKey, setActiveKey] = React.useState("contact");
  const [user, setUser] = useState<LoggedInUser | null>(null);

 
  const loadUser = useCallback(async () => {
    try {
      const storedUser = await getStoredUser<LoggedInUser>();
      if (storedUser) {
        setUser(storedUser);
      }
    } catch (error) {
      console.error("Failed to load logged-in user for drawer", error);
    }
  }, []);

  useEffect(() => {
    if (isFocused) {
      loadUser();
    }
  }, [isFocused, loadUser]);

  const displayName = user?.name || "Guest User";
  const displayEmail = user?.email || "";
  const displayRole = formatRole(user?.user_type);

  const hasPermission = (key: string) => {
    if (user?.user_type === 'super_admin') return true;

    const webPerms = user?.website_permissions || [];
    const trackerPerms = user?.tracker_permissions || [];

    switch(key) {
      case 'landing': return webPerms.includes('landing_page_enquiries');
      case 'contact': return webPerms.includes('contact_page_enquiries');
      case 'dm': return webPerms.includes('dm_enquiries');
      case 'graphic': return webPerms.includes('graphic_design_enquiries');
      case 'accounts': return trackerPerms.length > 0;
      case 'my-bills': return trackerPerms.length > 0;
      default: return true;
    }
  };

  const permittedItems = DRAWER_ITEMS.filter(item => hasPermission(item.key));

  useEffect(() => {
    if ((user?.website_permissions || user?.tracker_permissions || user?.user_type === 'super_admin') && !hasPermission(activeKey) && permittedItems.length > 0) {
      setActiveKey(permittedItems[0].key);
    }
  }, [user]);

  return (
    <View style={styles.container}>
   
      <View style={[styles.drawerHeader, { paddingTop: insets.top + 20 }]}>
        <View style={styles.headerProfileRow}>

          <View style={styles.avatarContainer}>
            <Image
              source={require("../asset/images/logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <View style={styles.headerTextContainer}>
            <Text style={styles.drawerUserName} numberOfLines={1}>{displayName}</Text>
            {!!displayEmail && (
              <Text style={styles.drawerUserEmail} numberOfLines={1}>{displayEmail}</Text>
            )}
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{displayRole}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* 2. Menu Items inside ScrollView */}
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.drawerMenuList}>
          <Text style={styles.sectionHeader}>CATEGORIES</Text>
          {permittedItems.map((item) => {
            const focused = activeKey === item.key;
            return (
              <React.Fragment key={item.key}>
                {item.key === 'accounts' && (
                  <Text style={[styles.sectionHeader, { marginTop: 16 }]}>FINANCE</Text>
                )}
                
                <TouchableOpacity
                  style={[styles.drawerItem, focused && styles.drawerItemActive]}
                  activeOpacity={0.7}
                  onPress={() => {
                    setActiveKey(item.key);
                    if (item.key === 'accounts') {
                      props.navigation.navigate("MainTabs", {
                        screen: "FinanceTab",
                      });
                    } else if (item.key === 'my-bills') {
                      props.navigation.navigate("MainTabs", {
                        screen: "MyBillsTab",
                      });
                    } else {
                      props.navigation.navigate("MainTabs", {
                        screen: "HomeTab",
                        params: { category: item.key },
                      });
                    }
                    props.navigation.closeDrawer();
                  }}
                >
                  <MaterialIcons
                    name={item.icon}
                    size={22}
                    color={focused ? COLORS.accent : COLORS.textMuted}
                    style={styles.drawerItemIcon}
                  />
                  <Text
                    style={[
                      styles.drawerItemText,
                      focused && styles.drawerItemTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              </React.Fragment>
            );
          })}
        </View>
      </DrawerContentScrollView>

      {/* 3. Footer: Logout */}
      <View
        style={[
          styles.drawerFooter,
          { paddingBottom: Math.max(insets.bottom, 16) + 8 },
        ]}
      >
        <TouchableOpacity
          style={styles.logoutBtn}
          activeOpacity={0.8}
          onPress={() => {
            Alert.alert(
              "Confirm Logout",
              "Are you sure you want to logout?",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Logout",
                  style: "destructive",
                  onPress: async () => {
                    try {
                      // Attempt to notify server of logout, but don't block if it fails
                      await api.post('/logout').catch((e: any) => console.log('Logout API failed:', e.message));
                    } catch (e) {}
                    
                    try {
                      await clearAuthSession();
                      props.navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
                    } catch (error) {
                      console.error("Failed to clear session on logout", error);
                    }
                  }
                }
              ]
            );
          }}
        >
          <MaterialIcons name="logout" size={20} color={COLORS.error} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function DrawerScreen() {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false,
        drawerType: "front",
        drawerStyle: styles.drawerStyle,
        overlayColor: "rgba(15, 23, 42, 0.4)",
        swipeEdgeWidth: 60,
      }}
      drawerContent={(props: any) => <CustomDrawerContent {...props} />}
    >
      <Drawer.Screen name="MainTabs" component={MainTabNavigator} />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  drawerStyle: {
    width: "78%",
    backgroundColor: COLORS.surface,
  },
  drawerHeader: {
    width: "100%",
    backgroundColor: COLORS.accent,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerProfileRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 14,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  headerTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.accent,
  },
  drawerUserName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  drawerUserEmail: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.75)",
    marginBottom: 6,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  scrollContentContainer: {
    paddingTop: 0,
    paddingHorizontal: 0,
  },
  drawerMenuList: {
    paddingHorizontal: 12,
    paddingTop: 16,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.textMuted,
    marginBottom: 12,
    marginLeft: 12,
    letterSpacing: 0.8,
  },
  drawerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 4,
  },
  drawerItemActive: {
    backgroundColor: `${COLORS.accent}12`,
  },
  drawerItemIcon: {
    marginRight: 14,
  },
  drawerItemText: {
    fontSize: 15,
    fontWeight: "500",
    color: COLORS.text,
  },
  drawerItemTextActive: {
    color: COLORS.accent,
    fontWeight: "700",
  },
  drawerFooter: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: COLORS.surface,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: `${COLORS.error}10`,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${COLORS.error}20`,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.error,
    marginLeft: 8,
  },
});
