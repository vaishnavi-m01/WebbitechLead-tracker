import React, { useState, useRef } from 'react';
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
import FinanceView from '../components/FinanceView';
import EvilIcons from 'react-native-vector-icons/EvilIcons';


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
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const isIncome = activeTab === 'income';

  // Dynamic color selection based on active tab state
  const activeColor = isIncome ? '#10B981' : '#EF4444'; // Emerald green for Income, Vibrant red for Expense

  // Smooth tab slide animation
  const slideAnim = useRef(new Animated.Value(0)).current;

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

      {/* ─── Premium Glass / Modern Header ─── */}
      <View style={[styles.header, { paddingTop: statusBarHeight + 12 }]}>
        {/* Top Navigation Row */}
        <View style={styles.headerRow}>
          {showSearch ? (
            <View style={styles.searchBarContainer}>
              <TouchableOpacity onPress={() => { setShowSearch(false); setSearchQuery(''); }} style={styles.searchBackBtn}>
                <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <TextInput
                style={styles.searchInput}
                placeholder="Search records..."
                placeholderTextColor="rgba(255,255,255,0.7)"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
                selectionColor="#FFFFFF"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.searchClearBtn}>
                  <MaterialIcons name="close" size={20} color="#FFFFFF" />
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

              <TouchableOpacity style={styles.iconCircle} activeOpacity={0.7} onPress={() => setShowSearch(true)}>
                <EvilIcons name="search" color="#FFFFFF" size={26} />
                <View style={styles.notifDot} />
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
                size={16}
                color={isIncome ? '#10B981' : '#FFFFFF'}
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

          {/* Expense Tab Button */}
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
                size={16}
                color={!isIncome ? '#EF4444' : '#FFFFFF'}
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
        </View>
      </View>

      {/* ─── Main Content Area ─── */}
      <FinanceView type={activeTab} searchQuery={searchQuery} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  header: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: TAB_MARGIN,
    paddingBottom: 18,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    height: 40,
  },
  searchBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 8,
    paddingHorizontal: 8,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
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
    height: 50,
    width: CONTAINER_WIDTH,
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
    borderRadius: 16,
    padding: TAB_PADDING,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)', // Outer glass ring effect
  },
  tabActiveBg: {
    position: 'absolute',
    top: TAB_PADDING,
    left: TAB_PADDING,
    width: TAB_WIDTH,
    height: 50 - TAB_PADDING * 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    overflow: 'hidden',
  },
  topIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: 3,
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
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 4,
    borderRadius: 8,
  },
  tabText: {
    fontSize: 14,
    letterSpacing: 0.2,
  },
  tabTextActiveIncome: {
    color: '#10B981',
    fontWeight: '700',
  },
  tabTextActiveExpense: {
    color: '#EF4444',
    fontWeight: '700',
  },
  tabTextUnselected: {
    color: '#FFFFFF',
    fontWeight: '600',
    opacity: 0.9,
  },
});