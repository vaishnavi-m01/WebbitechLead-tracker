import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
  StatusBar,
  Animated,
  Dimensions,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { COLORS } from '../theme/colors';
import FinanceView from '../component/FinanceView';
import BillsView from '../component/BillsView';
import EvilIcons from 'react-native-vector-icons/EvilIcons';
import { getStoredUser } from '../config/apiConfig';

export type TabKey = 'income' | 'expense' | 'bills';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TAB_MARGIN = 16;
const TAB_PADDING = 4;
const CONTAINER_WIDTH = SCREEN_WIDTH - TAB_MARGIN * 2;

export default function IncomeExpenseScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<TabKey>('income');
  const [incomeCount, setIncomeCount] = useState<number | null>(null);
  const [expenseCount, setExpenseCount] = useState<number | null>(null);
  const [billsCount, setBillsCount] = useState<number | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [trackerPermissions, setTrackerPermissions] = useState<string[]>([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    const loadPerms = async () => {
      const user = await getStoredUser<any>();
      if (user) {
        setIsSuperAdmin(user.user_type === 'super_admin');
        if (user.tracker_permissions) {
          setTrackerPermissions(user.tracker_permissions);
        }
      }
    };
    loadPerms();
  }, []);

  const hasIncomeView = isSuperAdmin || trackerPermissions.includes('102');
  const hasExpenseView = isSuperAdmin || trackerPermissions.includes('106');
  const hasBillsView = isSuperAdmin || trackerPermissions.length > 0;

  const availableTabs: { key: TabKey; label: string; icon: string }[] = [];
  if (hasIncomeView) availableTabs.push({ key: 'income', label: 'Income', icon: 'trending-up' });
  if (hasExpenseView) availableTabs.push({ key: 'expense', label: 'Expense', icon: 'trending-down' });
  if (hasBillsView) availableTabs.push({ key: 'bills', label: 'My Bills', icon: 'receipt-long' });

  const tabCount = availableTabs.length || 1;
  const tabWidth = (CONTAINER_WIDTH - TAB_PADDING * 2) / tabCount;

  useEffect(() => {
    if (!hasIncomeView && hasExpenseView && activeTab === 'income') {
      handleTabChange('expense');
    } else if (!hasIncomeView && !hasExpenseView && hasBillsView && activeTab === 'income') {
      handleTabChange('bills');
    }
  }, [hasIncomeView, hasExpenseView, hasBillsView]);

  // Smooth tab slide animation
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Debounce search input to avoid too many API calls
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 450);
    return () => clearTimeout(delayDebounceFn);
  }, [searchInput]);

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    const tabIndex = availableTabs.findIndex((t) => t.key === tab);
    const targetX = (tabIndex >= 0 ? tabIndex : 0) * tabWidth;
    Animated.spring(slideAnim, {
      toValue: targetX,
      useNativeDriver: true,
      tension: 68,
      friction: 10,
    }).start();
  };

  const handleOpenDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  const statusBarHeight =
    Platform.OS === 'android' ? StatusBar.currentHeight ?? 24 : insets.top;

  const subtitle =
    activeTab === 'income'
      ? 'Income Tracking'
      : activeTab === 'expense'
      ? 'Expense Tracking'
      : 'Recurring & Bills Tracking';

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      <View style={[styles.header, { paddingTop: statusBarHeight + 12 }]}>
        {/* Top Navigation Row */}
        <View style={styles.headerRow}>
          {showSearch ? (
            <View style={styles.searchBarContainer}>
              <TouchableOpacity
                onPress={() => {
                  setShowSearch(false);
                  setSearchInput('');
                  setSearchQuery('');
                }}
                style={styles.searchBackBtn}
              >
                <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <TextInput
                style={styles.searchInput}
                placeholder="Search records..."
                placeholderTextColor="rgba(255,255,255,0.7)"
                value={searchInput}
                onChangeText={(text) => {
                  setSearchInput(text);
                }}
                returnKeyType="search"
                autoFocus
                selectionColor="#FFFFFF"
              />
              {searchInput.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setSearchInput('');
                    setSearchQuery('');
                  }}
                  style={styles.searchClearBtn}
                >
                  <MaterialIcons name="close" size={22} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <>
              <TouchableOpacity
                onPress={handleOpenDrawer}
                style={styles.iconCircle}
                activeOpacity={0.7}
              >
                <MaterialIcons name="menu" size={22} color="#FFFFFF" />
              </TouchableOpacity>

              <View style={styles.titleBlock}>
                <View style={styles.titleRow}>
                  <Text style={styles.headerLabel}>Accounts</Text>
                </View>
                <Text style={styles.headerSub}>{subtitle}</Text>
              </View>

              <TouchableOpacity
                style={styles.searchIconCircle}
                activeOpacity={0.7}
                onPress={() => setShowSearch(true)}
              >
                <EvilIcons name="search" color="#FFFFFF" size={24} />
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* ─── Modern 3-Way Segmented Switcher (Income / Expense / My Bills) ─── */}
        <View style={styles.tabContainer}>
          {/* Animated Active Pill Indicator */}
          <Animated.View
            style={[
              styles.tabActiveBg,
              {
                width: tabWidth,
                transform: [{ translateX: slideAnim }],
              },
            ]}
          />

          {/* Dynamic Tab Buttons */}
          {availableTabs.map((item) => {
            const isFocused = activeTab === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                style={styles.tabItem}
                onPress={() => handleTabChange(item.key)}
                activeOpacity={0.8}
              >
                <View style={styles.iconWrapper}>
                  <MaterialIcons
                    name={item.icon as any}
                    size={16}
                    color={isFocused ? '#007BFF' : '#FFFFFF'}
                  />
                </View>
                <Text
                  style={[
                    styles.tabText,
                    isFocused ? styles.tabTextActive : styles.tabTextUnselected,
                  ]}
                  numberOfLines={1}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ─── Main Content Area ─── */}
      {activeTab === 'bills' ? (
        <BillsView
          searchQuery={searchQuery}
          onCountChange={(count) => setBillsCount(count)}
          permissions={isSuperAdmin ? ['all'] : trackerPermissions}
        />
      ) : (
        <FinanceView
          type={activeTab as 'income' | 'expense'}
          searchQuery={searchQuery}
          onCountChange={(count) =>
            activeTab === 'income' ? setIncomeCount(count) : setExpenseCount(count)
          }
          permissions={isSuperAdmin ? ['all'] : trackerPermissions}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    backgroundColor: '#007BFF',
    paddingHorizontal: TAB_MARGIN,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    height: 40,
  },
  searchBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 40,
  },
  searchBackBtn: {
    padding: 4,
    marginRight: 8,
  },
  searchClearBtn: {
    padding: 4,
    marginLeft: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    padding: 0,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleBlock: {
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  headerSub: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.75)',
    marginTop: 2,
    fontWeight: '400',
  },
  tabContainer: {
    flexDirection: 'row',
    height: 46,
    width: CONTAINER_WIDTH,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderRadius: 8,
    padding: TAB_PADDING,
    position: 'relative',
  },
  tabActiveBg: {
    position: 'absolute',
    top: TAB_PADDING,
    left: TAB_PADDING,
    height: 46 - TAB_PADDING * 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    paddingHorizontal: 4,
  },
  iconWrapper: {
    marginRight: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 13,
    letterSpacing: 0.2,
  },
  tabTextActive: {
    color: '#007BFF',
    fontWeight: '700',
  },
  tabTextUnselected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});