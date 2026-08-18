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
import EvilIcons from 'react-native-vector-icons/EvilIcons';
import { getStoredUser } from '../config/apiConfig';


type TabKey = 'income' | 'expense';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TAB_MARGIN = 16;
const TAB_PADDING = 4;
const CONTAINER_WIDTH = SCREEN_WIDTH - TAB_MARGIN * 2;
const TAB_WIDTH = (CONTAINER_WIDTH - TAB_PADDING * 2) / 2;

export default function IncomeExpenseScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<TabKey>('income');
  const [incomeCount, setIncomeCount] = useState<number | null>(null);
  const [expenseCount, setExpenseCount] = useState<number | null>(null);
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

  useEffect(() => {
    if (!hasIncomeView && hasExpenseView && activeTab === 'income') {
      handleTabChange('expense');
    }
  }, [hasIncomeView, hasExpenseView]);

  const isIncome = activeTab === 'income';

  const activeColor = isIncome ? '#10B981' : '#EF4444'; 

  // Smooth tab slide animation
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Debounce search input to avoid too many API calls
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchInput]);

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    Animated.spring(slideAnim, {
      toValue: tab === 'income' ? 0 : TAB_WIDTH,
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
              <TouchableOpacity onPress={() => { setShowSearch(false); setSearchInput(''); setSearchQuery(''); }} style={styles.searchBackBtn}>
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
                <TouchableOpacity onPress={() => { setSearchInput(''); setSearchQuery(''); }} style={styles.searchClearBtn}>
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
                <Text style={styles.headerSub}>
                  {isIncome ? 'Income Tracking' : 'Expense Tracking'}
                </Text>
              </View>

              <TouchableOpacity style={styles.searchIconCircle} activeOpacity={0.7} onPress={() => setShowSearch(true)}>
                <EvilIcons name="search" color="#FFFFFF" size={24} />
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* ─── Modern Segmented Switcher ─── */}
        <View style={styles.tabContainer}>
          {/* Animated Active Pill Indicator */}
          <Animated.View
            style={[
              styles.tabActiveBg,
              {
                transform: [{ translateX: slideAnim }],
              },
            ]}
          >
            <View style={[styles.topIndicator, { backgroundColor: activeColor }]} />
          </Animated.View>

          {/* Income Tab Button */}
          {hasIncomeView && (
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => handleTabChange('income')}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.iconWrapper,
                !isIncome && styles.unselectedIconChip,
              ]}
            >
              <MaterialIcons
                name="trending-up"
                size={18}
                color={isIncome ? '#007BFF' : '#FFFFFF'}
              />
            </View>
            <Text
              style={[
                styles.tabText,
                isIncome ? styles.tabTextActiveIncome : styles.tabTextUnselected,
              ]}
            >
              Income
            </Text>
          </TouchableOpacity>
          )}

          {/* Expense Tab Button */}
          {hasExpenseView && (
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => handleTabChange('expense')}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.iconWrapper,
                isIncome && styles.unselectedIconChip,
              ]}
            >
              <MaterialIcons
                name="trending-down"
                size={18}
                color={!isIncome ? '#007BFF' : '#FFFFFF'}
              />
            </View>
            <Text
              style={[
                styles.tabText,
                !isIncome ? styles.tabTextActiveExpense : styles.tabTextUnselected,
              ]}
            >
              Expense
            </Text>
          </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ─── Main Content Area ─── */}
      <FinanceView
        type={activeTab}
        searchQuery={searchQuery}
        onCountChange={(count) => activeTab === 'income' ? setIncomeCount(count) : setExpenseCount(count)}
        permissions={isSuperAdmin ? ['all'] : trackerPermissions}
      />
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
  notifDot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
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
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.22)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.45)',
  },
  pulseDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#22C55E',
    marginRight: 4,
  },
  liveText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#22C55E',
    letterSpacing: 0.5,
  },
  headerSub: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.75)',
    marginTop: 2,
    fontWeight: '400',
  },

  tabContainer: {
    flexDirection: 'row',
    height: 48,
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
    width: TAB_WIDTH,
    height: 48 - TAB_PADDING * 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
  },
  topIndicator: {
    display: 'none',
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  iconWrapper: {
    marginRight: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unselectedIconChip: {
    padding: 0,
    backgroundColor: 'transparent',
  },
  tabText: {
    fontSize: 14,
    letterSpacing: 0.2,
  },
  tabTextActiveIncome: {
    color: '#007BFF',
    fontWeight: '700',
  },
  tabTextActiveExpense: {
    color: '#007BFF',
    fontWeight: '700',
  },
  tabTextUnselected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});