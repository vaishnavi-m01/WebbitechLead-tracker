import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
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
  requirements?: string;
  assignedName?: string;
}

interface GraphicDesignCardProps {
  item: GraphicDesignLead;
  onAction: (item: GraphicDesignLead) => void;
  onEdit: (item: GraphicDesignLead) => void;
  onView: (item: GraphicDesignLead) => void;
  onDelete: (id: string) => void;
  onAssign?: (item: GraphicDesignLead) => void;
  permissions?: string[];
}

const GraphicDesignCard: React.FC<GraphicDesignCardProps> = ({ item, onAction, onEdit, onView, onDelete, onAssign }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleDeletePress = () => {
    Alert.alert('Delete Lead', 'Are you sure you want to delete this lead?', [
      { text: 'Cancel' },
      { text: 'Delete', onPress: () => onDelete(item.id), style: 'destructive' },
    ]);
  };

  return (
    <View style={styles.card}>
      {/* Header: DateTime + Badge + Delete */}
      <View style={styles.topRow}>
        <View style={styles.dateRow}>
          <MaterialIcons name="access-time" size={12} color="#94A3B8" />
          <Text style={styles.dateText}>{item.dateTime}</Text>
        </View>
        <View style={{ flex: 1 }} />
        <View style={styles.badge}>
          <MaterialIcons name="brush" size={12} color="#6D28D9" />
          <Text style={styles.badgeText}>Graphic Design</Text>
        </View>
        <TouchableOpacity style={{ marginLeft: 6 }} onPress={handleDeletePress} activeOpacity={0.7}>
          <Feather name="trash-2" size={16} color="#EF4444" />
        </TouchableOpacity>
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
        <Text style={styles.messageLabel}>REQUIREMENTS</Text>
        <Text style={styles.messageText} numberOfLines={isExpanded ? undefined : 2}>
          {item.requirements || item.message || 'No requirements provided.'}
        </Text>
        {(item.requirements || item.message) && (item.requirements || item.message).length > 80 && (
          <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)}>
            <Text style={{ color: '#7C3AED', fontSize: 10, marginTop: 4 }}>
              {isExpanded ? 'Show Less' : 'Read More'}
            </Text>
          </TouchableOpacity>
        )}
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
    fontSize: 9,
    fontWeight: '700',
    color: '#6D28D9',
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
  infoGrid: {
    gap: 2,
    marginBottom: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  infoText: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 11,
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
    borderRadius: 6,
    padding: 6,
    marginBottom: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#7C3AED',
  },
  messageLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  messageText: {
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
