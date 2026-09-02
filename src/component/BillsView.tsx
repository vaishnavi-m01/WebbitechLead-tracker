import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Feather from 'react-native-vector-icons/Feather';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { COLORS } from '../theme/colors';
import {
  createMyBill,
  deleteMyBill,
  getMyBillForEdit,
  getMyBills,
  MyBill,
  MyBillPayload,
  updateMyBill,
} from '../services/Trackerapi';

interface BillsViewProps {
  searchQuery?: string;
  onCountChange?: (count: number) => void;
  permissions?: string[];
}

const unwrap = (value: any) => value?.data?.data ?? value?.data ?? value;

export default function BillsView({ searchQuery = '', onCountChange, permissions = [] }: BillsViewProps) {
  const tabBarHeight = useBottomTabBarHeight();
  const [bills, setBills] = useState<MyBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    amount: '',
    bill_date: '',
    description: '',
    status: 'active' as 'active' | 'inactive',
  });

  const loadBills = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    try {
      const data = unwrap(await getMyBills());
      const list = Array.isArray(data) ? data : [];
      setBills(list);
      onCountChange?.(list.length);
    } catch (error: any) {
      Alert.alert('Unable to load bills', error?.message ?? 'Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [onCountChange]);

  useEffect(() => {
    loadBills();
  }, [loadBills]);

  const resetForm = () => {
    setForm({
      name: '',
      amount: '',
      bill_date: new Date().toISOString().slice(0, 10),
      description: '',
      status: 'active',
    });
    setEditingId(null);
  };

  const openCreate = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEdit = async (bill: MyBill) => {
    setEditingId(bill.id);
    setForm({
      name: bill.name ?? '',
      amount: String(bill.amount ?? ''),
      bill_date: bill.bill_date ?? '',
      description: bill.description ?? '',
      status: bill.status?.toLowerCase() === 'inactive' ? 'inactive' : 'active',
    });
    setModalVisible(true);
    try {
      const details = unwrap(await getMyBillForEdit(bill.id));
      if (details) {
        setForm({
          name: details.name ?? '',
          amount: String(details.amount ?? ''),
          bill_date: details.bill_date ?? '',
          description: details.description ?? '',
          status: details.status?.toLowerCase() === 'inactive' ? 'inactive' : 'active',
        });
      }
    } catch (error: any) {
      Alert.alert('Unable to load bill', error?.message ?? 'Please try again.');
    }
  };

  const submit = async () => {
    const amount = Number(form.amount);
    if (!form.name.trim() || !form.amount.trim() || !form.bill_date.trim() || !Number.isFinite(amount)) {
      Alert.alert('Missing details', 'Please enter a bill name, valid amount, and bill date.');
      return;
    }
    const payload: MyBillPayload = {
      name: form.name.trim(),
      amount,
      bill_date: form.bill_date.trim(),
      description: form.description.trim(),
      status: form.status,
    };
    setSaving(true);
    try {
      if (editingId) {
        await updateMyBill(editingId, payload);
      } else {
        await createMyBill(payload);
      }
      setModalVisible(false);
      resetForm();
      await loadBills();
    } catch (error: any) {
      Alert.alert('Unable to save bill', error?.message ?? 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (bill: MyBill) => {
    Alert.alert('Delete bill', `Are you sure you want to delete "${bill.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMyBill(bill.id);
            await loadBills();
          } catch (error: any) {
            Alert.alert('Delete failed', error?.message ?? 'Please try again.');
          }
        },
      },
    ]);
  };

  // Filter bills based on search query
  const filteredBills = bills.filter((b) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const nameMatch = (b.name || '').toLowerCase().includes(q);
    const descMatch = (b.description || '').toLowerCase().includes(q);
    const amountMatch = String(b.amount || '').toLowerCase().includes(q);
    const dateMatch = (b.bill_date || '').toLowerCase().includes(q);
    return nameMatch || descMatch || amountMatch || dateMatch;
  });

  // Calculate summary metrics
  const totalBillsCount = filteredBills.length;
  const totalAmount = filteredBills.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const activeBillsCount = filteredBills.filter((b) => b.status?.toLowerCase() !== 'inactive').length;

  const renderBill = ({ item }: { item: MyBill }) => {
    const isInactive = item.status?.toLowerCase() === 'inactive';
    return (
      <View style={styles.billCard}>
        <View style={[styles.billIcon, isInactive && styles.billIconInactive]}>
          <MaterialIcons
            name="receipt-long"
            size={22}
            color={isInactive ? '#94A3B8' : '#2563EB'}
          />
        </View>

        <View style={styles.billInfo}>
          <View style={styles.billTitleRow}>
            <Text style={styles.billName} numberOfLines={1}>
              {item.name}
            </Text>
            <View style={[styles.statusBadge, isInactive ? styles.statusInactive : styles.statusActive]}>
              <Text style={[styles.statusBadgeText, isInactive ? styles.statusTextInactive : styles.statusTextActive]}>
                {isInactive ? 'Inactive' : 'Active'}
              </Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <MaterialIcons name="calendar-today" size={11} color="#64748B" />
            <Text style={styles.billMetaDate}>{item.bill_date || 'No due date'}</Text>
          </View>

          {item.description ? (
            <Text style={styles.billDescription} numberOfLines={1}>
              {item.description}
            </Text>
          ) : null}
        </View>

        <View style={styles.billRightActions}>
          <Text style={styles.billAmount}>
            ₹{Number(item.amount).toLocaleString('en-IN')}
          </Text>
          <View style={styles.actionRow}>
            <TouchableOpacity
              onPress={() => openEdit(item)}
              style={[styles.actionButton, styles.editBtn]}
              activeOpacity={0.7}
            >
              <Feather name="edit-2" size={13} color="#D97706" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => confirmDelete(item)}
              style={[styles.actionButton, styles.deleteBtn]}
              activeOpacity={0.7}
            >
              <Feather name="trash-2" size={13} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Summary Stat Cards Banner */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeaderRow}>
            <Text style={styles.summaryLabel}>TOTAL BILLS</Text>
            <View style={[styles.summaryIconCircle, { backgroundColor: '#EFF6FF' }]}>
              <MaterialIcons name="receipt" size={15} color="#3B82F6" />
            </View>
          </View>
          <Text style={styles.summaryValue}>{totalBillsCount}</Text>
          <Text style={styles.summarySub}>{activeBillsCount} active bills</Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryHeaderRow}>
            <Text style={styles.summaryLabel}>TOTAL AMOUNT</Text>
            <View style={[styles.summaryIconCircle, { backgroundColor: '#ECFDF5' }]}>
              <MaterialIcons name="account-balance-wallet" size={15} color="#10B981" />
            </View>
          </View>
          <Text style={[styles.summaryValue, { color: '#059669' }]}>
            ₹{totalAmount.toLocaleString('en-IN')}
          </Text>
          <Text style={styles.summarySub}>Monthly recurring</Text>
        </View>
      </View>

      {/* Main List */}
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.loaderText}>Loading bills...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredBills}
          renderItem={renderBill}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[styles.list, { paddingBottom: tabBarHeight + 90 }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadBills(true)}
              colors={[COLORS.accent]}
              tintColor={COLORS.accent}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialIcons name="receipt-long" size={48} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'No matching bills found' : 'No bills added yet'}
              </Text>
              <Text style={styles.emptyText}>
                {searchQuery
                  ? 'Try searching with a different term'
                  : 'Tap the + button below to track your recurring bills.'}
              </Text>
            </View>
          }
        />
      )}

      {/* Floating Add Button */}
      <TouchableOpacity
        style={[styles.fab, { bottom: tabBarHeight + 20 }]}
        onPress={openCreate}
        activeOpacity={0.85}
      >
        <MaterialIcons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Add / Edit Bill Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          />
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <View style={styles.sheetTitleRow}>
                <View style={styles.modalIconCircle}>
                  <MaterialIcons name={editingId ? 'edit' : 'receipt-long'} size={18} color="#2563EB" />
                </View>
                <Text style={styles.sheetTitle}>{editingId ? 'Edit Bill' : 'Add New Bill'}</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <MaterialIcons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>BILL NAME *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Electricity, Rent, Server, WiFi"
              placeholderTextColor="#94A3B8"
              value={form.name}
              onChangeText={(name) => setForm({ ...form, name })}
            />

            <View style={styles.formRow}>
              <View style={styles.formCol}>
                <Text style={styles.label}>AMOUNT (₹) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  placeholderTextColor="#94A3B8"
                  keyboardType="decimal-pad"
                  value={form.amount}
                  onChangeText={(amount) => setForm({ ...form, amount })}
                />
              </View>

              <View style={styles.formCol}>
                <Text style={styles.label}>BILL DATE *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#94A3B8"
                  value={form.bill_date}
                  onChangeText={(bill_date) => setForm({ ...form, bill_date })}
                />
              </View>
            </View>

            <Text style={styles.label}>STATUS</Text>
            <View style={styles.statusToggleRow}>
              <TouchableOpacity
                style={[
                  styles.statusOption,
                  form.status === 'active' && styles.statusOptionActive,
                ]}
                onPress={() => setForm({ ...form, status: 'active' })}
                activeOpacity={0.7}
              >
                <MaterialIcons
                  name="check-circle"
                  size={15}
                  color={form.status === 'active' ? '#16A34A' : '#94A3B8'}
                />
                <Text
                  style={[
                    styles.statusOptionText,
                    form.status === 'active' && styles.statusOptionTextActive,
                  ]}
                >
                  Active
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.statusOption,
                  form.status === 'inactive' && styles.statusOptionInactive,
                ]}
                onPress={() => setForm({ ...form, status: 'inactive' })}
                activeOpacity={0.7}
              >
                <MaterialIcons
                  name="cancel"
                  size={15}
                  color={form.status === 'inactive' ? '#EF4444' : '#94A3B8'}
                />
                <Text
                  style={[
                    styles.statusOptionText,
                    form.status === 'inactive' && styles.statusOptionTextInactive,
                  ]}
                >
                  Inactive
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>DESCRIPTION / NOTES (OPTIONAL)</Text>
            <TextInput
              style={[styles.input, styles.descriptionInput]}
              placeholder="Add payment notes, account details, etc."
              placeholderTextColor="#94A3B8"
              value={form.description}
              onChangeText={(description) => setForm({ ...form, description })}
              multiline
            />

            <View style={styles.sheetActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={submit}
                disabled={saving}
                activeOpacity={0.85}
              >
                {saving ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.saveText}>{editingId ? 'Update Bill' : 'Save Bill'}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  summaryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  summaryLabel: {
    color: '#64748B',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  summaryIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryValue: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 2,
  },
  summarySub: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  billCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  billIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  billIconInactive: {
    backgroundColor: '#F1F5F9',
  },
  billInfo: {
    flex: 1,
    minWidth: 0,
  },
  billTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  billName: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusActive: {
    backgroundColor: '#DCFCE7',
  },
  statusInactive: {
    backgroundColor: '#F1F5F9',
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  statusTextActive: {
    color: '#15803D',
  },
  statusTextInactive: {
    color: '#64748B',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  billMetaDate: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '500',
  },
  billDescription: {
    color: '#94A3B8',
    fontSize: 10.5,
    marginTop: 2,
  },
  billRightActions: {
    alignItems: 'flex-end',
    marginLeft: 10,
  },
  billAmount: {
    color: '#0F172A',
    fontSize: 14.5,
    fontWeight: '800',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  actionButton: {
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  editBtn: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  deleteBtn: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECDD3',
  },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  loaderText: {
    marginTop: 10,
    fontSize: 13,
    color: '#64748B',
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    color: '#334155',
    fontWeight: '700',
    fontSize: 15,
    marginTop: 12,
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 18,
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  label: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: '#0F172A',
    fontSize: 13.5,
    backgroundColor: '#F8FAFC',
  },
  formRow: {
    flexDirection: 'row',
    gap: 10,
  },
  formCol: {
    flex: 1,
  },
  statusToggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statusOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  statusOptionActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  statusOptionInactive: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
  },
  statusOptionText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#64748B',
  },
  statusOptionTextActive: {
    color: '#15803D',
    fontWeight: '700',
  },
  statusOptionTextInactive: {
    color: '#B91C1C',
    fontWeight: '700',
  },
  descriptionInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  sheetActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  cancelText: {
    color: '#64748B',
    fontWeight: '700',
    fontSize: 13,
  },
  saveButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
