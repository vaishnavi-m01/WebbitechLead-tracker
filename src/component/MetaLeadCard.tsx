import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Feather from 'react-native-vector-icons/Feather';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { COLORS } from '../theme/colors';

export interface MetaLead {
  id: string;
  date: string;
  name: string;
  phone: string;
  businessType: string;
  city: string;
  specificMessage: string;
  assignedName?: string;
}

interface MetaLeadCardProps {
  item: MetaLead;
  onAction: (item: MetaLead) => void;
  onEdit: (item: MetaLead) => void;
  onView: (item: MetaLead) => void;
  onDelete: (id: string) => void;
  onAssign?: (item: MetaLead) => void;
}

const MetaLeadCard: React.FC<MetaLeadCardProps> = ({ item, onAction, onEdit, onView, onDelete, onAssign }) => {
  return (
    <View style={styles.card}>
      {/* Header: Meta badge + Date */}
      <View style={styles.topRow}>
        <View style={styles.metaBadge}>
          <MaterialIcons name="bar-chart" size={13} color="#1877F2" />
          <Text style={styles.metaBadgeText}>Meta Lead</Text>
        </View>
        <View style={styles.dateRow}>
          <MaterialIcons name="calendar-today" size={12} color="#94A3B8" />
          <Text style={styles.dateText}>{item.date}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Assigned Staff */}
      <View style={styles.assignedRow}>
        <View style={styles.avatarPlaceholder}>
          <MaterialIcons name="person" size={16} color="#64748B" />
        </View>
        <View style={styles.assignedInfo}>
          <Text style={styles.assignedLabel}>ASSIGNED TO</Text>
          <Text style={styles.assignedName}>{item.assignedName || 'Unassigned'}</Text>
        </View>
      </View>

      {/* Name + Phone */}
      <View style={styles.namePhoneRow}>
        <View style={styles.nameBlock}>
          <Text style={styles.fieldLabel}>NAME</Text>
          <Text style={styles.nameText}>{item.name}</Text>
        </View>
        <View style={styles.phoneBlock}>
          <Text style={styles.fieldLabel}>PHONE</Text>
          <View style={styles.phoneInner}>
            <MaterialIcons name="phone" size={14} color={COLORS.accent} />
            <Text style={styles.phoneText}>{item.phone}</Text>
          </View>
        </View>
      </View>

      {/* Business Type + City Tags */}
      <View style={styles.tagRow}>
        <View style={styles.bizTag}>
          <MaterialIcons name="business" size={12} color="#0EA5E9" />
          <Text style={styles.bizTagText}>{item.businessType}</Text>
        </View>
        <View style={styles.cityTag}>
          <MaterialIcons name="location-on" size={12} color="#10B981" />
          <Text style={styles.cityTagText}>{item.city}</Text>
        </View>
      </View>

      {/* Specific Message */}
      <View style={styles.specificMsgBox}>
        <Text style={styles.specificMsgLabel}>SPECIFIC MESSAGE</Text>
        <Text style={styles.specificMsgText} numberOfLines={3}>{item.specificMessage}</Text>
      </View>

      {/* Action Row */}
      <View style={styles.actionBar}>
        {/* Primary action */}
        <TouchableOpacity style={styles.actionBtn} onPress={() => onAction(item)} activeOpacity={0.8}>
          <FontAwesome name="whatsapp" size={13} color="#FFFFFF" />
          <Text style={styles.actionBtnText}>Contact Lead</Text>
        </TouchableOpacity>

        {/* Edit + Delete + Assign */}
        <View style={styles.iconGroup}>
          {onAssign && (
            <TouchableOpacity style={styles.assignBtn} onPress={() => onAssign(item)} activeOpacity={0.7}>
              <MaterialIcons name="assignment-ind" size={13} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.editBtn} onPress={() => onEdit(item)} activeOpacity={0.7}>
            <Feather name="edit" size={13} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.viewBtn} onPress={() => onView(item)} activeOpacity={0.7}>
            <Feather name="eye" size={13} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(item.id)} activeOpacity={0.7}>
            <Feather name="trash-2" size={13} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default MetaLeadCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#DBEAFE',
    elevation: 0,
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 0,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  metaBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1877F2',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  assignedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  assignedInfo: {
    flex: 1,
  },
  assignedLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '700',
    marginBottom: 2,
  },
  assignedName: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
  },
  namePhoneRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  nameBlock: {
    flex: 1,
  },
  phoneBlock: {
    flex: 1,
    alignItems: 'flex-end',
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  nameText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  phoneInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  phoneText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.accent,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  bizTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  bizTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0EA5E9',
  },
  cityTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  cityTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  specificMsgBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#1877F2',
  },
  specificMsgLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  specificMsgText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1877F2',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  iconGroup: {
    justifyContent: 'flex-end',
    flexDirection: 'row',
    gap: 8,
  },
  assignBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#0EA5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
});