import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  Alert,
  Linking,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Feather from 'react-native-vector-icons/Feather';
import { COLORS } from '../theme/colors';
import api from '../config/apiConfig';
import { getStatusColor } from './LandingPageCard';

export interface ContactEnquiryLead {
  id: string;
  assignedName: string;
  source: string;
  dateTime: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  status: 'New' | 'In Progress' | 'Resolved' | 'Closed' | string;
  statusColor?: string | null;
  message: string;
  sendWhatsapp?: boolean;
  leadgen_id?: string | null;
  company_name?: string | null;
  industry?: string | null;
  business_goal?: string | null;
  meta_ads?: string | null;
}

interface ContactEnquiryCardProps {
  item: ContactEnquiryLead;
  onAddEnquiry: (item: ContactEnquiryLead) => void;
  onEdit: (item: ContactEnquiryLead) => void;
  onView: (item: ContactEnquiryLead) => void;
  onDelete: (id: string) => void;
  onAssign?: (item: ContactEnquiryLead) => void;
  onAssignStaff?: (item: ContactEnquiryLead, staffValue: string) => void;
  permissions?: string[];
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

const ContactEnquiryCard: React.FC<ContactEnquiryCardProps> = ({
  item,
  onAddEnquiry,
  onEdit,
  onView,
  onDelete,
  onAssign,
  onAssignStaff,
  permissions = [],
}) => {
  const srcColor = SOURCE_COLORS[item.source] ?? { bg: '#F3F4F6', text: '#374151' };
  
  // If API gave us a color, use it. Otherwise, use getStatusColor logic.
  const apiColor = item.statusColor ? { bg: item.statusColor, text: '#FFFFFF' } : null;
  const stColor = apiColor || getStatusColor(item.status);

  const [isExpanded, setIsExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [menuLayout, setMenuLayout] = useState({ top: 0, right: 0 });
  const iconRef = useRef<any>(null);

  const openMenu = () => {
    iconRef.current?.measure((fx: number, fy: number, width: number, height: number, px: number, py: number) => {
      setMenuLayout({ top: py + height, right: 10 });
      setShowMenu(true);
    });
  };

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



  const handleDeletePress = () => {
    onDelete(item.id);
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
        <TouchableOpacity ref={iconRef} style={{ marginLeft: 8, padding: 4 }} onPress={openMenu}>
          <MaterialIcons name="more-vert" size={18} color="#64748B" />
        </TouchableOpacity>
      </View>

      <Modal
        visible={showMenu}
        transparent={true}
        animationType="none"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity 
          style={{ flex: 1 }} 
          activeOpacity={1} 
          onPress={() => setShowMenu(false)}
        >
          <View style={[styles.menuContainer, { top: menuLayout.top, right: menuLayout.right, position: 'absolute' }]}>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMenu(false); onAssign && onAssign(item); }}>
              <MaterialIcons name="assignment-ind" size={14} color="#3B82F6" />
              <Text style={styles.menuText}>Assign</Text>
            </TouchableOpacity>
            {(permissions.includes('all') || permissions.includes('contact_page_edit')) && (
              <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMenu(false); onEdit(item); }}>
                <Feather name="edit" size={14} color="#F59E0B" />
                <Text style={styles.menuText}>Edit</Text>
              </TouchableOpacity>
            )}
            {(permissions.includes('all') || permissions.includes('contact_page_view')) && (
              <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMenu(false); onView(item); }}>
                <Feather name="eye" size={14} color="#0EA5E9" />
                <Text style={styles.menuText}>View</Text>
              </TouchableOpacity>
            )}
            {(permissions.includes('all') || permissions.includes('contact_page_delete')) && (
              <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMenu(false); handleDeletePress(); }}>
                <Feather name="trash-2" size={14} color="#EF4444" />
                <Text style={styles.menuText}>Delete</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

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
        
        {/* Facebook Meta Fields */}
        {item.leadgen_id && <InfoItem icon="fingerprint" label="Leadgen ID" value={item.leadgen_id} />}
        {item.company_name && <InfoItem icon="business" label="Company" value={item.company_name} />}
        {item.industry && <InfoItem icon="domain" label="Industry" value={item.industry} />}
        {item.business_goal && <InfoItem icon="track-changes" label="Goal" value={item.business_goal} />}
        {item.meta_ads && <InfoItem icon="campaign" label="Meta Ads" value={item.meta_ads} />}
      </View>
      
      {/* Send WhatsApp Status */}
      {/* <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
         <MaterialIcons name={item.sendWhatsapp ? "check-box" : "check-box-outline-blank"} size={16} color={item.sendWhatsapp ? "#16A34A" : "#94A3B8"} />
         <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '500' }}>WhatsApp Communication {item.sendWhatsapp ? 'Enabled' : 'Disabled'}</Text>
      </View> */}

      {/* Message */}
      <View style={styles.messageBox}>
        <Text style={styles.messageLabel}>MESSAGE</Text>
        <Text style={styles.messageText} numberOfLines={isExpanded ? undefined : 2}>
          {item.message || 'No message provided.'}
        </Text>
        {item.message && item.message.length > 80 && (
          <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)}>
            <Text style={{ color: '#6D28D9', fontSize: 10, marginTop: 4 }}>
              {isExpanded ? 'Show Less' : 'Read More'}
            </Text>
          </TouchableOpacity>
        )}
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
    borderRadius: 8,
    padding: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    fontSize: 10,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 6,
  },
  infoItem: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'flex-start',
  },
  infoLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
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
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    padding: 6,
    marginBottom: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#6D28D9',
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
  menuContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    minWidth: 100,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  menuText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
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