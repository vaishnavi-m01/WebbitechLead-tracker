// import React from "react";
// import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
// import {
//   createDrawerNavigator,
//   DrawerContentScrollView,
//   DrawerContentComponentProps,
// } from "@react-navigation/drawer";
// import { useSafeAreaInsets } from "react-native-safe-area-context";
// import MaterialIcons from "react-native-vector-icons/MaterialIcons";
// import MainTabNavigator from "./Tabs";
// import { COLORS } from "../theme/colors";

// const Drawer = createDrawerNavigator();

// const DRAWER_ITEMS = [
//   { key: "landing", label: "Landing", icon: "web" },
//   { key: "contact", label: "Contact", icon: "contact-page" },
//   { key: "dm", label: "Insta DM", icon: "chat" },
//   { key: "graphic", label: "Graphic", icon: "brush" },
//   { key: "media", label: "Media", icon: "campaign" },
// ];

// function CustomDrawerContent(props: DrawerContentComponentProps) {
//   const insets = useSafeAreaInsets();
//   const [activeKey, setActiveKey] = React.useState("landing");

//   return (
//     <View style={styles.container}>
//       {/* 1. Full-Width Edge-to-Edge Accent Header */}
//       <View style={[styles.drawerHeader, { paddingTop: insets.top + 24 }]}>
//         <View style={styles.avatarCircle}>
//           <MaterialIcons name="person" size={36} color={COLORS.accent} />
//         </View>
//         <Text style={styles.drawerUserName}>Admin User</Text>
//         <Text style={styles.drawerUserEmail}>admin@company.com</Text>

//         <View style={styles.roleBadge}>
//           <Text style={styles.roleText}>Administrator</Text>
//         </View>
//       </View>

//       {/* 2. Menu Items inside ScrollView */}
//       <DrawerContentScrollView
//         {...props}
//         contentContainerStyle={styles.scrollContentContainer}
//         showsVerticalScrollIndicator={false}
//       >
//         <View style={styles.drawerMenuList}>
//           <Text style={styles.sectionHeader}>CATEGORIES</Text>
//           {DRAWER_ITEMS.map((item) => {
//             const focused = activeKey === item.key;
//             return (
//               <TouchableOpacity
//                 key={item.key}
//                 style={[styles.drawerItem, focused && styles.drawerItemActive]}
//                 activeOpacity={0.7}
//                 onPress={() => {
//                   setActiveKey(item.key);
//                   props.navigation.navigate("MainTabs", {
//                     screen: "HomeTab",
//                     params: { category: item.key },
//                   });
//                   props.navigation.closeDrawer();
//                 }}
//               >
//                 <MaterialIcons
//                   name={item.icon}
//                   size={22}
//                   color={focused ? COLORS.accent : COLORS.textMuted}
//                   style={styles.drawerItemIcon}
//                 />
//                 <Text
//                   style={[
//                     styles.drawerItemText,
//                     focused && styles.drawerItemTextActive,
//                   ]}
//                 >
//                   {item.label}
//                 </Text>
//               </TouchableOpacity>
//             );
//           })}
//         </View>
//       </DrawerContentScrollView>

//       {/* 3. Footer: Logout */}
//       <View
//         style={[
//           styles.drawerFooter,
//           { paddingBottom: Math.max(insets.bottom, 16) + 8 },
//         ]}
//       >
//         <TouchableOpacity
//           style={styles.logoutBtn}
//           activeOpacity={0.8}
//           onPress={() => console.log("Logout pressed")}
//         >
//           <MaterialIcons name="logout" size={20} color={COLORS.error} />
//           <Text style={styles.logoutText}>Log Out</Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// }

