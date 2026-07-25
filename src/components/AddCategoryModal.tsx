import React, { useState } from 'react';
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
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { COLORS } from '../theme/colors';

interface AddCategoryModalProps {
  visible: boolean;
  onClose: () => void;
  type: 'income' | 'expense';
}

const mockCategories = [
  { id: '1', name: 'Office Income', status: 'Active' },
  { id: '2', name: 'Personal Income', status: 'Active' },
];

export default function AddCategoryModal({ visible, onClose, type }: AddCategoryModalProps) {
  const [categoryName, setCategoryName] = useState('');
  const [status, setStatus] = useState('Active');

  const title = type === 'income' ? 'Add Income Category' : 'Add Expense Category';

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
              <TouchableOpacity
                style={styles.input}
                onPress={() => setStatus(status === 'Active' ? 'Inactive' : 'Active')}
              >
                <Text style={{ color: '#0F172A', fontSize: 13 }}>{status}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.submitBtn}>
              <Text style={styles.submitBtnText}>Submit</Text>
            </TouchableOpacity>

            {/* Table */}
            <View style={styles.tableContainer}>
              <View style={styles.tableHeader}>
                <Text style={[styles.th, { flex: 0.5 }]}>S No</Text>
                <Text style={[styles.th, { flex: 2 }]}>Name</Text>
                <Text style={[styles.th, { flex: 1 }]}>Status</Text>
                <Text style={[styles.th, { flex: 1, textAlign: 'center' }]}>Action</Text>
              </View>
              {mockCategories.map((item, index) => (
                <View key={item.id} style={styles.tableRow}>
                  <Text style={[styles.tdText, { flex: 0.5 }]}>{index + 1}</Text>
                  <Text style={[styles.tdText, { flex: 2 }]}>{item.name}</Text>
                  <View style={[styles.tdView, { flex: 1 }]}>
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusText}>{item.status}</Text>
                    </View>
                  </View>
                  <View style={[styles.tdView, { flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 6 }]}>
                    <TouchableOpacity style={styles.actionBtnEdit}>
                      <MaterialIcons name="edit" size={13} color={COLORS.accent} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtnDelete}>
                      <MaterialIcons name="delete-outline" size={13} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
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
  submitBtn: {
    backgroundColor: COLORS.accent,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  submitBtnText: {
    color: '#FFF',
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
  tdView: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tdText: {
    fontSize: 12,
    color: '#475569',
  },
  statusBadge: {
    backgroundColor: '#10B981',
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
