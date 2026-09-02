import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Feather from 'react-native-vector-icons/Feather';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { COLORS } from '../theme/colors';
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
  index?: number;
  onAddEnquiry: (item: ContactEnquiryLead) => void;
  onEdit: (item: ContactEnquiryLead) => void;
  onView: (item: ContactEnquiryLead) => void;
  onDelete: (id: string) => void;
  onAssign?: (item: ContactEnquiryLead) => void;
  onAssignStaff?: (item: ContactEnquiryLead, staffValue: string) => void;
  permissions?: string[];
}

const SOURCE_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  Enquiry: { bg: '#EFF6FF', text: '#1D4ED8', icon: 'help-outline' },
  Contact: { bg: '#F0FDF4', text: '#15803D', icon: 'contacts' },
  Whatsapp: { bg: '#DCFCE7', text: '#16A34A', icon: 'whatsapp' },
  Facebook: { bg: '#F5F3FF', text: '#6D28D9', icon: 'facebook' },
  Instagram: { bg: '#FDF2F8', text: '#BE185D', icon: 'camera-alt' },
  DM: { bg: '#FFFBEB', text: '#B45309', icon: 'chat' },
  'Graphic Design': { bg: '#FCE7F3', text: '#9D174D', icon: 'brush' },
};

// 6 Distinct, refined light pastel palettes for visual differentiation
const CARD_PALETTES = [
  {
    bg: '#F8FAFC',
    border: '#E2E8F0',
    accent: '#3B82F6',
    softBg: '#EFF6FF',
    softText: '#1D4ED8',
    avatarBg: '#DBEAFE',
    avatarText: '#1E40AF',
    iconBg: '#DBEAFE',
    iconColor: '#2563EB',
  },
  {
    bg: '#F6FEF9',
    border: '#DCFCE7',
    accent: '#10B981',
    softBg: '#ECFDF5',
    softText: '#047857',
    avatarBg: '#D1FAE5',
    avatarText: '#065F46',
    iconBg: '#D1FAE5',
    iconColor: '#059669',
  },
  {
    bg: '#FAF8FF',
    border: '#EDE9FE',
    accent: '#8B5CF6',
    softBg: '#F5F3FF',
    softText: '#6D28D9',
    avatarBg: '#EDE9FE',
    avatarText: '#5B21B6',
    iconBg: '#EDE9FE',
    iconColor: '#7C3AED',
  },
  {
    bg: '#FFFDF6',
    border: '#FEF3C7',
    accent: '#F59E0B',
    softBg: '#FFFBEB',
    softText: '#B45309',
    avatarBg: '#FEF3C7',
    avatarText: '#92400E',
    iconBg: '#FEF3C7',
    iconColor: '#D97706',
  },
  {
    bg: '#FFF8FA',
    border: '#FFE4E6',
    accent: '#F43F5E',
    softBg: '#FFF1F2',
    softText: '#BE123C',
    avatarBg: '#FFE4E6',
    avatarText: '#9F1239',
    iconBg: '#FFE4E6',
    iconColor: '#E11D48',
  },
  {
    bg: '#F5FEFD',
    border: '#CFFAFE',
    accent: '#06B6D4',
    softBg: '#ECFEFF',
    softText: '#0E7490',
    avatarBg: '#CFFAFE',
    avatarText: '#155E75',
    iconBg: '#CFFAFE',
    iconColor: '#0891B2',
  },
];

const getInitials = (name?: string) => {
  if (!name || name === 'Unassigned') return '?';
  const parts = name.trim().split(/\s+/);
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('') || '?';
};

