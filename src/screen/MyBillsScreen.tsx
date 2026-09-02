import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Modal, Platform, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme/colors';
import { createMyBill, deleteMyBill, getMyBillForEdit, getMyBills, MyBill, MyBillPayload, updateMyBill } from '../services/Trackerapi';

const unwrap = (value: any) => value?.data?.data ?? value?.data ?? value;

export default function MyBillsScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [bills, setBills] = useState<MyBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', amount: '', bill_date: '', description: '', status: 'active' as 'active' | 'inactive' });

  const loadBills = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    try {
      const data = unwrap(await getMyBills());
      setBills(Array.isArray(data) ? data : []);
    } catch (error: any) { Alert.alert('Unable to load bills', error?.message ?? 'Please try again.'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { loadBills(); }, [loadBills]);

  const resetForm = () => { setForm({ name: '', amount: '', bill_date: '', description: '', status: 'active' }); setEditingId(null); };
  const openCreate = () => { resetForm(); setModalVisible(true); };

  const openEdit = async (bill: MyBill) => {
    setEditingId(bill.id);
    setForm({ name: bill.name ?? '', amount: String(bill.amount ?? ''), bill_date: bill.bill_date ?? '', description: bill.description ?? '', status: bill.status?.toLowerCase() === 'inactive' ? 'inactive' : 'active' });
    setModalVisible(true);
    try {
      const details = unwrap(await getMyBillForEdit(bill.id));
      if (details) setForm({ name: details.name ?? '', amount: String(details.amount ?? ''), bill_date: details.bill_date ?? '', description: details.description ?? '', status: details.status?.toLowerCase() === 'inactive' ? 'inactive' : 'active' });
    } catch (error: any) { Alert.alert('Unable to load bill', error?.message ?? 'Please try again.'); }
  };

  const submit = async () => {
    const amount = Number(form.amount);
    if (!form.name.trim() || !form.amount.trim() || !form.bill_date.trim() || !Number.isFinite(amount)) { Alert.alert('Missing details', 'Enter a bill name, valid amount, and bill date.'); return; }
    const payload: MyBillPayload = { name: form.name.trim(), amount, bill_date: form.bill_date.trim(), description: form.description.trim(), status: form.status };
    setSaving(true);
    try {
      if (editingId) await updateMyBill(editingId, payload); else await createMyBill(payload);
      setModalVisible(false); resetForm(); await loadBills();
    } catch (error: any) { Alert.alert('Unable to save bill', error?.message ?? 'Please try again.'); }
    finally { setSaving(false); }
  };

  const confirmDelete = (bill: MyBill) => Alert.alert('Delete bill', `Delete "${bill.name}"?`, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: async () => { try { await deleteMyBill(bill.id); await loadBills(); } catch (error: any) { Alert.alert('Delete failed', error?.message ?? 'Please try again.'); } } },
  ]);

  const renderBill = ({ item }: { item: MyBill }) => (
    <View style={styles.billCard}>
      <View style={styles.billIcon}><MaterialIcons name="receipt" size={22} color={COLORS.accent} /></View>
      <View style={styles.billInfo}><Text style={styles.billName} numberOfLines={1}>{item.name}</Text><Text style={styles.billMeta}>{item.bill_date || 'No date'}{item.description ? `  •  ${item.description}` : ''}</Text></View>
      <View style={styles.billActions}><Text style={styles.billAmount}>₹{Number(item.amount).toLocaleString('en-IN')}</Text><View style={styles.actionRow}><TouchableOpacity onPress={() => openEdit(item)} style={styles.actionButton}><MaterialIcons name="edit" size={18} color={COLORS.accent} /></TouchableOpacity><TouchableOpacity onPress={() => confirmDelete(item)} style={styles.actionButton}><MaterialIcons name="delete-outline" size={19} color={COLORS.error} /></TouchableOpacity></View></View>
    </View>
  );

  return <View style={styles.container}>
    <StatusBar barStyle="light-content" backgroundColor={COLORS.accent} />
    <View style={[styles.header, { paddingTop: insets.top + 12 }]}><TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())} style={styles.headerButton}><MaterialIcons name="menu" size={23} color="#FFF" /></TouchableOpacity><View><Text style={styles.headerTitle}>My Bills</Text><Text style={styles.headerSubtitle}>Track your recurring expenses</Text></View><TouchableOpacity onPress={openCreate} style={styles.addButton}><MaterialIcons name="add" size={24} color={COLORS.accent} /></TouchableOpacity></View>
    <View style={styles.summary}><Text style={styles.summaryLabel}>TOTAL BILLS</Text><Text style={styles.summaryValue}>{bills.length}</Text></View>
    {loading ? <ActivityIndicator style={styles.loader} color={COLORS.accent} /> : <FlatList data={bills} renderItem={renderBill} keyExtractor={(item) => String(item.id)} contentContainerStyle={styles.list} refreshing={refreshing} onRefresh={() => loadBills(true)} ListEmptyComponent={<View style={styles.empty}><MaterialIcons name="receipt-long" size={42} color="#CBD5E1" /><Text style={styles.emptyTitle}>No bills added yet</Text><Text style={styles.emptyText}>Add your first bill to start tracking it.</Text></View>} />}
    <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}><KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><TouchableOpacity style={styles.backdrop} onPress={() => setModalVisible(false)} /><View style={styles.sheet}><View style={styles.sheetHeader}><Text style={styles.sheetTitle}>{editingId ? 'Edit Bill' : 'Add Bill'}</Text><TouchableOpacity onPress={() => setModalVisible(false)}><MaterialIcons name="close" size={22} color="#64748B" /></TouchableOpacity></View><Text style={styles.label}>Bill name</Text><TextInput style={styles.input} placeholder="Electricity, rent, subscription..." placeholderTextColor="#94A3B8" value={form.name} onChangeText={(name) => setForm({ ...form, name })} /><Text style={styles.label}>Amount</Text><TextInput style={styles.input} placeholder="0.00" placeholderTextColor="#94A3B8" keyboardType="decimal-pad" value={form.amount} onChangeText={(amount) => setForm({ ...form, amount })} /><Text style={styles.label}>Bill date</Text><TextInput style={styles.input} placeholder="YYYY-MM-DD" placeholderTextColor="#94A3B8" value={form.bill_date} onChangeText={(bill_date) => setForm({ ...form, bill_date })} /><Text style={styles.label}>Description (optional)</Text><TextInput style={[styles.input, styles.description]} placeholder="Add a note" placeholderTextColor="#94A3B8" value={form.description} onChangeText={(description) => setForm({ ...form, description })} multiline /><View style={styles.sheetActions}><TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity><TouchableOpacity style={styles.saveButton} onPress={submit} disabled={saving}>{saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveText}>{editingId ? 'Update bill' : 'Save bill'}</Text>}</TouchableOpacity></View></View></KeyboardAvoidingView></Modal>
  </View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F6FA' }, header: { backgroundColor: COLORS.accent, paddingHorizontal: 18, paddingBottom: 18, flexDirection: 'row', alignItems: 'center', gap: 14 }, headerButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' }, headerTitle: { color: '#FFF', fontSize: 20, fontWeight: '700' }, headerSubtitle: { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 2 }, addButton: { marginLeft: 'auto', backgroundColor: '#FFF', width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' }, summary: { backgroundColor: '#FFF', margin: 16, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' }, summaryLabel: { color: '#64748B', fontSize: 11, fontWeight: '700', letterSpacing: 0.8 }, summaryValue: { color: '#0F172A', fontSize: 26, fontWeight: '700', marginTop: 5 }, list: { paddingHorizontal: 16, paddingBottom: 100 }, billCard: { backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center' }, billIcon: { width: 42, height: 42, borderRadius: 10, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginRight: 12 }, billInfo: { flex: 1, minWidth: 0 }, billName: { color: '#0F172A', fontSize: 15, fontWeight: '700' }, billMeta: { color: '#64748B', fontSize: 11, marginTop: 5 }, billActions: { alignItems: 'flex-end', marginLeft: 8 }, billAmount: { color: '#0F172A', fontSize: 15, fontWeight: '700' }, actionRow: { flexDirection: 'row', marginTop: 5 }, actionButton: { padding: 4, marginLeft: 4 }, loader: { marginTop: 50 }, empty: { alignItems: 'center', paddingTop: 80 },  emptyTitle: { color: '#334155', fontWeight: '700', fontSize: 16, marginTop: 12 }, emptyText: { color: '#94A3B8', fontSize: 13, marginTop: 5 }, modalOverlay: { flex: 1, justifyContent: 'flex-end' }, backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(15,23,42,0.45)' }, sheet: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 30 }, sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }, sheetTitle: { color: '#0F172A', fontSize: 19, fontWeight: '700' }, label: { color: '#334155', fontSize: 12, fontWeight: '700', marginBottom: 6, marginTop: 10 }, input: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 11, color: '#0F172A', fontSize: 14 }, description: { minHeight: 70, textAlignVertical: 'top' }, sheetActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 22 }, cancelButton: { paddingHorizontal: 16, paddingVertical: 12 }, cancelText: { color: '#64748B', fontWeight: '700' }, saveButton: { backgroundColor: COLORS.accent, borderRadius: 8, paddingHorizontal: 18, paddingVertical: 12, minWidth: 110, alignItems: 'center' }, saveText: { color: '#FFF', fontWeight: '700' },
});