import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Feather from 'react-native-vector-icons/Feather';
import { COLORS } from '../theme/colors';

export interface GraphicDesignLead {
  id: string;
  dateTime: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  assignedName?: string;
}

interface GraphicDesignCardProps {
  item: GraphicDesignLead;
  onAction: (item: GraphicDesignLead) => void;
  onEdit: (item: GraphicDesignLead) => void;
  onView: (item: GraphicDesignLead) => void;
  onDelete: (id: string) => void;
  onAssign?: (item: GraphicDesignLead) => void;
}

const GraphicDesignCard: React.FC<GraphicDesignCardProps> = ({ item, onAction, onEdit, onView, onDelete, onAssign }) => {
  return (
    <View style={styles.card}>
      {/* Header: Badge + DateTime */}
      <View style={styles.topRow}>
        <View style={styles.badge}>
          <MaterialIcons name="brush" size={12} color="#6D28D9" />
          <Text style={styles.badgeText}>Graphic Design</Text>
        </View>
        <View style={styles.dateRow}>
          <MaterialIcons name="access-time" size={12} color="#94A3B8" />
          <Text style={styles.dateText}>{item.dateTime}</Text>
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

      {/* Info Grid */}
      <View style={styles.infoGrid}>
        <InfoRow icon="person-outline" label="Name" value={item.name} />
        <InfoRow icon="mail-outline" label="Email" value={item.email} />
        <InfoRow icon="phone" label="Phone" value={item.phone} />
      </View>

      {/* Message */}
      <View style={styles.messageBox}>
        <Text style={styles.messageLabel}>MESSAGE</Text>
        <Text style={styles.messageText} numberOfLines={2}>{item.message}</Text>
      </View>

      {/* Action Row */}
      <View style={styles.actionBar}>
        {/* Primary action */}
        <TouchableOpacity style={styles.actionBtn} onPress={() => onAction(item)} activeOpacity={0.8}>
          <MaterialIcons name="palette" size={13} color="#FFFFFF" />
          <Text style={styles.actionBtnText}>View Portfolio</Text>
        </TouchableOpacity>

        {/* Actions */}
        <View style={styles.iconGroup}>
          {/* {onAssign && (
            <TouchableOpacity style={styles.assignBtn} onPress={() => onAssign(item)} activeOpacity={0.7}>
              <MaterialIcons name="assignment-ind" size={13} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.editBtn} onPress={() => onEdit(item)} activeOpacity={0.7}>
            <Feather name="edit" size={13} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.viewBtn} onPress={() => onView(item)} activeOpacity={0.7}>
            <Feather name="eye" size={13} color="#FFFFFF" />
          </TouchableOpacity> */}
          <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(item.id)} activeOpacity={0.7}>
            <Feather name="trash-2" size={13} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const InfoRow: React.FC<{ icon: string; label: string; value: string; isLink?: boolean; onPress?: () => void }> = ({ icon, label, value, isLink, onPress }) => {
  const content = (
    <View style={styles.infoRow}>
      <MaterialIcons name={icon as any} size={14} color={isLink ? COLORS.accent : '#94A3B8'} style={{ marginTop: 1 }} />
      <View style={styles.infoText}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, isLink && styles.linkText]}>
          {value}
        </Text>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity style={{ flex: 1 }} onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={{ flex: 1 }}>{content}</View>;
};

export default GraphicDesignCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
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
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6D28D9',
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
  infoGrid: {
    gap: 8,
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  infoText: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#0F172A',
    marginTop: 1,
  },
  linkText: {
    color: COLORS.accent,
    textDecorationLine: 'underline',
  },
  messageBox: {
    backgroundColor: '#F5F3FF',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#7C3AED',
  },
  messageLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  messageText: {
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
    backgroundColor: '#7C3AED',
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