const ContactEnquiryCard: React.FC<ContactEnquiryCardProps> = ({
  item,
  index = 0,
  onAddEnquiry,
  onEdit,
  onView,
  onDelete,
  onAssign,
  permissions = [],
}) => {
  const palette = CARD_PALETTES[index % CARD_PALETTES.length];
  const srcConfig = SOURCE_COLORS[item.source] ?? { bg: '#F1F5F9', text: '#475569', icon: 'tag' };

  // Status color logic
  const apiColor = item.statusColor ? { bg: item.statusColor, text: '#FFFFFF' } : null;
  const stColor = apiColor || getStatusColor(item.status);

  const [isExpanded, setIsExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [menuLayout, setMenuLayout] = useState({ top: 0, right: 0 });
  const iconRef = useRef<any>(null);

  const openMenu = () => {
    iconRef.current?.measure((fx: number, fy: number, width: number, height: number, px: number, py: number) => {
      setMenuLayout({ top: py + height, right: 14 });
      setShowMenu(true);
    });
  };

  const handleWhatsAppPress = async () => {
    const rawPhone = item.phone ? item.phone.trim() : '';
    if (!rawPhone || rawPhone.toUpperCase() === 'N/A' || rawPhone.toUpperCase() === 'NA') {
      Alert.alert('Not Available', 'Phone number is not available for WhatsApp.');
      return;
    }
    let cleanNumber = rawPhone.replace(/[^0-9]/g, '');
    if (cleanNumber.length === 10) {
      cleanNumber = `91${cleanNumber}`;
    }
    const url = `https://wa.me/${cleanNumber}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL(`https://api.whatsapp.com/send?phone=${cleanNumber}`);
      }
    } catch {
      Linking.openURL(url).catch(() => {
        Alert.alert('Error', 'Could not open WhatsApp on this device.');
      });
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
      Alert.alert('Error', 'Could not open phone dialer.');
    }
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
      Alert.alert('Error', 'Could not open email app.');
    }
  };

  const handleDeletePress = () => {
    onDelete(item.id);
  };

  const isAssigned = Boolean(item.assignedName && item.assignedName !== 'Unassigned');

  return (
    <View style={[styles.card, { backgroundColor: palette.bg, borderColor: palette.border }]}>
      {/* Accent left highlight bar */}
      <View style={[styles.accentBar, { backgroundColor: palette.accent }]} />

      {/* 1. Header: Source Badge + Status Badge + Date + More Actions Menu */}
      <View style={styles.cardHeader}>
        <View style={styles.headerBadgesRow}>
          {/* Source Badge */}
          <View style={[styles.sourceBadge, { backgroundColor: srcConfig.bg }]}>
            {item.source === 'Whatsapp' ? (
              <FontAwesome name="whatsapp" size={11} color={srcConfig.text} style={styles.badgeIcon} />
            ) : (
              <MaterialIcons name={srcConfig.icon as any} size={11} color={srcConfig.text} style={styles.badgeIcon} />
            )}
            <Text style={[styles.sourceText, { color: srcConfig.text }]}>{item.source}</Text>
          </View>

          {/* Status Badge */}
          <View style={[styles.statusBadge, { backgroundColor: stColor.bg }]}>
            <View style={styles.statusDot} />
            <Text style={[styles.statusText, { color: stColor.text }]}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.dateBadge}>
            <MaterialIcons name="access-time" size={11} color="#64748B" />
            <Text style={styles.dateText}>{item.dateTime}</Text>
          </View>

          <TouchableOpacity ref={iconRef} style={styles.menuTrigger} onPress={openMenu} activeOpacity={0.7}>
            <MaterialIcons name="more-vert" size={18} color="#64748B" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Action Popup Modal */}
      <Modal
        visible={showMenu}
        transparent={true}
        animationType="none"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={[styles.menuContainer, { top: menuLayout.top, right: menuLayout.right }]}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                onAssign && onAssign(item);
              }}
            >
              <MaterialIcons name="assignment-ind" size={15} color="#3B82F6" />
              <Text style={styles.menuText}>Assign Staff</Text>
            </TouchableOpacity>

            {(permissions.includes('all') || permissions.includes('contact_page_view')) && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setShowMenu(false);
                  onView(item);
                }}
              >
                <Feather name="eye" size={15} color="#0EA5E9" />
                <Text style={styles.menuText}>View Details</Text>
              </TouchableOpacity>
            )}

            {(permissions.includes('all') || permissions.includes('contact_page_edit')) && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setShowMenu(false);
                  onEdit(item);
                }}
              >
                <Feather name="edit" size={15} color="#F59E0B" />
                <Text style={styles.menuText}>Edit Lead</Text>
              </TouchableOpacity>
            )}

            {(permissions.includes('all') || permissions.includes('contact_page_delete')) && (
              <TouchableOpacity
                style={[styles.menuItem, styles.menuItemDelete]}
                onPress={() => {
                  setShowMenu(false);
                  handleDeletePress();
                }}
              >
                <Feather name="trash-2" size={15} color="#EF4444" />
                <Text style={[styles.menuText, styles.menuTextDelete]}>Delete</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 2. Main Lead Information Grid */}
      <View style={styles.contentBody}>
        {/* Name Item */}
        <View style={styles.nameRow}>
          <View style={[styles.iconChip, { backgroundColor: palette.iconBg }]}>
            <MaterialIcons name="person" size={16} color={palette.iconColor} />
          </View>
          <View style={styles.nameTextWrapper}>
            <Text style={styles.nameLabel}>CLIENT NAME</Text>
            <Text style={styles.nameValue} numberOfLines={1}>
              {item.name || 'Unknown Contact'}
            </Text>
          </View>
        </View>

        {/* WhatsApp Action Row (WhatsApp icon + Redirect + Phone Dialer) */}
        <View style={styles.interactiveRow}>
          <TouchableOpacity
            style={styles.whatsappButton}
            onPress={handleWhatsAppPress}
            activeOpacity={0.8}
          >
            <View style={styles.whatsappIconCircle}>
              <FontAwesome name="whatsapp" size={16} color="#FFFFFF" />
            </View>
            <View style={styles.whatsappTextContainer}>
              <Text style={styles.whatsappSubLabel}>WHATSAPP CHAT</Text>
              <Text style={styles.whatsappPhoneText} numberOfLines={1}>
                {item.phone || 'No phone'}
              </Text>
            </View>
            <MaterialIcons name="open-in-new" size={14} color="#16A34A" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.phoneDialerButton}
            onPress={handlePhonePress}
            activeOpacity={0.7}
          >
            <MaterialIcons name="call" size={16} color="#3B82F6" />
          </TouchableOpacity>
        </View>

        {/* Info Grid (Email, Location, Extra meta) */}
        <View style={styles.infoGrid}>
          {/* Email */}
          <TouchableOpacity
            style={styles.gridItem}
            onPress={handleEmailPress}
            activeOpacity={0.7}
          >
            <View style={[styles.smallIconCircle, { backgroundColor: '#EFF6FF' }]}>
              <MaterialIcons name="email" size={12} color="#3B82F6" />
            </View>
            <View style={styles.gridItemContent}>
              <Text style={styles.fieldLabel}>EMAIL</Text>
              <Text style={[styles.fieldValue, styles.linkValue]} numberOfLines={1}>
                {item.email || 'N/A'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Location */}
          <View style={styles.gridItem}>
            <View style={[styles.smallIconCircle, { backgroundColor: '#FEF2F2' }]}>
              <MaterialIcons name="location-on" size={12} color="#EF4444" />
            </View>
            <View style={styles.gridItemContent}>
              <Text style={styles.fieldLabel}>LOCATION</Text>
              <Text style={styles.fieldValue} numberOfLines={1}>
                {item.location || 'N/A'}
              </Text>
            </View>
          </View>

          {/* Optional Meta fields */}
          {item.leadgen_id ? (
            <View style={styles.gridItem}>
              <View style={[styles.smallIconCircle, { backgroundColor: '#F5F3FF' }]}>
                <MaterialIcons name="fingerprint" size={12} color="#8B5CF6" />
              </View>
              <View style={styles.gridItemContent}>
                <Text style={styles.fieldLabel}>LEADGEN ID</Text>
                <Text style={styles.fieldValue} numberOfLines={1}>{item.leadgen_id}</Text>
              </View>
            </View>
          ) : null}

          {item.company_name ? (
            <View style={styles.gridItem}>
              <View style={[styles.smallIconCircle, { backgroundColor: '#ECFDF5' }]}>
                <MaterialIcons name="business" size={12} color="#10B981" />
              </View>
              <View style={styles.gridItemContent}>
                <Text style={styles.fieldLabel}>COMPANY</Text>
                <Text style={styles.fieldValue} numberOfLines={1}>{item.company_name}</Text>
              </View>
            </View>
          ) : null}

          {item.industry ? (
            <View style={styles.gridItem}>
              <View style={[styles.smallIconCircle, { backgroundColor: '#FFFBEB' }]}>
                <MaterialIcons name="domain" size={12} color="#F59E0B" />
              </View>
              <View style={styles.gridItemContent}>
                <Text style={styles.fieldLabel}>INDUSTRY</Text>
                <Text style={styles.fieldValue} numberOfLines={1}>{item.industry}</Text>
              </View>
            </View>
          ) : null}

          {item.business_goal ? (
            <View style={styles.gridItem}>
              <View style={[styles.smallIconCircle, { backgroundColor: '#FFF1F2' }]}>
                <MaterialIcons name="track-changes" size={12} color="#F43F5E" />
              </View>
              <View style={styles.gridItemContent}>
                <Text style={styles.fieldLabel}>GOAL</Text>
                <Text style={styles.fieldValue} numberOfLines={1}>{item.business_goal}</Text>
              </View>
            </View>
          ) : null}

          {item.meta_ads ? (
            <View style={styles.gridItem}>
              <View style={[styles.smallIconCircle, { backgroundColor: '#EFF6FF' }]}>
                <MaterialIcons name="campaign" size={12} color="#3B82F6" />
              </View>
              <View style={styles.gridItemContent}>
                <Text style={styles.fieldLabel}>META ADS</Text>
                <Text style={styles.fieldValue} numberOfLines={1}>{item.meta_ads}</Text>
              </View>
            </View>
          ) : null}
        </View>

        {/* Message Note Section */}
        {item.message ? (
          <View style={styles.messageBox}>
            <View style={styles.messageHeaderRow}>
              <MaterialIcons name="chat-bubble-outline" size={12} color="#64748B" />
              <Text style={styles.messageLabel}>MESSAGE / ENQUIRY NOTE</Text>
            </View>
            <Text style={styles.messageText} numberOfLines={isExpanded ? undefined : 2}>
              {item.message}
            </Text>
            {item.message.length > 70 && (
              <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)} style={styles.expandBtn}>
                <Text style={styles.expandText}>
                  {isExpanded ? 'Show Less' : 'Read Full Note'}
                </Text>
                <MaterialIcons
                  name={isExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                  size={14}
                  color="#6366F1"
                />
              </TouchableOpacity>
            )}
          </View>
        ) : null}
      </View>

      {/* 3. ASSIGNED BY SECTION - AT THE BOTTOM OF THE CARD */}
      <View style={styles.bottomAssignedSection}>
        <View style={styles.assignedLeft}>
          <View style={[styles.avatarCircle, { backgroundColor: palette.avatarBg }]}>
            <Text style={[styles.avatarInitials, { color: palette.avatarText }]}>
              {getInitials(item.assignedName)}
            </Text>
          </View>
          <View style={styles.assignedDetails}>
            <Text style={styles.assignedHeading}>ASSIGNED STAFF</Text>
            <Text style={styles.assignedStaffName} numberOfLines={1}>
              {item.assignedName || 'Unassigned'}
            </Text>
          </View>
        </View>

        {/* Quick bottom action buttons */}
        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={[styles.quickActionButton, styles.quickViewBtn]}
            onPress={() => onView(item)}
            activeOpacity={0.7}
          >
            <Feather name="eye" size={13} color="#0284C7" />
          </TouchableOpacity>

          {(permissions.includes('all') || permissions.includes('contact_page_edit')) && (
            <TouchableOpacity
              style={[styles.quickActionButton, styles.quickEditBtn]}
              onPress={() => onEdit(item)}
              activeOpacity={0.7}
            >
              <Feather name="edit-2" size={12} color="#D97706" />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.quickActionButton, styles.quickAssignBtn]}
            onPress={() => onAssign && onAssign(item)}
            activeOpacity={0.7}
          >
            <MaterialIcons name="person-add-alt-1" size={13} color="#2563EB" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default ContactEnquiryCard;

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3.5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  headerBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeIcon: {
    marginRight: 4,
  },
  sourceText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#FFFFFF',
    marginRight: 4,
    opacity: 0.85,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  dateText: {
    fontSize: 9.5,
    color: '#64748B',
    fontWeight: '500',
  },
  menuTrigger: {
    padding: 3,
    borderRadius: 6,
  },
  contentBody: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  iconChip: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameTextWrapper: {
    flex: 1,
  },
  nameLabel: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  nameValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 1,
  },
  interactiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  whatsappButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  whatsappIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#25D366',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  whatsappTextContainer: {
    flex: 1,
  },
  whatsappSubLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#15803D',
    letterSpacing: 0.4,
  },
  whatsappPhoneText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
    marginTop: 1,
  },
  phoneDialerButton: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  gridItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  smallIconCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  gridItemContent: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 7.5,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.3,
  },
  fieldValue: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#1E293B',
  },
  linkValue: {
    color: '#2563EB',
  },
  messageBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    marginTop: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#6366F1',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  messageHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 3,
  },
  messageLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.4,
  },
  messageText: {
    fontSize: 11,
    color: '#334155',
    lineHeight: 16,
  },
  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 4,
  },
  expandText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6366F1',
  },
  bottomAssignedSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  assignedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  avatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 11,
    fontWeight: '800',
  },
  assignedDetails: {
    flex: 1,
  },
  assignedHeading: {
    fontSize: 7.5,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.4,
  },
  assignedStaffName: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 0.5,
  },
  bottomActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  quickActionButton: {
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  quickViewBtn: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
  },
  quickEditBtn: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  quickAssignBtn: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  modalBackdrop: {
    flex: 1,
  },
  menuContainer: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minWidth: 135,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  menuItemDelete: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  menuText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  menuTextDelete: {
    color: '#EF4444',
  },
});