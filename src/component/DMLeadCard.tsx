import React, { useState } from 'react';
import { StyleSheet, Text, View, Linking, Alert, TouchableOpacity } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Feather from 'react-native-vector-icons/Feather';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { COLORS } from '../theme/colors';

export interface DMLeadData {
  id: string;
  dateTime: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  assignedName?: string;
}

interface DMLeadCardProps {
  item: DMLeadData;
  onAction: (item: DMLeadData) => void;
  onEdit: (item: DMLeadData) => void;
  onView: (item: DMLeadData) => void;
  onDelete: (id: string) => void;
  onAssign?: (item: DMLeadData) => void;
  permissions?: string[];
}

const DMLeadCard: React.FC<DMLeadCardProps> = ({ item, onAction, onEdit, onView, onDelete, onAssign }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Navigation Handlers
  const handlePhonePress = async () => {
    if (!item.phone) return;
    try {
      await Linking.openURL(`tel:${item.phone.trim()}`);
    } catch {
      Alert.alert('Error', 'Could not open phone dialer on this device.');
    }
  };

  const handleEmailPress = async () => {
    if (!item.email) return;
    try {
      await Linking.openURL(`mailto:${item.email.trim()}`);
    } catch {
      Alert.alert('Error', 'Could not open email app on this device.');
    }
  };

  const handleWhatsAppPress = async () => {
    if (!item.phone) return;
    try {
      const formattedPhone = item.phone.replace(/[^0-9]/g, '');
      await Linking.openURL(`whatsapp://send?phone=${formattedPhone}`);
    } catch {
      Alert.alert('Error', 'WhatsApp is not installed on this device.');
    }
  };

  const handleDeletePress = () => {
    onDelete(item.id);
  };

  return (
    <View style={styles.card}>
      {/* Header: DateTime + DM badge + Delete */}
      <View style={styles.topRow}>
        <View style={styles.dateRow}>
          <MaterialIcons name="access-time" size={12} color="#94A3B8" />
          <Text style={styles.dateText}>{item.dateTime}</Text>
        </View>
        <View style={{ flex: 1 }} />
        <View style={styles.dmBadge}>
          <Text style={styles.dmBadgeText}>DM Lead</Text>
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
        <InfoRow icon="mail-outline" label="Email" value={item.email} onPress={handleEmailPress} isLink />
        <InfoRow icon="phone" label="Phone" value={item.phone} onPress={handlePhonePress} isLink />
      </View>

      {/* Message */}
      <View style={styles.messageBox}>
        <Text style={styles.messageLabel}>MESSAGE</Text>
        <Text style={styles.messageText} numberOfLines={isExpanded ? undefined : 2}>
          {item.message || 'No message provided.'}
        </Text>
        {item.message && item.message.length > 80 && (
          <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)}>
            <Text style={{ color: '#DB2777', fontSize: 10, marginTop: 4 }}>
              {isExpanded ? 'Show Less' : 'Read More'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Action Row */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.actionBtn} onPress={handleWhatsAppPress} activeOpacity={0.8}>
          <FontAwesome name="whatsapp" size={14} color="#FFFFFF" />
          <Text style={styles.actionBtnText}>Reply via DM</Text>
        </TouchableOpacity>

        {/* Action Buttons with Centered Icons */}
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

const InfoRow: React.FC<{
  icon: string;
  label: string;
  value: string;
  onPress?: () => void;
  isLink?: boolean;
}> = ({ icon, label, value, onPress, isLink }) => {
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

export default DMLeadCard;

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
  dmBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FCE7F3',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  dmBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#9D174D',
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
    backgroundColor: '#FFF5F7',
    borderRadius: 6,
    padding: 6,
    marginBottom: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#DB2777',
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
    width: "auto"
  },
  /* Compact Button Styling */
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#25D366',
    paddingHorizontal: 10,
    paddingVertical: 6,
    height: 32,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  iconGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
  },
  /* Precise Center Alignment for Icons */
  assignBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#0EA5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
});