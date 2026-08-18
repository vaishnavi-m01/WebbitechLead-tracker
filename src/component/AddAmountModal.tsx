
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
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS } from '../theme/colors';
import {
  TrackerAmount,
  TrackerCategory,
  getIncomeCategories,
  getExpenseCategories,
  createIncomeAmount,
  createExpenseAmount,
  updateIncomeAmount,
  updateExpenseAmount,
} from '../services/Trackerapi';

interface AddAmountModalProps {
  visible: boolean;
  onClose: () => void;
  type: 'income' | 'expense';
  onSuccess?: () => void;
  editItem?: TrackerAmount | null;
}

const toApiDate = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const toDisplayDate = (date: Date) => {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}-${m}-${y}`;
};

const parseApiDate = (value?: string): Date => {
  if (!value) return new Date();
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return new Date();
  return new Date(y, m - 1, d);
};

export default function AddAmountModal({ visible, onClose, type, onSuccess, editItem = null }: AddAmountModalProps) {
  const isIncome = type === 'income';

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [description, setDescription] = useState('');

  const [categories, setCategories] = useState<TrackerCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [showCategoryList, setShowCategoryList] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const title = editItem
    ? `Edit ${isIncome ? 'Income' : 'Expense'} Amount`
    : isIncome
    ? 'Add Income Amount'
    : 'Add Expense Amount';

  useEffect(() => {
    if (visible) {
      resetForm();        // clear form first
      fetchCategories();  // then load fresh categories
    }
  }, [visible, editItem]);

  // Sync category name when category ID or categories list loads
  useEffect(() => {
    if (categoryId && categories.length > 0) {
      const cat = categories.find(c => String(c.id) === String(categoryId));
      if (cat) {
        setCategoryName(cat.name);
      }
    }
  }, [categoryId, categories]);
  
  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const res = isIncome ? await getIncomeCategories() : await getExpenseCategories();
      const raw = res.data as any;
      const list: TrackerCategory[] = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.data)
        ? raw.data
        : [];
      setCategories(list.filter((c) => c.status?.toLowerCase() === 'active'));
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Failed to load categories.');
    } finally {
      setLoadingCategories(false);
    }
  };

  const resetForm = () => {
    setErrorText(null);
    setShowCategoryList(false);
    if (editItem) {
      setName(editItem.name ?? '');
      setCategoryId(editItem.category_id ?? null);
      setCategoryName(editItem.category_name ?? '');
      setAmount(editItem.amount != null ? String(editItem.amount) : '');
      const existingDate = isIncome ? editItem.income_date : editItem.expensive_date;
      setSelectedDate(existingDate ? parseApiDate(existingDate) : new Date());
      setDescription(editItem.description ?? '');
    } else {
      setName('');
      setCategoryId(null);
      setCategoryName('');
      setAmount('');
      setSelectedDate(new Date());
      setDescription('');
    }
  };

  const onChangeDate = (event: any, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) setSelectedDate(date);
  };

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    const numericAmount = parseFloat(amount);

    if (!trimmedName) {
      setErrorText('Please enter a name.');
      return;
    }
    if (!categoryId) {
      setErrorText('Please select a category.');
      return;
    }
    if (!amount || Number.isNaN(numericAmount) || numericAmount <= 0) {
      setErrorText('Please enter a valid amount.');
      return;
    }

    setSubmitting(true);
    setErrorText(null);
    try {
      if (isIncome) {
        const payload = {
          name: trimmedName,
          category_id: categoryId,
          amount: numericAmount,
          income_date: toApiDate(selectedDate),
          description: description.trim() || undefined,
          status: 'active' as const,
        };
        if (editItem) {
          console.log(`[API] PUT /tracker/income-amount/${editItem.id}`, payload);
          await updateIncomeAmount(editItem.id, payload);
        } else {
          console.log('[API] POST /tracker/income-amount/create', payload);
          await createIncomeAmount(payload);
        }
      } else {
        const payload = {
          name: trimmedName,
          category_id: categoryId,
          amount: numericAmount,
          expensive_date: toApiDate(selectedDate),
          description: description.trim() || undefined,
          status: 'active' as const,
        };
        if (editItem) {
          console.log(`[API] PUT /tracker/expenses-amount/${editItem.id}`, payload);
          await updateExpenseAmount(editItem.id, payload);
        } else {
          console.log('[API] POST /tracker/expenses-amount/create', payload);
          await createExpenseAmount(payload);
        }
      }

      onSuccess?.();
      onClose();
    } catch (err: any) {
      setErrorText(err?.message ?? 'Failed to save record.');
    } finally {
      setSubmitting(false);
    }
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
            <Text style={styles.headerTitle}>{title}</Text>
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
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Name"
                placeholderTextColor="#94A3B8"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Category</Text>
              <TouchableOpacity
                style={[styles.input, styles.rowInput]}
                activeOpacity={0.7}
                onPress={() => setShowCategoryList((prev) => !prev)}
              >
                <Text style={{ color: categoryName ? '#0F172A' : '#94A3B8', fontSize: 13 }}>
                  {categoryName || '-- Select Category --'}
                </Text>
                {loadingCategories ? (
                  <ActivityIndicator size="small" color="#94A3B8" />
                ) : (
                  <MaterialIcons
                    name={showCategoryList ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                    size={18}
                    color="#94A3B8"
                  />
                )}
              </TouchableOpacity>

              {showCategoryList && (
                <View style={styles.dropdownList}>
                  {loadingCategories ? (
                    <View style={{ paddingVertical: 12, alignItems: 'center' }}>
                      <ActivityIndicator size="small" color="#94A3B8" />
                    </View>
                  ) : !Array.isArray(categories) || categories.length === 0 ? (
                    <Text style={styles.dropdownEmptyText}>No categories yet. Add one first.</Text>
                  ) : (
                    categories.map((c) => (
                      <TouchableOpacity
                        key={c.id}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setCategoryId(c.id);
                          setCategoryName(c.name);
                          setShowCategoryList(false);
                        }}
                      >
                        <Text style={styles.dropdownItemText}>{c.name}</Text>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Amount</Text>
              <TextInput
                style={styles.input}
                placeholder="Amount"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Date</Text>
              <TouchableOpacity
                style={[styles.input, styles.rowInput]}
                activeOpacity={0.7}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={{ color: '#0F172A', fontSize: 13 }}>{toDisplayDate(selectedDate)}</Text>
                <MaterialIcons name="calendar-today" size={16} color="#94A3B8" />
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker value={selectedDate} mode="date" display="default" onChange={onChangeDate} />
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Description"
                placeholderTextColor="#94A3B8"
                value={description}
                onChangeText={setDescription}
                multiline
                textAlignVertical="top"
              />
            </View>

            {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}

            <TouchableOpacity
              style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.submitBtnText}>{editItem ? 'Update' : 'Submit'}</Text>
              )}
            </TouchableOpacity>
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
    maxHeight: '90%',
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
  rowInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textArea: {
    height: 72,
    paddingTop: 10,
  },
  dropdownList: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownItemText: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '500',
  },
  dropdownEmptyText: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 12,
    color: '#94A3B8',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  submitBtn: {
    backgroundColor: COLORS.accent,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 4,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
