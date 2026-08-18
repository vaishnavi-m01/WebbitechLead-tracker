
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { COLORS } from '../theme/colors';
import { Dropdown } from 'react-native-element-dropdown';
import {
  TrackerCategory,
  getIncomeCategories,
  getExpenseCategories,
  createIncomeCategory,
  createExpenseCategory,
  updateIncomeCategory,
  updateExpenseCategory,
  deleteIncomeCategory,
  deleteExpenseCategory,
} from '../services/Trackerapi';

interface AddCategoryModalProps {
  visible: boolean;
  onClose: () => void;
  type: 'income' | 'expense';
  onSuccess?: () => void;
  permissions?: string[];
}

export default function AddCategoryModal({ visible, onClose, type, onSuccess, permissions }: AddCategoryModalProps) {
  const isIncome = type === 'income';

  const [categoryName, setCategoryName] = useState('');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [editingId, setEditingId] = useState<number | null>(null);

  const [categories, setCategories] = useState<TrackerCategory[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const title = type === 'income' ? 'Add Income Category' : 'Add Expense Category';

  useEffect(() => {
    if (visible) {
      fetchCategories();
      resetForm();
    }
  }, [visible]);

  const fetchCategories = async () => {
    setLoadingList(true);
    try {
      const res = isIncome ? await getIncomeCategories() : await getExpenseCategories();
      // API may wrap the array in an envelope: { data: [...] }
      const raw = res.data as any;
      const list: TrackerCategory[] = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.data)
        ? raw.data
        : [];
      setCategories(list);
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Failed to load categories.');
    } finally {
      setLoadingList(false);
    }
  };

  const resetForm = () => {
    setCategoryName('');
    setStatus('Active');
    setEditingId(null);
    setErrorText(null);
  };

  const handleSubmit = async () => {
    const trimmedName = categoryName.trim();
    if (!trimmedName) {
      setErrorText('Please enter a category name.');
      return;
    }

    setSubmitting(true);
    setErrorText(null);
    try {
      const payload = { name: trimmedName, status: status.toLowerCase() as 'active' | 'inactive' };

      if (editingId) {
        if (isIncome) {
          await updateIncomeCategory(editingId, payload);
        } else {
          await updateExpenseCategory(editingId, payload);
        }
      } else if (isIncome) {
        await createIncomeCategory(payload);
      } else {
        await createExpenseCategory(payload);
      }

      resetForm();
      await fetchCategories();
      onSuccess?.();
    } catch (err: any) {
      setErrorText(err?.message ?? 'Failed to save category.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item: TrackerCategory) => {
    setEditingId(item.id);
    setCategoryName(item.name);
    
    // Ensure case-insensitive mapping for 'Active' or 'Inactive'
    const itemStatus = item.status?.toLowerCase() === 'active' ? 'Active' : 'Inactive';
    setStatus(itemStatus);
    setErrorText(null);
  };

  const handleDelete = (item: TrackerCategory) => {
    Alert.alert('Delete category', `Delete "${item.name}"? This can't be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            if (isIncome) {
              await deleteIncomeCategory(item.id);
            } else {
              await deleteExpenseCategory(item.id);
            }
            if (editingId === item.id) resetForm();
            await fetchCategories();
            onSuccess?.();
          } catch (err: any) {
            Alert.alert('Delete failed', err?.message ?? 'Please try again.');
          }
        },
      },
    ]);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
        <View style={styles.sheet}>
          {/* Drag Handle */}
          <View style={styles.dragHandle} />

          {/* Compact Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{editingId ? `Edit ${isIncome ? 'Income' : 'Expense'} Category` : title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialIcons name="close" size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={{ paddingBottom: 60 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.formGroup}>
              <Text style={styles.label}>Category Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Category Name"
                placeholderTextColor="#94A3B8"
                value={categoryName}
                onChangeText={setCategoryName}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Status</Text>
              <Dropdown
                style={styles.input}
                selectedTextStyle={{ fontSize: 13, color: '#0F172A' }}
                itemTextStyle={{ fontSize: 13, color: '#0F172A' }}
                data={[
                  { label: 'Active', value: 'Active' },
                  { label: 'Inactive', value: 'Inactive' },
                ]}
                maxHeight={150}
                labelField="label"
                valueField="value"
                value={status}
                onChange={item => {
                  setStatus(item.value as 'Active' | 'Inactive');
                }}
              />
            </View>

            {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}

            <View style={styles.formButtonsRow}>
              <TouchableOpacity
                style={[styles.submitBtn, styles.flexBtn, submitting && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>{editingId ? 'Update' : 'Submit'}</Text>
                )}
              </TouchableOpacity>
              {editingId ? (
                <TouchableOpacity style={styles.cancelBtn} onPress={resetForm}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Table */}
            <View style={styles.tableContainer}>
              <View style={styles.tableHeader}>
                <Text style={[styles.th, { flex: 0.5 }]}>S No</Text>
                <Text style={[styles.th, { flex: 2 }]}>Name</Text>
                <Text style={[styles.th, { flex: 1 }]}>Status</Text>
                <Text style={[styles.th, { flex: 1, textAlign: 'center' }]}>Action</Text>
              </View>

              {loadingList ? (
                <View style={styles.tableStateBox}>
                  <ActivityIndicator size="small" color={COLORS.accent} />
                </View>
              ) : !Array.isArray(categories) || categories.length === 0 ? (
                <View style={styles.tableStateBox}>
                  <Text style={styles.tableEmptyText}>No categories yet</Text>
                </View>
              ) : (
                (categories as TrackerCategory[]).map((item, index) => (
                  <View key={item.id} style={styles.tableRow}>
                    <Text style={[styles.tdText, { flex: 0.5 }]}>{index + 1}</Text>
                    <Text style={[styles.tdText, { flex: 2 }]}>{item.name}</Text>
                    <View style={[styles.tdView, { flex: 1 }]}>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: item.status?.toLowerCase() === 'active' ? '#10B981' : '#94A3B8' },
                        ]}
                      >
                        <Text style={styles.statusText}>
                          {item.status?.toLowerCase() === 'active' ? 'Active' : 'Inactive'}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.tdView, { flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 6 }]}>
                      {(permissions?.includes('all') || (isIncome ? permissions?.includes('108') : permissions?.includes('104'))) && (
                      <TouchableOpacity style={styles.actionBtnEdit} onPress={() => handleEdit(item)}>
                        <MaterialIcons name="edit" size={13} color={COLORS.accent} />
                      </TouchableOpacity>
                      )}
                      {(permissions?.includes('all') || (isIncome ? permissions?.includes('109') : permissions?.includes('105'))) && (
                      <TouchableOpacity style={styles.actionBtnDelete} onPress={() => handleDelete(item)}>
                        <MaterialIcons name="delete-outline" size={13} color="#EF4444" />
                      </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))
              )}
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    paddingBottom: 24,
  },
  dragHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  closeBtn: {
    padding: 4,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  content: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    color: '#0F172A',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    fontSize: 13,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  formButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  flexBtn: {
    flex: 1,
    marginBottom: 0,
  },
  submitBtn: {
    backgroundColor: COLORS.accent,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 13,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: '#475569',
    fontWeight: '700',
    fontSize: 13,
  },
  tableContainer: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  th: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    alignItems: 'center',
  },
  tableStateBox: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  tableEmptyText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  tdView: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tdText: {
    fontSize: 12,
    color: '#475569',
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
  },
  statusText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
  },
  actionBtnEdit: {
    backgroundColor: '#EFF6FF',
    padding: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  actionBtnDelete: {
    backgroundColor: '#FEF2F2',
    padding: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
});
