import React from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native';
import { fontScale, scale, verticalScale } from '../utils/responsive';
import Feather from 'react-native-vector-icons/Feather';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

export interface LeadData {
  companyName: string;
  status:
  | 'ORDER CONFIRMED'
  | 'CALL BACK'
  | 'INTERESTED - IN FUTURE'
  | 'Phone not picked'
  | 'Price High'
  | 'Not Interested'
  | 'Another Approached'
  | 'Other';
  date: string;
  service: string;
  contactName: string;
  phone: string;
  orderDetails: string;
  assignedName?: string;
}

interface LeadsCardProps {
  item: LeadData;
  onDetailsPress?: () => void; 
  onCallPress?: () => void;
  onChatPress?: () => void;
  onEditPress?: () => void;
  onDeletePress?: () => void;
}

const LeadsCard: React.FC<LeadsCardProps> = ({
  item,
  onDetailsPress,
  onCallPress,
  onChatPress,
  onEditPress,
  onDeletePress,
}) => {
  const getStatusColors = () => {
    switch (item.status) {
      case 'ORDER CONFIRMED':
        return { bg: '#A7F3D0', text: '#065F46', border: '#059669' };
      case 'CALL BACK':
        return { bg: '#E5E7EB', text: '#374151', border: '#4B5563' };
      case 'INTERESTED - IN FUTURE':
        return { bg: '#FEE2E2', text: '#B91C1C', border: '#DC2626' };
      case 'Phone not picked':
        return { bg: '#FEF3C7', text: '#D97706', border: '#F59E0B' };
      case 'Price High':
        return { bg: '#F3E8FF', text: '#6B21A8', border: '#8B5CF6' };
      case 'Not Interested':
        return { bg: '#FFEDD5', text: '#9A3412', border: '#EA580C' };
      case 'Another Approached':
        return { bg: '#E0F2FE', text: '#075985', border: '#0284C7' };
      case 'Other':
      default:
        return { bg: '#DBEAFE', text: '#1E40AF', border: '#2563EB' };
    }
  };

  const colors = getStatusColors();

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={onDetailsPress}
    >
      {/* Header Row: Company Name + Status (top right) */}
      <View style={styles.headerRow}>
        <Text style={styles.companyName} numberOfLines={1}>
          {item.companyName}
        </Text>
        <View style={[styles.statusTag, { backgroundColor: colors.bg }]}>
          <Text style={[styles.statusText, { color: colors.text }]}>
            {item.status}
          </Text>
        </View>
      </View>

      {/* Date Row */}
      <View style={styles.tagRow}>
        <Text style={styles.dateText}>{item.date}</Text>
      </View>

      <View style={styles.divider} />

      {/* Information Grid */}
      <View style={styles.gridRow}>
        <View style={styles.gridColumn}>
          <Text style={styles.labelText}>SERVICE</Text>
          <Text style={styles.valueText}>{item.service}</Text>
        </View>
        <View style={styles.gridColumn}>
          <Text style={styles.labelText}>CONTACT NAME</Text>
          <Text style={styles.valueText}>{item.contactName}</Text>
        </View>
      </View>

      <View style={styles.phoneSection}>
        <Text style={styles.labelText}>PHONE</Text>
        <Text style={styles.valueText}>{item.phone}</Text>
      </View>

      {/* Order Details Highlight Section */}
      <View style={[styles.detailsBox, { borderLeftColor: colors.border }]}>
        <Text style={[styles.labelText, { color: '#B91C1C' }]}>ORDER DETAILS</Text>
        <Text style={styles.detailsContent} numberOfLines={2}>
          {item.orderDetails}
        </Text>
      </View>

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

      {/* Footer Section */}
      <View style={styles.footerRow}>
        <View style={{ flex: 1 }} />

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onEditPress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="edit-2" color="#3B82F6" size={18} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onDeletePress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="trash-2" color="#EF4444" size={18} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onCallPress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="phone" color="#22C55E" size={20} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onChatPress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <FontAwesome name="whatsapp" color="#25D366" size={22} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
export default LeadsCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: scale(12),
    padding: scale(16),
    marginBottom: verticalScale(16),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  companyName: {
    fontSize: fontScale(18),
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: scale(8),
  },
  statusTag: {
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(4),
    borderRadius: scale(4),
  },
  statusText: {
    fontSize: fontScale(10),
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(6),
  },
  dateText: {
    fontSize: fontScale(12),
    color: '#6B7280',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: verticalScale(14),
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: verticalScale(12),
  },
  gridColumn: {
    flex: 1,
  },
  phoneSection: {
    marginBottom: verticalScale(14),
  },
  labelText: {
    fontSize: fontScale(10),
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 0.5,
    marginBottom: verticalScale(2),
  },
  valueText: {
    fontSize: fontScale(14),
    fontWeight: '500',
    color: '#111827',
  },
  detailsBox: {
    backgroundColor: '#F9FAFB',
    borderLeftWidth: scale(3),
    padding: scale(12),
    borderRadius: scale(4),
    marginBottom: verticalScale(16),
  },
  detailsContent: {
    fontSize: fontScale(13),
    color: '#374151',
    lineHeight: fontScale(18),
    marginTop: verticalScale(2),
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: verticalScale(4),
  },
  assignedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: verticalScale(12),
    backgroundColor: '#F8FAFC',
    padding: scale(10),
    borderRadius: scale(8),
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  avatarPlaceholder: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  assignedInfo: {
    flex: 1,
  },
  assignedLabel: {
    fontSize: fontScale(10),
    color: '#6B7280',
    fontWeight: '700',
    marginBottom: verticalScale(2),
  },
  assignedName: {
    fontSize: fontScale(13),
    color: '#0F172A',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(6),
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: scale(8),
  },
});