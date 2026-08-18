
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Alert,
  ScrollView,
  ToastAndroid,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Dropdown } from 'react-native-element-dropdown';
import { COLORS } from '../theme/colors';
import { exportCopy, exportExcel, exportCSV, exportPrint, exportPDF } from '../utils/exportUtils';
import AddCategoryModal from './AddCategoryModal';
import AddAmountModal from './AddAmountModal';
import {
  TrackerAmount,
  TrackerCategory,
  getIncomeAmounts,
  getIncomeCategories,
  getExpenseAmounts,
  getExpenseCategories,
  deleteIncomeAmount,
  deleteExpenseAmount,
  searchIncomeAmount,
  searchExpenseAmount,
  filterIncomeAmount,
  filterExpenseAmount,
} from '../services/Trackerapi';

interface FinanceViewProps {
  type: 'income' | 'expense';
  searchQuery?: string;
  onCountChange?: (count: number) => void;
  permissions?: string[];
}

const formatDate = (date: Date) => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

// API dates come back as "YYYY-MM-DD" — convert to a real Date safely.
const parseApiDate = (value?: string): Date | null => {
  if (!value) return null;
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
};

/* ─── Pagination constant ─── */
const PAGE_SIZE = 10;

export default function FinanceView({ type, searchQuery = '', onCountChange, permissions }: FinanceViewProps) {
  const tabBarHeight = useBottomTabBarHeight();
  const isIncome = type === 'income';
  const themeColor = isIncome ? '#10B981' : '#EF4444';
  const loadingColor = COLORS.accent;

  // Data from API
  const [amounts, setAmounts] = useState<TrackerAmount[]>([]);
  const [categories, setCategories] = useState<TrackerCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);

  // Filters — date filter is OFF by default.
  const [dateFilterActive, setDateFilterActive] = useState(false);
  const [fromDate, setFromDate] = useState<Date>(new Date());
  const [toDate, setToDate] = useState<Date>(new Date());
  const [dateRangeType, setDateRangeType] = useState<string>('custom');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [showExport, setShowExport] = useState(false);

  // Modals & FAB
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showAmountModal, setShowAmountModal] = useState(false);
  const [showFabMenu, setShowFabMenu] = useState(false);
  const [editingAmount, setEditingAmount] = useState<TrackerAmount | null>(null);
  const [exportingType, setExportingType] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const isSearch = searchQuery.trim().length > 0;
      const isFilter = (selectedCategory && selectedCategory !== 'All') || dateFilterActive;

      const filterParams = {
        category_id: selectedCategory !== 'All' ? selectedCategory : undefined,
        start_date: dateFilterActive ? formatDate(fromDate) : undefined,
        end_date: dateFilterActive ? formatDate(toDate) : undefined,
      };

      let amountsRes: any = { data: [] };
      let categoriesRes: any = { data: [] };

      try {
        if (isSearch) {
          amountsRes = await (isIncome 
            ? searchIncomeAmount(searchQuery.trim()) 
            : searchExpenseAmount(searchQuery.trim()));
        } else if (isFilter) {
          amountsRes = await (isIncome 
            ? filterIncomeAmount(filterParams) 
            : filterExpenseAmount(filterParams));
        } else {
          amountsRes = await (isIncome ? getIncomeAmounts() : getExpenseAmounts());
        }
      } catch (err: any) {
        if (err?.response?.status === 404 || err?.message?.includes('404') || err?.response?.data?.success === false) {
          amountsRes = { data: [] };
        } else {
          throw err;
        }
      }

      try {
        categoriesRes = await (isIncome ? getIncomeCategories() : getExpenseCategories());
      } catch (err: any) {
        console.error('Failed to fetch categories:', err);
      }
      
      const rawAmounts = amountsRes.data as any;
      const rawCategories = categoriesRes.data as any;

      const amountsArray: TrackerAmount[] = Array.isArray(rawAmounts)
        ? rawAmounts
        : Array.isArray(rawAmounts?.data)
        ? rawAmounts.data
        : [];

      const categoriesArray: TrackerCategory[] = Array.isArray(rawCategories)
        ? rawCategories
        : Array.isArray(rawCategories?.data)
        ? rawCategories.data
        : [];

      // Log compact summary only — never log raw API objects (causes TOO BIG console flood)
      console.log(`[FinanceView] Loaded: ${amountsArray.length} amounts, ${categoriesArray.length} categories`);

      // Reverse the array so the most recently added items appear at the top
      setAmounts([...amountsArray].reverse());
      if (onCountChange) {
        onCountChange(amountsArray.length);
      }
      if (categoriesArray.length > 0) {
        setCategories(categoriesArray);
      }
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load data');
      setAmounts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isIncome, searchQuery, selectedCategory, dateFilterActive, fromDate, toDate, refreshCount]);

  useEffect(() => {
    if (!amounts.length) {
      setLoading(true);
    }
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setAmounts([]); // Wipes data to show a blank page during refresh
    setRefreshing(true);
    setSelectedCategory('All');
    setDateFilterActive(false);
    setDateRangeType('custom');
    setRefreshCount(c => c + 1); // Forces loadData dependency to change and trigger API call
  };

  const categoryOptions = [
    { label: 'All', value: 'All' },
    ...(Array.isArray(categories) ? categories : []).map((c) => ({ label: c.name, value: String(c.id) })),
  ];

  const dateRangeOptions = [
    { label: 'Custom Range', value: 'custom' },
    { label: 'Today', value: 'today' },
    { label: 'This Week', value: 'week' },
    { label: 'This Month', value: 'month' },
    { label: 'This Year', value: 'year' },
  ];

  const handleDateRangeChange = (type: string) => {
    setDateRangeType(type);
    if (type === 'custom') return;

    const now = new Date();
    let start = new Date();
    let end = new Date();

    if (type === 'today') {
      start = new Date();
      end = new Date();
    } else if (type === 'week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      start = new Date(now.setDate(diff));
      end = new Date(); // To today
    } else if (type === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else if (type === 'year') {
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31);
    }

    setFromDate(start);
    setToDate(end);
    setDateFilterActive(true);
  };

  const getRecordDate = (item: TrackerAmount) => {
    const d = isIncome ? item.income_date : item.expensive_date;
    if (d && d !== 'null' && d !== '0000-00-00') return d;
    if (item.created_at) return item.created_at.split('T')[0];
    return 'N/A';
  };

  const getCategoryName = (item: TrackerAmount) =>
    item.category_name ??
    (Array.isArray(categories) ? categories : []).find((c) => c.id === item.category_id)?.name ??
    'Uncategorized';

  const currentData = Array.isArray(amounts) ? amounts : [];

  // Reset to page 1 whenever the filtered list changes size
  const prevFilteredLenRef = React.useRef(0);
  React.useEffect(() => {
    if (prevFilteredLenRef.current !== currentData.length) {
      setCurrentPage(1);
      prevFilteredLenRef.current = currentData.length;
    }
  }, [currentData.length]);

  const totalPages = currentData.length > 0 ? Math.ceil(currentData.length / PAGE_SIZE) : 0;
  const pagedData = currentData.slice(0, currentPage * PAGE_SIZE);

  // Pagination footer removed for infinite scroll

  const getFilteredExportConfig = () => {
    const data = currentData; // already filtered by date & search
    return {
      data,
      title: isIncome ? 'Income Records' : 'Expense Records',
      accent: isIncome ? '#10B981' : '#EF4444',
      headers: ['#', 'Date', 'Category', 'Description', 'Amount'],
      toExcelRow: (l: TrackerAmount) => ({
        'Date': getRecordDate(l),
        'Category': getCategoryName(l),
        'Description': l.description || '',
        'Amount': l.amount,
      }),
      toCsvCells: (l: TrackerAmount) => [getRecordDate(l), getCategoryName(l), l.description || '', l.amount],
      toCopyLine: (l: TrackerAmount, i: number) =>
        `#${i + 1}\\nDate: ${getRecordDate(l)}\\nCategory: ${getCategoryName(l)}\\nAmount: ${l.amount}`,
      toPrintCells: (l: TrackerAmount, i: number) =>
        `<td>${i + 1}</td><td>${getRecordDate(l)}</td><td>${getCategoryName(l)}</td><td>${l.description || '-'}</td><td>${l.amount}</td>`,
    };
  };

  const handleExportCopy = async () => {
    if (exportingType) return;
    setExportingType('Copy');
    try { exportCopy(getFilteredExportConfig()); } catch { ToastAndroid.show('Failed to copy', ToastAndroid.SHORT); }
    finally { setExportingType(null); }
  };
  const handleExportExcel = async () => {
    if (exportingType) return;
    setExportingType('Excel');
    try { await exportExcel(getFilteredExportConfig()); } catch { ToastAndroid.show('Failed to export', ToastAndroid.SHORT); }
    finally { setExportingType(null); }
  };
  const handleExportCSV = async () => {
    if (exportingType) return;
    setExportingType('CSV');
    try { await exportCSV(getFilteredExportConfig()); } catch { ToastAndroid.show('Failed to export', ToastAndroid.SHORT); }
    finally { setExportingType(null); }
  };
  const handlePrint = async () => {
    if (exportingType) return;
    setExportingType('Print');
    try { await exportPrint(getFilteredExportConfig(), 'Finance'); } catch { ToastAndroid.show('Failed to print', ToastAndroid.SHORT); }
    finally { setExportingType(null); }
  };
  const handleExportPDF = async () => {
    if (exportingType) return;
    setExportingType('PDF');
    try { await exportPDF(getFilteredExportConfig(), 'Finance'); } catch { ToastAndroid.show('Failed to export PDF', ToastAndroid.SHORT); }
    finally { setExportingType(null); }
  };

  const handleDelete = (item: TrackerAmount) => {
    Alert.alert(
      'Delete record',
      `Are you sure you want to delete "${item.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (isIncome) {
                await deleteIncomeAmount(item.id);
              } else {
                await deleteExpenseAmount(item.id);
              }
              setAmounts((prev) => prev.filter((a) => a.id !== item.id));
            } catch (err: any) {
              Alert.alert('Delete failed', err?.message ?? 'Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleEdit = (item: TrackerAmount) => {
    setEditingAmount(item);
    setShowAmountModal(true);
  };

  const onChangeFromDate = (event: any, selectedDate?: Date) => {
    setShowFromPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setFromDate(selectedDate);
      setDateFilterActive(true); // user explicitly set a date
    }
  };

  const onChangeToDate = (event: any, selectedDate?: Date) => {
    setShowToPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setToDate(selectedDate);
      setDateFilterActive(true); // user explicitly set a date
    }
  };

  const resetDateFilter = () => {
    setDateFilterActive(false);
    setFromDate(new Date());
    setToDate(new Date());
  };



  const renderCard = ({ item }: { item: TrackerAmount }) => {
    const recordDate = parseApiDate(getRecordDate(item) ?? undefined);
    return (
      <View style={styles.cardContainer}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
          </View>
          <Text style={[styles.cardAmount, { color: themeColor }]}>
            {isIncome ? '+' : '-'}₹{item.amount}
          </Text>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.cardDetailRow}>
            <View style={styles.metaChip}>
              <Text style={styles.metaLabel}>Category:</Text>
              <Text style={styles.metaChipText}>{getCategoryName(item)}</Text>
            </View>
            <View style={styles.metaChip}>
              <Text style={styles.metaLabel}>Date:</Text>
              <Text style={styles.metaChipText}>{recordDate ? formatDate(recordDate) : '—'}</Text>
            </View>
          </View>
          {item.description ? (
            <View style={styles.cardDetailRow}>
              <Text style={styles.metaLabel}>Note:</Text>
              <Text style={styles.cardDetailText} numberOfLines={2}>{item.description}</Text>
            </View>
          ) : null}
        </View>

        {(permissions?.includes('all') || permissions?.includes(isIncome ? '104' : '108') || permissions?.includes(isIncome ? '105' : '109')) && (
          <View style={styles.cardFooter}>
            {(permissions?.includes('all') || permissions?.includes(isIncome ? '104' : '108')) && (
              <TouchableOpacity style={styles.actionBtnEdit} onPress={() => handleEdit(item)}>
                <MaterialIcons name="edit" size={16} color={COLORS.accent} />
              </TouchableOpacity>
            )}
            {(permissions?.includes('all') || permissions?.includes(isIncome ? '105' : '109')) && (
              <TouchableOpacity style={styles.actionBtnDelete} onPress={() => handleDelete(item)}>
                <MaterialIcons name="delete-outline" size={16} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={styles.loadingText}>Fetching your records...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={pagedData}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderCard}
        contentContainerStyle={[styles.listContainer, { flexGrow: 1, paddingBottom: tabBarHeight + 80 }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.dashboardHeaderContainer}>
            {/* 1. Status (Category) & Export */}
            <View style={styles.statusExportRow}>
              <View style={styles.statusBlock}>
                <View style={styles.modernDropdownWrapper}>
                  <Dropdown
                    style={styles.modernDropdown}
                    placeholderStyle={styles.modernPlaceholderStyle}
                    selectedTextStyle={styles.modernSelectedTextStyle}
                    iconStyle={styles.modernIconStyle}
                    containerStyle={styles.dropdownContainer}
                    itemTextStyle={styles.dropdownItemText}
                    data={categoryOptions}
                    maxHeight={250}
                    labelField="label"
                    valueField="value"
                    placeholder="All Status"
                    value={selectedCategory}
                    onChange={(item) => setSelectedCategory(item.value)}
                  />
                </View>
              </View>

              <View style={styles.exportBlock}>
                <TouchableOpacity
                  style={[styles.modernExportBtn, exportingType && exportingType !== 'Excel' && { opacity: 0.6 }]}
                  onPress={handleExportExcel}
                  activeOpacity={0.7}
                  disabled={!!exportingType}
                >
                  <MaterialIcons name="file-download" size={16} color={COLORS.accent} />
                  <Text style={styles.modernExportText}>{exportingType === 'Excel' ? 'Wait...' : 'Export'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 2. Date Range Selection */}
            <View style={styles.dateRangeRow}>
              <TouchableOpacity style={styles.dateBlockCard} onPress={() => setShowFromPicker(true)} activeOpacity={0.7}>
                <View style={styles.floatingLabelContainer}>
                  <Text style={styles.floatingLabel}>START DATE</Text>
                </View>
                <Text style={[styles.dateButtonText, !dateFilterActive && { color: '#94A3B8', fontWeight: '500' }]}>
                  {dateFilterActive ? formatDate(fromDate) : 'Select Date'}
                </Text>
                <MaterialIcons name="event" size={16} color="#0F172A" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.dateBlockCard} onPress={() => setShowToPicker(true)} activeOpacity={0.7}>
                <View style={styles.floatingLabelContainer}>
                  <Text style={styles.floatingLabel}>END DATE</Text>
                </View>
                <Text style={[styles.dateButtonText, !dateFilterActive && { color: '#94A3B8', fontWeight: '500' }]}>
                  {dateFilterActive ? formatDate(toDate) : 'Select Date'}
                </Text>
                <MaterialIcons name="event" size={16} color="#0F172A" />
              </TouchableOpacity>
            </View>

            {/* 3. Export Options */}
            <View style={styles.exportActionContainer}>
              <View style={styles.exportGroup}>
                {[
                  { label: 'Copy', onPress: handleExportCopy },
                  { label: 'Excel', onPress: handleExportExcel },
                  { label: 'CSV', onPress: handleExportCSV },
                  { label: 'Print', onPress: handlePrint },
                  { label: 'PDF', onPress: handleExportPDF },
                ].map((action) => (
                  <TouchableOpacity
                    key={action.label}
                    style={[styles.exportButton, exportingType && exportingType !== action.label && { opacity: 0.6 }]}
                    onPress={action.onPress}
                    activeOpacity={0.7}
                    disabled={!!exportingType}
                  >
                    {exportingType === action.label ? (
                      <ActivityIndicator size="small" color="#94A3B8" />
                    ) : (
                      <Text style={styles.exportText}>{action.label}</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[themeColor]} tintColor={themeColor} />
        }
        onEndReached={() => {
          if (currentPage < totalPages && !isFetchingMore) {
            setIsFetchingMore(true);
            setTimeout(() => {
              setCurrentPage(prev => prev + 1);
              setIsFetchingMore(false);
            }, 300);
          }
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isFetchingMore ? (
            <View style={{ paddingVertical: 12, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={COLORS.accent} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            {loading && !refreshing ? (
              <ActivityIndicator size="large" color={COLORS.accent} />
            ) : (
              !refreshing && (
                <>
                  <MaterialIcons name="receipt-long" size={48} color="#CBD5E1" />
                  <Text style={styles.emptyText}>No financial records found</Text>
                </>
              )
            )}
          </View>
        }
      />

      {/* FAB Menu & Overlay */}
      {showFabMenu && (
        <TouchableOpacity
          style={styles.fabOverlay}
          activeOpacity={1}
          onPress={() => setShowFabMenu(false)}
        />
      )}

      {showFabMenu && (
        <View style={[styles.fabMenuContainer, { bottom: tabBarHeight + 70 }]}>
          {(permissions?.includes('all') || permissions?.includes(isIncome ? '103' : '107')) && (
            <TouchableOpacity
              style={styles.fabMenuItem}
              onPress={() => { setShowFabMenu(false); setShowCategoryModal(true); }}
            >
              <Text style={styles.fabMenuText}>Add Category</Text>
              <View style={styles.fabMenuIconWrap}>
                <MaterialIcons name="category" size={18} color={themeColor} />
              </View>
            </TouchableOpacity>
          )}
          {(permissions?.includes('all') || permissions?.includes(isIncome ? '102' : '106')) && (
            <TouchableOpacity
              style={styles.fabMenuItem}
              onPress={() => { setShowFabMenu(false); setEditingAmount(null); setShowAmountModal(true); }}
            >
              <Text style={styles.fabMenuText}>Add Amount</Text>
              <View style={styles.fabMenuIconWrap}>
                <MaterialIcons name="attach-money" size={18} color={themeColor} />
              </View>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Main FAB (Flat style - No shadow) */}
      <TouchableOpacity
        style={[styles.fab, { bottom: tabBarHeight + 16, backgroundColor: COLORS.accent }]}
        onPress={() => setShowFabMenu(!showFabMenu)}
        activeOpacity={0.8}
      >
        <MaterialIcons name={showFabMenu ? 'close' : 'add'} size={26} color="#FFFFFF" />
      </TouchableOpacity>

      {showFromPicker && (
        <DateTimePicker
          value={fromDate}
          mode="date"
          display="default"
          onChange={onChangeFromDate}
        />
      )}

      {showToPicker && (
        <DateTimePicker
          value={toDate}
          mode="date"
          display="default"
          onChange={onChangeToDate}
        />
      )}

      <AddCategoryModal
        visible={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        type={type}
        onSuccess={loadData}
        permissions={permissions}
      />

      <AddAmountModal
        visible={showAmountModal}
        onClose={() => { setShowAmountModal(false); setEditingAmount(null); }}
        type={type}
        editItem={editingAmount}
        onSuccess={loadData}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '500',
  },
  listContainer: {
    paddingHorizontal: 16,
  },

  dashboardHeaderContainer: {
    backgroundColor: 'transparent',
    paddingTop: 12,
    marginBottom: 12,
  },
  dateRangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    marginTop: 18,
  },
  dateBlockCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 38,
    position: 'relative',
  },
  floatingLabelContainer: {
    position: 'absolute',
    top: -8,
    left: 10,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 4,
    zIndex: 1,
  },
  floatingLabel: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  dateButtonText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '600',
  },
  statusExportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  statusBlock: {
    flex: 1,
  },
  exportBlock: {
    width: 100,
  },
  modernDropdownWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modernDropdown: {
    height: 38,
    paddingHorizontal: 12,
  },
  modernPlaceholderStyle: {
    color: '#94A3B8',
    fontSize: 13,
  },
  modernSelectedTextStyle: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '600',
  },
  modernIconStyle: {
    width: 20,
    height: 20,
    tintColor: '#94A3B8',
  },
  modernExportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    height: 38,
    backgroundColor: 'rgba(0,123,255,0.08)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,123,255,0.2)',
  },
  modernExportBtnActive: {
    backgroundColor: COLORS.accent,
  },
  modernExportText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '700',
  },
  exportActionContainer: {
    alignItems: 'stretch',
    marginBottom: 4,
  },
  exportGroup: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 8,
    padding: 4,
    justifyContent: 'space-between',
  },
  exportButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1,
    alignItems: 'center',
  },
  exportText: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "700",
  },
  dropdownContainer: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 8,
  },
  dropdownItemContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownItemText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
  },


  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 10,
  },
  errorBannerText: {
    flex: 1,
    color: '#B91C1C',
    fontSize: 12,
    fontWeight: '600',
  },
  errorRetryText: {
    color: '#B91C1C',
    fontSize: 12,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },

  /* ─── Flat Cards (NO Shadow) ─── */
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  cardIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  cardAmount: {
    fontSize: 14,
    fontWeight: '800',
  },
  cardBody: {
    padding: 10,
    gap: 6,
  },
  cardDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  metaLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '700',
  },
  metaChipText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  cardDetailText: {
    fontSize: 13,
    color: '#64748B',
    flex: 1,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
  },
  actionBtnEdit: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  actionBtnDelete: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    backgroundColor: '#FEF2F2',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 36,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '500',
  },

  /* ─── FAB Styles (NO Shadow) ─── */
  fab: {
    position: 'absolute',
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  fabMenuContainer: {
    position: 'absolute',
    right: 16,
    alignItems: 'flex-end',
    gap: 12,
  },
  fabMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fabMenuText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  fabMenuIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  
});