// export default function DrawerScreen() {
//   return (
//     <Drawer.Navigator
//       screenOptions={{
//         headerShown: false,
//         drawerType: "front",
//         drawerStyle: styles.drawerStyle,
//         overlayColor: "rgba(15, 23, 42, 0.4)",
//         swipeEdgeWidth: 60,
//       }}
//       drawerContent={(props: any) => <CustomDrawerContent {...props} />}
//     >
//       <Drawer.Screen name="MainTabs" component={MainTabNavigator} />
//     </Drawer.Navigator>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: COLORS.surface,
//   },
//   drawerStyle: {
//     width: "78%",
//     backgroundColor: COLORS.surface,
//   },
//   /* Full bleed Accent Header - No gaps on left/right */
//   drawerHeader: {
//     width: "100%",
//     backgroundColor: COLORS.accent,
//     paddingHorizontal: 20,
//     paddingBottom: 24,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   avatarCircle: {
//     width: 68,
//     height: 68,
//     borderRadius: 34,
//     backgroundColor: "#FFFFFF",
//     alignItems: "center",
//     justifyContent: "center",
//     marginBottom: 12,
//   },
//   drawerUserName: {
//     fontSize: 18,
//     fontWeight: "700",
//     color: "#FFFFFF",
//     textAlign: "center",
//   },
//   drawerUserEmail: {
//     fontSize: 13,
//     color: "rgba(255, 255, 255, 0.8)",
//     marginTop: 2,
//     marginBottom: 10,
//     textAlign: "center",
//   },
//   roleBadge: {
//     backgroundColor: "rgba(255, 255, 255, 0.2)",
//     paddingHorizontal: 12,
//     paddingVertical: 4,
//     borderRadius: 20,
//   },
//   roleText: {
//     fontSize: 11,
//     fontWeight: "700",
//     color: "#FFFFFF",
//     textTransform: "uppercase",
//     letterSpacing: 0.6,
//   },
//   scrollContentContainer: {
//     paddingTop: 0,
//     paddingHorizontal: 0,
//   },
//   drawerMenuList: {
//     paddingHorizontal: 12,
//     paddingTop: 16,
//   },
//   sectionHeader: {
//     fontSize: 11,
//     fontWeight: "800",
//     color: COLORS.textMuted,
//     marginBottom: 12,
//     marginLeft: 12,
//     letterSpacing: 0.8,
//   },
//   drawerItem: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingVertical: 13,
//     paddingHorizontal: 14,
//     borderRadius: 12,
//     marginBottom: 4,
//   },
//   drawerItemActive: {
//     backgroundColor: `${COLORS.accent}12`,
//   },
//   drawerItemIcon: {
//     marginRight: 14,
//   },
//   drawerItemText: {
//     fontSize: 15,
//     fontWeight: "500",
//     color: COLORS.text,
//   },
//   drawerItemTextActive: {
//     color: COLORS.accent,
//     fontWeight: "700",
//   },
//   drawerFooter: {
//     borderTopWidth: 1,
//     borderTopColor: COLORS.border,
//     paddingHorizontal: 16,
//     paddingTop: 16,
//     backgroundColor: COLORS.surface,
//   },
//   logoutBtn: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     backgroundColor: `${COLORS.error}10`,
//     paddingVertical: 13,
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: `${COLORS.error}20`,
//   },
//   logoutText: {
//     fontSize: 15,
//     fontWeight: "700",
//     color: COLORS.error,
//     marginLeft: 8,
//   },
// }); 


import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
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
import { getStoredUser, clearAuthSession } from "../config/apiConfig";

const Drawer = createDrawerNavigator();

const DRAWER_ITEMS = [
  { key: "landing", label: "Landing", icon: "web" },
  { key: "contact", label: "Contact", icon: "contact-page" },
  { key: "dm", label: "Insta DM", icon: "chat" },
  { key: "graphic", label: "Graphic", icon: "brush" },
  // { key: "media", label: "Media", icon: "campaign" },
];

// Shape of the "user" object as it comes back from the login API response
type LoggedInUser = {
  id?: number;
  name?: string;
  email?: string;
  user_type?: string;
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
  const [activeKey, setActiveKey] = React.useState("landing");
  const [user, setUser] = useState<LoggedInUser | null>(null);

  // Loads the logged-in user saved during login (via apiConfig's getStoredUser,
  // which reads the "auth_user" AsyncStorage key set at login time).
  // Re-reads whenever the drawer regains focus, so if the user updates their
  // profile elsewhere in the app, the drawer picks up the change automatically.
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

  return (
    <View style={styles.container}>
      {/* 1. Real-Time App Style Header */}
      <View style={[styles.drawerHeader, { paddingTop: insets.top + 20 }]}>
        <View style={styles.headerProfileRow}>

          {/* <View style={styles.avatarContainer}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitials}>{getInitials(user?.name)}</Text>
            </View>
            <View style={styles.onlineBadge} />
          </View> */}


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
          {DRAWER_ITEMS.map((item) => {
            const focused = activeKey === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                style={[styles.drawerItem, focused && styles.drawerItemActive]}
                activeOpacity={0.7}
                onPress={() => {
                  setActiveKey(item.key);
                  props.navigation.navigate("MainTabs", {
                    screen: "HomeTab",
                    params: { category: item.key },
                  });
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
          onPress={async () => {
            try {
              // Clears both the token (memory + AsyncStorage) and the stored
              // user object, so the drawer/profile reset to guest state.
              await clearAuthSession();
            } catch (error) {
              console.error("Failed to clear session on logout", error);
            }
            console.log("Logout pressed");
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
