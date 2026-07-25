import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  Pressable,
  Alert,
  Linking,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Feather from 'react-native-vector-icons/Feather';
import { COLORS } from '../theme/colors';
import api from '../config/apiConfig';

export interface ContactEnquiryLead {
  id: string;
  assignedName: string;
  source: string;
  dateTime: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  message: string;
  status: 'New' | 'In Progress' | 'Resolved' | 'Closed';
}

interface ContactEnquiryCardProps {
  item: ContactEnquiryLead;
  onAddEnquiry: (item: ContactEnquiryLead) => void;
  onEdit: (item: ContactEnquiryLead) => void;
  onView: (item: ContactEnquiryLead) => void;
  onDelete: (id: string) => void;
  onAssign?: (item: ContactEnquiryLead) => void;
  onAssignStaff?: (item: ContactEnquiryLead, staffValue: string) => void;
}


interface DropdownItem {
  label: string;
  value: string;
}

const SOURCE_COLORS: Record<string, { bg: string; text: string }> = {
  Enquiry: { bg: '#DBEAFE', text: '#1D4ED8' },
  Contact: { bg: '#D1FAE5', text: '#065F46' },
  Whatsapp: { bg: '#DCFCE7', text: '#16A34A' },
  Facebook: { bg: '#EDE9FE', text: '#6D28D9' },
  Instagram: { bg: '#FDF2F8', text: '#DB2777' },
  DM: { bg: '#FEF3C7', text: '#B45309' },
  'Graphic Design': { bg: '#FCE7F3', text: '#9D174D' },
};

const STATUS_COLORS: Record<ContactEnquiryLead['status'], { bg: string; text: string }> = {
  New: { bg: '#DBEAFE', text: '#1D4ED8' },
  'In Progress': { bg: '#FEF3C7', text: '#B45309' },
  Resolved: { bg: '#D1FAE5', text: '#065F46' },
  Closed: { bg: '#F3F4F6', text: '#6B7280' },
};

const STAFF_OPTIONS = [
  { label: 'Sarah Jenkins', value: 'sarah_jenkins' },
  { label: 'Marcus Thorne', value: 'marcus_thorne' },
  { label: 'Anjali Singh', value: 'anjali_singh' },
  { label: 'Ravi Shankar', value: 'ravi_shankar' },
  { label: 'Kavin Kumar', value: 'kavin_kumar' },
];

