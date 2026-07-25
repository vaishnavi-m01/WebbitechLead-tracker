import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Dropdown } from 'react-native-element-dropdown';
import { COLORS } from '../theme/colors';
import AddCategoryModal from './AddCategoryModal';
import AddAmountModal from './AddAmountModal';

interface FinanceViewProps {
  type: 'income' | 'expense';
  searchQuery?: string;
}

const MOCK_DATA = {
  income: [
    { id: '1', name: 'ENN CONSULTANCY', category: 'Software', amount: '22500', date: '10-07-2026', description: 'Project Advance' },
    { id: '2', name: 'WebbiTech Sales', category: 'Web Dev', amount: '15000', date: '12-07-2026', description: 'Website AMC' },
  ],
  expense: [
    { id: '1', name: 'RD EVENTS', category: 'Marketing', amount: '5000', date: '08-05-2026', description: 'Event Promotion' },
    { id: '2', name: 'Yum Scrum Foods Pvt Ltd', category: 'Refund', amount: '1500', date: '09-05-2026', description: 'Project Refund' },
  ]
};

const CATEGORIES_LIST = [
  { label: 'All', value: 'All' },
  { label: 'Software', value: 'Software' },
  { label: 'Web Dev', value: 'Web Dev' },
  { label: 'Marketing', value: 'Marketing' },
  { label: 'Refund', value: 'Refund' },
  { label: 'Other', value: 'Other' }
];

const formatDate = (date: Date) => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

