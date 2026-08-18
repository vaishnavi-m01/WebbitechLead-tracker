import React, { useState } from 'react';
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
  permissions?: string[];
}

const MetaLeadCard: React.FC<MetaLeadCardProps> = ({ item, onAction, onEdit, onView, onDelete, onAssign }) => {
  const [isExpanded, setIsExpanded] = useState(false);

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
      {item.specificMessage ? (
        <View style={styles.specificMsgBox}>
          <Text style={styles.specificMsgLabel}>SPECIFIC MESSAGE</Text>
          <Text style={styles.specificMsgText} numberOfLines={isExpanded ? undefined : 2}>
            {item.specificMessage}
          </Text>
          {item.specificMessage.length > 80 && (
            <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)}>
              <Text style={{ color: '#1877F2', fontSize: 10, marginTop: 4, fontWeight: '700' }}>
                {isExpanded ? 'Show Less' : 'Read More'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : null}

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
    borderRadius: 8,
    padding: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    fontSize: 9,
    fontWeight: '700',
    color: '#1877F2',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },
  assignedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
    backgroundColor: '#F8FAFC',
    padding: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  avatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  assignedInfo: {
    flex: 1,
  },
  assignedLabel: {
    fontSize: 8,
    color: '#6B7280',
    fontWeight: '700',
    marginBottom: 1,
  },
  assignedName: {
    fontSize: 11,
    color: '#0F172A',
    fontWeight: '600',
  },
  namePhoneRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  nameBlock: {
    flex: 1,
  },
  phoneBlock: {
    flex: 1,
    alignItems: 'flex-end',
  },
  fieldLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 1,
  },
  nameText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  phoneInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  phoneText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.accent,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 6,
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
    fontSize: 11,
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
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
  },
  specificMsgBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
    padding: 6,
    marginBottom: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#1877F2',
  },
  specificMsgLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  specificMsgText: {
    fontSize: 11,
    color: '#334155',
    lineHeight: 16,
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