const ContactEnquiryCard: React.FC<ContactEnquiryCardProps> = ({
  item,
  onAddEnquiry,
  onEdit,
  onView,
  onDelete,
  onAssign,
  onAssignStaff,
}) => {
  const srcColor = SOURCE_COLORS[item.source] ?? { bg: '#F3F4F6', text: '#374151' };
  const stColor = STATUS_COLORS[item.status] ?? { bg: '#F3F4F6', text: '#374151' };
  const [statusOptions, setStatusOptions] = useState<DropdownItem[]>([]);
  const handleEmailPress = async () => {
    const rawEmail = item.email ? item.email.trim() : '';
    if (!rawEmail || rawEmail.toUpperCase() === 'N/A' || rawEmail.toUpperCase() === 'NA') {
      Alert.alert('Not Available', 'Email address is not available.');
      return;
    }
    try {
      await Linking.openURL(`mailto:${rawEmail}`);
    } catch {
      Alert.alert('Error', 'Could not open email app on this device.');
    }
  };

  const handlePhonePress = async () => {
    const rawPhone = item.phone ? item.phone.trim() : '';
    if (!rawPhone || rawPhone.toUpperCase() === 'N/A' || rawPhone.toUpperCase() === 'NA') {
      Alert.alert('Not Available', 'Phone number is not available.');
      return;
    }
    try {
      await Linking.openURL(`tel:${rawPhone}`);
    } catch {
      Alert.alert('Error', 'Could not open phone dialer on this device.');
    }
  };

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await api.get('/status');
        if (response.data && Array.isArray(response.data.data)) {
          const mappedStatus = response.data.data.map((statusItem: any) => ({
            label: statusItem.name,
            value: statusItem.name,
          }));
          setStatusOptions(mappedStatus);
        }
      } catch (error) {
        console.error('Failed fetching dynamic lead tracking statuses:', error);
      }
    };

    fetchStatus();
  }, []);

  const handleDeletePress = () => {
    Alert.alert(
      'Delete Lead',
      'Are you sure you want to delete this lead? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(item.id) },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={styles.card}>
      {/* Top row: Source + Status */}
      <View style={styles.topRow}>
        <View style={[styles.sourceBadge, { backgroundColor: srcColor.bg }]}>
          <Text style={[styles.sourceText, { color: srcColor.text }]}>{item.source}</Text>
        </View>
        <View style={styles.flex1} />
        <View style={[styles.statusBadge, { backgroundColor: stColor.bg }]}>
          <Text style={[styles.statusText, { color: stColor.text }]}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.dateRow}>
        <MaterialIcons name="access-time" size={12} color="#94A3B8" />
        <Text style={styles.dateText}>{item.dateTime}</Text>
      </View>

      <View style={styles.divider} />

      {/* Assigned */}
      <View style={styles.assignedRow}>
        <View style={styles.avatarPlaceholder}>
          <MaterialIcons name="person" size={16} color="#64748B" />
        </View>
        <View style={styles.assignedInfo}>
          <Text style={styles.assignedLabel}>ASSIGNED NAME</Text>
          <Text style={styles.assignedName}>{item.assignedName || 'Unassigned'}</Text>
        </View>
      </View>

      {/* Info grid */}
      <View style={styles.infoGrid}>
        <InfoItem icon="person-outline" label="Name" value={item.name} />
        <InfoItem
          icon="mail-outline"
          label="Email"
          value={item.email}
          onPress={handleEmailPress}
          isLink
        />
        <InfoItem
          icon="phone"
          label="Phone"
          value={item.phone}
          onPress={handlePhonePress}
          isLink
        />
        <InfoItem icon="location-on" label="Location" value={item.location} />
      </View>

      {/* Message */}
      <View style={styles.messageBox}>
        <Text style={styles.messageLabel}>MESSAGE</Text>
        <Text style={styles.messageText} numberOfLines={2}>
          {item.message}
        </Text>
      </View>

      {/* Actions */}
      <View style={styles.actionBar}>
        <View style={styles.iconGroup}>
          <TouchableOpacity style={styles.assignBtn} onPress={() => onAssign && onAssign(item)} activeOpacity={0.7}>
            <MaterialIcons name="assignment-ind" size={13} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.editBtn} onPress={() => onEdit(item)} activeOpacity={0.7}>
            <Feather name="edit" size={13} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.viewBtn} onPress={() => onView(item)} activeOpacity={0.7}>
            <Feather name="eye" size={13} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDeletePress} activeOpacity={0.7}>
            <Feather name="trash-2" size={13} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

    </View>
  );
};

const InfoItem: React.FC<{
  icon: string;
  label: string;
  value: string;
  onPress?: () => void;
  isLink?: boolean;
}> = ({ icon, label, value, onPress, isLink }) => {
  const content = (
    <View style={styles.infoItem}>
      <MaterialIcons name={icon as any} size={13} color={isLink ? COLORS.accent : '#94A3B8'} />
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, isLink && styles.linkText]}>
          {value}
        </Text>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity style={{ width: '47%' }} onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={{ width: '47%' }}>{content}</View>;
};

export default ContactEnquiryCard;

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
    marginBottom: 4,
  },
  flex1: { flex: 1 },
  sourceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  sourceText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 10,
  },
  infoItem: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'flex-start',
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
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
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#6D28D9',
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
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  iconGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  viewBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#0EA5E9',
    justifyContent: 'center',
    alignItems: 'center',
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
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },

});