export default function FinanceView({ type, searchQuery = '' }: FinanceViewProps) {
  const tabBarHeight = useBottomTabBarHeight();
  
  // State for Filters
  const [fromDate, setFromDate] = useState<Date>(new Date());
  const [toDate, setToDate] = useState<Date>(new Date());
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  // State for Modals & FAB
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showAmountModal, setShowAmountModal] = useState(false);
  const [showFabMenu, setShowFabMenu] = useState(false);

  const isIncome = type === 'income';
  const themeColor = isIncome ? '#10B981' : '#EF4444';

  const currentData = MOCK_DATA[type].filter(item => {
    if (selectedCategory !== 'All' && item.category !== selectedCategory) {
      return false;
    }
    if (searchQuery.trim().length > 0) {
      const query = searchQuery.toLowerCase();
      if (
        !item.name.toLowerCase().includes(query) &&
        !(item.description && item.description.toLowerCase().includes(query)) &&
        !item.category.toLowerCase().includes(query)
      ) {
        return false;
      }
    }
    return true;
  });

  const handleDownload = () => {
    // Export functionality
  };

  const onChangeFromDate = (event: any, selectedDate?: Date) => {
    setShowFromPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setFromDate(selectedDate);
    }
  };

  const onChangeToDate = (event: any, selectedDate?: Date) => {
    setShowToPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setToDate(selectedDate);
    }
  };

  const renderToolbar = () => (
    <View style={styles.toolbarWrapper}>
      {/* ─── Flat Date Range Pickers ─── */}
      <View style={styles.datePickerContainer}>
        {/* From Date */}
        <TouchableOpacity 
          style={styles.dateInputBox} 
          onPress={() => setShowFromPicker(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.dateLabel}>FROM</Text>
          <View style={styles.dropdownValueRow}>
            <Text style={styles.dateValueText}>{formatDate(fromDate)}</Text>
            <MaterialIcons name="calendar-today" size={16} color="#64748B" />
          </View>
        </TouchableOpacity>

        <View style={styles.dateDivider}>
          <MaterialIcons name="arrow-forward" size={14} color="#94A3B8" />
        </View>

        {/* To Date */}
        <TouchableOpacity 
          style={styles.dateInputBox} 
          onPress={() => setShowToPicker(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.dateLabel}>TO</Text>
          <View style={styles.dropdownValueRow}>
            <Text style={styles.dateValueText}>{formatDate(toDate)}</Text>
            <MaterialIcons name="calendar-today" size={16} color="#64748B" />
          </View>
        </TouchableOpacity>
      </View>

      {/* ─── Category & Export Controls Bar ─── */}
      <View style={styles.actionFilterRow}>
        {/* Modern Category Dropdown Picker */}
        <Dropdown
          style={styles.dropdown}
          placeholderStyle={styles.placeholderStyle}
          selectedTextStyle={styles.selectedTextStyle}
          inputSearchStyle={styles.inputSearchStyle}
          iconStyle={styles.iconStyle}
          containerStyle={styles.dropdownContainer}
          itemContainerStyle={styles.dropdownItemContainer}
          itemTextStyle={styles.dropdownItemText}
          activeColor="#F1F5F9"
          data={CATEGORIES_LIST}
          maxHeight={300}
          labelField="label"
          valueField="value"
          placeholder="Select Category"
          value={selectedCategory}
          onChange={item => {
            setSelectedCategory(item.value);
          }}
        />

        {/* Download Button */}
        <TouchableOpacity 
          style={[styles.downloadBtn,]} 
          onPress={handleDownload}
          activeOpacity={0.85}
        >
          <Text style={styles.downloadBtnText}>Export</Text>
        </TouchableOpacity>
      </View>

         //exportGroup
        <View style={styles.exportActionContainer}>
              <View style={styles.exportGroup}>
                {["Copy", "Excel", "CSV", "Print"].map((action) => (
                  <TouchableOpacity
                    key={action}
                    style={styles.exportButton}
                    onPress={() => console.log(`${action} triggered`)}
                  >
                    <Text style={styles.exportText}>{action}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

    </View>
  );

  const renderCard = ({ item }: { item: any }) => (
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
            <MaterialIcons name="local-offer" size={12} color="#64748B" />
            <Text style={styles.metaChipText}>{item.category}</Text>
          </View>
          <View style={styles.metaChip}>
            <MaterialIcons name="calendar-today" size={12} color="#64748B" />
            <Text style={styles.metaChipText}>{item.date}</Text>
          </View>
        </View>
        {item.description ? (
          <View style={styles.cardDetailRow}>
            <MaterialIcons name="notes" size={13} color="#94A3B8" style={{ marginRight: 6, marginTop: 2 }} />
            <Text style={styles.cardDetailText} numberOfLines={2}>{item.description}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.cardFooter}>
        <TouchableOpacity style={styles.actionBtnEdit}>
          <MaterialIcons name="edit" size={13} color={COLORS.accent} />
          <Text style={[styles.actionBtnText, { color: COLORS.accent }]}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtnDelete}>
          <MaterialIcons name="delete-outline" size={13} color="#EF4444" />
          <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={currentData}
        keyExtractor={(item) => item.id}
        renderItem={renderCard}
        contentContainerStyle={[styles.listContainer, { flexGrow: 1, paddingBottom: tabBarHeight + 80 }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderToolbar()}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="receipt-long" size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>No financial records found</Text>
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
          <TouchableOpacity 
            style={styles.fabMenuItem} 
            onPress={() => { setShowFabMenu(false); setShowCategoryModal(true); }}
          >
            <Text style={styles.fabMenuText}>Add Category</Text>
            <View style={styles.fabMenuIconWrap}>
              <MaterialIcons name="category" size={18} color={themeColor} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.fabMenuItem} 
            onPress={() => { setShowFabMenu(false); setShowAmountModal(true); }}
          >
            <Text style={styles.fabMenuText}>Add Amount</Text>
            <View style={styles.fabMenuIconWrap}>
              <MaterialIcons name="attach-money" size={18} color={themeColor} />
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Main FAB (Flat style - No shadow) */}
      <TouchableOpacity 
        style={[styles.fab, { bottom: tabBarHeight + 16, backgroundColor: COLORS.accent }]}
        onPress={() => setShowFabMenu(!showFabMenu)}
        activeOpacity={0.8}
      >
        <MaterialIcons name={showFabMenu ? "close" : "add"} size={26} color="#FFFFFF" />
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
      />

      <AddAmountModal
        visible={showAmountModal}
        onClose={() => setShowAmountModal(false)}
        type={type}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: 16,
  },

  /* ─── Completely Flat Filter Controls (NO Shadow) ─── */
  toolbarWrapper: {
    paddingVertical: 14,
    gap: 12,
  },
  datePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  dateInputBox: {
    flex: 1,
    paddingHorizontal: 8,
  },
  dateLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  dropdownValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateValueText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  dateDivider: {
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Action Row */
  actionFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dropdown: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 14,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
  },
  dropdownIcon: {
    marginRight: 8,
  },
  placeholderStyle: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  selectedTextStyle: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '700',
  },
  iconStyle: {
    width: 20,
    height: 20,
    tintColor: '#64748B',
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 14,
  },
  dropdownContainer: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 0, 
    shadowColor: 'transparent',
    overflow: 'hidden',
    marginTop: 4,
  },
  dropdownItemContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
  },
  downloadBtn: {
    backgroundColor: COLORS.accent,
    flexDirection: 'row',
    height: 38,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 6,
  },
  downloadBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },

    exportActionContainer: {
    paddingHorizontal: 16,
    alignItems: "flex-start",
    marginVertical: 2,
    marginBottom: 8,
  },
  exportGroup: {
    flexDirection: "row",
    backgroundColor: "#64748B",
    borderRadius: 6,
    padding: 3,
    gap: 2,
  },
  exportButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  exportText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },

  /* ─── Flat Cards (NO Shadow) ─── */
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
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
    fontSize: 15,
    fontWeight: '800',
  },
  cardBody: {
    padding: 12,
    gap: 8,
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
  metaChipText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  actionBtnEdit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  actionBtnDelete: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
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