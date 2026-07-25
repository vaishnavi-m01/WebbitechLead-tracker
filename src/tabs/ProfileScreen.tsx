import React, { useCallback, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  RefreshControl,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { COLORS } from "../theme/colors";
import { getStoredUser, clearAuthSession } from "../config/apiConfig";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Shape of the "user" object as it comes back from the login API response
type LoggedInUser = {
  id?: number;
  name?: string;
  email?: string;
  user_type?: string;
};

const getInitials = (name?: string) => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const initials = parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "");
  return initials.join("") || "?";
};

const formatRole = (role?: string) => {
  if (!role) return "User";
  return role
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

type MenuItem = {
  icon: string;
  title: string;
  subtitle?: string;
  action?: () => void;
  isDestructive?: boolean;
};

const ProfileScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<LoggedInUser | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchProfileData = async () => {
    try {
      const storedUser = await getStoredUser<LoggedInUser>();
      if (storedUser) {
        setUser(storedUser);
      }
    } catch (error) {
      console.error("Failed to load logged-in user for profile", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProfileData();
    }, [])
  );

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchProfileData();
    // Simulate additional network delay if desired, or just let it finish immediately
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const displayName = user?.name || "Guest User";
  const displayEmail = user?.email || "";
  const displayRole = formatRole(user?.user_type);

  const handleLogout = async () => {
    try {
      await clearAuthSession();
    } catch (error) {
      console.error("Failed to clear session on logout", error);
    }
  };

  const renderMenuItem = (item: MenuItem, isLast: boolean) => (
    <TouchableOpacity
      key={item.title}
      style={[styles.menuItem, isLast && styles.menuItemLast]}
      activeOpacity={0.6}
      onPress={item.action}
    >
      <View
        style={[
          styles.menuIconWrap,
          { backgroundColor: item.isDestructive ? "#FEE2E2" : `${COLORS.accent}18` },
        ]}
      >
        <MaterialIcons
          name={item.icon as any}
          size={20}
          color={item.isDestructive ? "#EF4444" : COLORS.accent}
        />
      </View>
      <View style={styles.menuTextWrap}>
        <Text
          style={[styles.menuTitle, item.isDestructive && { color: "#EF4444" }]}
        >
          {item.title}
        </Text>
        {!!item.subtitle && (
          <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
        )}
      </View>
      {!item.isDestructive && (
        <MaterialIcons name="chevron-right" size={20} color="#CBD5E1" />
      )}
    </TouchableOpacity>
  );

  const accountItems: MenuItem[] = [
    { icon: "person-outline", title: "Personal Details", subtitle: "View & edit your info" },
    { icon: "notifications-none", title: "Notifications", subtitle: "Manage push & email alerts" },
    { icon: "lock-outline", title: "Security & Privacy", subtitle: "Password, 2FA & privacy" },
  ];

  const preferenceItems: MenuItem[] = [
    { icon: "payment", title: "Payment Methods", subtitle: "Cards & billing info" },
    { icon: "help-outline", title: "Help & Support", subtitle: "FAQ, chat & tickets" },
    { icon: "info-outline", title: "About", subtitle: "Version 1.0.0" },
  ];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.accent} />

      {/* Gradient-like hero header */}
      <View style={[styles.heroHeader, { paddingTop: insets.top + 16 }]}>
        {/* Online indicator on avatar */}
        <View style={styles.avatarWrap}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{getInitials(user?.name)}</Text>
          </View>
          <View style={styles.onlineDot} />
          <TouchableOpacity style={styles.cameraBtn} activeOpacity={0.8}>
            <MaterialIcons name="photo-camera" size={13} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <Text style={styles.heroName} numberOfLines={1}>{displayName}</Text>
        {!!displayEmail && (
          <Text style={styles.heroEmail} numberOfLines={1}>{displayEmail}</Text>
        )}
        <View style={styles.rolePill}>
          <MaterialIcons name="verified" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
          <Text style={styles.roleText}>{displayRole}</Text>
        </View>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Leads</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Enquiries</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Closed</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[COLORS.accent]}
            tintColor={COLORS.accent}
          />
        }
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 100, 120) },
        ]}
      >
        {/* Account section */}
        <Text style={styles.sectionLabel}>ACCOUNT</Text>
        <View style={styles.sectionCard}>
          {accountItems.map((item, i) =>
            renderMenuItem(item, i === accountItems.length - 1)
          )}
        </View>

        {/* Preferences section */}
        <Text style={styles.sectionLabel}>PREFERENCES</Text>
        <View style={styles.sectionCard}>
          {preferenceItems.map((item, i) =>
            renderMenuItem(item, i === preferenceItems.length - 1)
          )}
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutBtn}
          activeOpacity={0.8}
          onPress={handleLogout}
        >
          <MaterialIcons name="logout" size={18} color="#EF4444" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F1F5F9",
  },
  heroHeader: {
    backgroundColor: COLORS.accent,
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
  avatarWrap: {
    position: "relative",
    marginBottom: 14,
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.4)",
  },
  avatarText: {
    fontSize: 30,
    fontWeight: "700",
    color: COLORS.accent,
  },
  onlineDot: {
    position: "absolute",
    bottom: 4,
    left: 4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#10B981",
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  cameraBtn: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  heroName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
    textAlign: "center",
  },
  heroEmail: {
    fontSize: 13,
    color: "rgba(255,255,255,0.78)",
    marginBottom: 12,
    textAlign: "center",
  },
  rolePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  roleText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop:3,
    // marginTop: -1,
    borderRadius: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    elevation: 0,
    shadowOpacity: 0,
    marginBottom: 4,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    backgroundColor: "#E2E8F0",
  },
  statValue: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "500",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
    marginTop: 12,
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  menuTextWrap: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
    marginBottom: 1,
  },
  menuSubtitle: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "400",
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FEF2F2",
    borderRadius: 14,
    paddingVertical: 15,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  logoutText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#EF4444",
  },
});
