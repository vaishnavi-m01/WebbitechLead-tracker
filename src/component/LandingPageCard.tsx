import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Alert,
  Linking,
  TouchableOpacity,
  ToastAndroid,
  Modal,
  ActivityIndicator,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Feather from 'react-native-vector-icons/Feather';

import { COLORS } from '../theme/colors';
import api from '../config/apiConfig';

interface DropdownItem {
  label: string;
  value: string;
}

export interface LandingPageLead {
  id: string;
  dateTime: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  websiteType: string;
  verified: boolean;
  status: string;
  statusColor?: string | null;
}

interface LandingPageCardProps {
  item: LandingPageLead;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete?: (id: string) => void;
  permissions?: string[];
  onStatusUpdate?: (id: string, newStatus: string) => void;
}

export interface LeadHeaderControlsProps {
  allSelected: boolean;
  onToggleSelectAll: () => void;
  selectedCount: number;
  selectedStatus: string | null;
  onStatusChange: (status: string | null) => void;
  onExport: () => void;
  dateRangeType?: string;
  onDateRangeChange?: (type: string) => void;
  showStatusAndExport?: boolean;
  onDropdownToggle?: (isOpen: boolean) => void;
}


export const getStatusColor = (statusName: string) => {
  const normalized = statusName?.toLowerCase().trim() || '';

  switch (normalized) {
    case 'interested':
      return { bg: '#DBEAFE', text: '#1D4ED8', border: '#BFDBFE' }; // Blue
    case 'order confirmed':
      return { bg: '#D1FAE5', text: '#065F46', border: '#A7F3D0' }; // Emerald Green
    case 'follow ups':
    case 'call back':
      return { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' }; // Amber Yellow
    case 'not interested':
    case 'not intrested':
    case 'order cancelled':
      return { bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5' }; // Crimson Red
    case 'wrong enquiry':
      return { bg: '#F3E8FF', text: '#6B21A8', border: '#E9D5FF' }; // Purple
    case 'phone not pick':
    case 'phone not picked':
      return { bg: '#FFEDD5', text: '#9A3412', border: '#FED7AA' }; // Orange
    case 'in future':
      return { bg: '#E0F2FE', text: '#075985', border: '#BAE6FD' }; // Sky Blue
    case 'closed':
    case 'resolved':
      return { bg: '#F3F4F6', text: '#6B7280', border: '#E5E7EB' }; // Dark Gray
    case 'new':
      return { bg: '#DBEAFE', text: '#1D4ED8', border: '#BFDBFE' }; // Blue
    case 'in progress':
      return { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A' }; // Amber Yellow
    default:
      return { bg: '#F1F5F9', text: '#475569', border: '#E2E8F0' }; // Neutral Gray
  }
};

export const LeadHeaderControls: React.FC<LeadHeaderControlsProps> = ({
  allSelected,
  onToggleSelectAll,
  selectedCount,
  selectedStatus,
  onStatusChange,
  onExport,
  dateRangeType,
  onDateRangeChange,
  showStatusAndExport = true,
  onDropdownToggle,
}) => {
  const [dropdownOpenState, setDropdownOpenState] = useState(false);

  const setDropdownOpen = (isOpen: boolean) => {
    setDropdownOpenState(isOpen);
    if (onDropdownToggle) {
      onDropdownToggle(isOpen);
    }
  };
  const dropdownOpen = dropdownOpenState;
  const [statusOptions, setStatusOptions] = useState<DropdownItem[]>([]);
  const dropdownButtonRef = useRef<View>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });

  const openDropdown = () => {
    if (dropdownOpen) {
      setDropdownOpen(false);
      return;
    }
    dropdownButtonRef.current?.measure((fx: number, fy: number, width: number, height: number, px: number, py: number) => {
      setDropdownPos({
        top: py + height + 4,
        left: px,
        width: width,
      });
      setDropdownOpen(true);
    });
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

  if (!showStatusAndExport) {
    return null;
  }

  return (
    <View style={[styles.headerContainer, { zIndex: 10 }]}>
      <View style={[styles.headerRightControls, { zIndex: 2000 }]}>
          <>
              <View 
                style={[styles.dropdownWrapper, { flex: 1, zIndex: 5000, elevation: 10 }]}
                ref={dropdownButtonRef}
              >
                <TouchableOpacity
                  style={[styles.headerDropdown, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
                  onPress={openDropdown}
                  activeOpacity={0.7}
                >
                <Text style={[styles.dropdownBlackText, { color: selectedStatus ? '#000000' : '#64748B', flex: 1 }]} numberOfLines={1}>
                  {selectedStatus ? statusOptions.find(o => o.value === selectedStatus)?.label || selectedStatus : "Filter by Status"}
                </Text>
                <MaterialIcons name="keyboard-arrow-down" size={18} color="#64748B" />
              </TouchableOpacity>
              {dropdownOpen && (
                <Modal visible={dropdownOpen} transparent animationType="none" onRequestClose={() => setDropdownOpen(false)}>
                  <TouchableOpacity 
                    style={{ flex: 1 }} 
                    activeOpacity={1}
                    onPress={() => setDropdownOpen(false)}
                  >
                    <View style={{
                      position: 'absolute',
                      top: dropdownPos.top,
                      left: dropdownPos.left,
                      width: dropdownPos.width,
                      backgroundColor: '#FFFFFF',
                      borderRadius: 10,
                      maxHeight: 250,
                      elevation: 10,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.15,
                      shadowRadius: 8,
                    }}>
                      <ScrollView style={{ flexGrow: 0 }} showsVerticalScrollIndicator={true}>
                        {statusOptions.map((opt) => (
                          <TouchableOpacity
                            key={opt.value}
                            style={{ paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}
                            onPress={() => {
                              onStatusChange(opt.value);
                              setDropdownOpen(false);
                            }}
                          >
                            <Text style={{ fontSize: 14, color: selectedStatus === opt.value ? COLORS.accent : '#334155', fontWeight: selectedStatus === opt.value ? '700' : '500' }}>
                              {opt.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  </TouchableOpacity>
                </Modal>
              )}
            </View>

            <TouchableOpacity style={[styles.exportBtn, { marginLeft: 8 }]} onPress={onExport} activeOpacity={0.7}>
              <Feather name="download" size={14} color={COLORS.accent} />
              <Text style={styles.exportBtnText}>Export</Text>
            </TouchableOpacity>
          </>
      </View>

      {selectedStatus ? (
        <View style={styles.activeFilterRow}>
          <MaterialIcons name="filter-list" size={14} color={COLORS.accent} />
          <Text style={styles.activeFilterLabel}>Filtered:</Text>
          <View style={styles.activeFilterChip}>
            <Text style={styles.activeFilterChipText}>{selectedStatus}</Text>
            <TouchableOpacity
              onPress={() => onStatusChange(null)}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <MaterialIcons name="close" size={13} color={COLORS.accent} />
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </View>
  );
};

const LandingPageCard: React.FC<LandingPageCardProps> = ({
  item,
  isSelected,
  onSelect,
  onDelete,
  onStatusUpdate,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedModalStatus, setSelectedModalStatus] = useState<string | null>(item.status);
  const [statusOptions, setStatusOptions] = useState<DropdownItem[]>([]);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const statusColors =  getStatusColor(item.status);

  const fetchStatuses = async () => {
    setLoadingStatus(true);
    try {
      const response = await api.get('/status');
      if (response.data && Array.isArray(response.data.data)) {
        const mapped = response.data.data.map((s: any) => ({
          label: s.name,
          value: s.name,
        }));
        setStatusOptions(mapped);
      }
    } catch (error) {
      console.error('Error fetching statuses:', error);
      ToastAndroid.show('Failed to load statuses', ToastAndroid.SHORT);
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleEditPress = () => {
    setSelectedModalStatus(item.status);
    setIsModalOpen(true);
    fetchStatuses();
  };

  const handleUpdateStatus = async () => {
    if (!selectedModalStatus) {
      ToastAndroid.show('Please select a status', ToastAndroid.SHORT);
      return;
    }

    setUpdating(true);
    try {
      const response = await api.put(`/landing-pages/${item.id}/status`, {
        status: selectedModalStatus,
      });

      if (response.data) {
        ToastAndroid.show('Status updated successfully', ToastAndroid.SHORT);
        item.status = selectedModalStatus;
        if (onStatusUpdate) {
          onStatusUpdate(item.id, selectedModalStatus);
        }
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      ToastAndroid.show('Failed to update status', ToastAndroid.SHORT);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeletePress = () => {
    Alert.alert(
      'Delete Lead',
      `Are you sure you want to delete "${item.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await api.delete(`/landing-pages/${item.id}`);
              if (response.data) {
                ToastAndroid.show('Lead deleted successfully', ToastAndroid.SHORT);
                onDelete(item.id);
              }
            } catch (error) {
              console.error('Failed to delete lead:', error);
              ToastAndroid.show('Failed to delete lead', ToastAndroid.SHORT);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handlePhonePress = async () => {
    if (!item.phone) return;
    try {
      await Linking.openURL(`tel:${item.phone.trim()}`);
    } catch {
      Alert.alert('Error', 'Could not open dialer.');
    }
  };

  const handleEmailPress = async () => {
    if (!item.email) return;
    try {
      await Linking.openURL(`mailto:${item.email.trim()}`);
    } catch {
      Alert.alert('Error', 'Could not open mail app.');
    }
  };

  return (
    <View style={[styles.card, isSelected && styles.cardSelected]}>
      {/* Top Header Row */}
      <View style={styles.topRow}>
        <TouchableOpacity
          style={[styles.checkbox, isSelected && styles.checkboxActive]}
          onPress={() => onSelect(item.id)}
          activeOpacity={0.7}
        >
          {isSelected && <MaterialIcons name="check" size={14} color="#FFFFFF" />}
        </TouchableOpacity>

        <View style={styles.dateTimeBox}>
          <MaterialIcons name="access-time" size={13} color="#94A3B8" />
          <Text style={styles.dateTimeText}>{item.dateTime}</Text>
        </View>

        {/* Dynamic Status Badge (Colored Card Only) */}
        <View
          style={[
            styles.currentStatusBadge,
            {
              backgroundColor: statusColors.bg,
              borderColor: statusColors.border,
            },
          ]}
        >
          <Text style={[styles.currentStatusText, { color: statusColors.text }]}>
            {item.status ? item.status : 'N/A'}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Info Grid */}
      <View style={styles.infoGrid}>
        <View style={styles.infoTwoColumnRow}>
          <InfoRow icon="person-outline" label="Name" value={item.name} />
          <InfoRow
            icon="mail-outline"
            label="Email"
            value={item.email}
            onPress={handleEmailPress}
            isLink
          />
        </View>

        <View style={styles.infoTwoColumnRow}>
          <InfoRow
            icon="phone"
            label="Phone"
            value={item.phone}
            onPress={handlePhonePress}
            isLink
          />
          <InfoRow icon="web" label="Website Type" value={item.websiteType} />
        </View>
      </View>

      {/* Message Box */}
      <View style={styles.messageBox}>
        <Text style={styles.messageLabel}>MESSAGE</Text>
        <Text style={styles.messageText} numberOfLines={isExpanded ? undefined : 2}>
          {item.message || 'No message provided.'}
        </Text>
        {item.message && item.message.length > 80 && (
          <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)}>
            <Text style={{ color: COLORS.accent, fontSize: 10, marginTop: 4 }}>
              {isExpanded ? 'Show Less' : 'Read More'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Footer Row */}
      <View style={styles.footer}>
        <View
          style={[
            styles.verifiedBadge,
            { backgroundColor: item.verified ? '#D1FAE5' : '#FEE2E2' },
          ]}
        >
          <MaterialIcons
            name={item.verified ? 'verified' : 'cancel'}
            size={13}
            color={item.verified ? '#065F46' : '#B91C1C'}
          />
          <Text
            style={[
              styles.verifiedText,
              { color: item.verified ? '#065F46' : '#B91C1C' },
            ]}
          >
            {item.verified ? 'Verified' : 'Unverified'}
          </Text>
        </View>

        <View style={styles.actionButtonsRow}>
          <TouchableOpacity style={styles.editBtn} onPress={handleEditPress} activeOpacity={0.7}>
            <MaterialIcons name="edit" color={COLORS.accent} size={18} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteBtn} onPress={handleDeletePress} activeOpacity={0.7}>
            <Feather name="trash-2" size={15} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Edit Status Modal */}
      <Modal
        visible={isModalOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsModalOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsModalOpen(false)}
        >
          <TouchableWithoutFeedback>
            <View style={styles.modalContentContainer}>
              <Text style={styles.modalTitle}>Update Status</Text>
              <Text style={styles.modalSubTitle}>{item.name}</Text>

              {loadingStatus ? (
                <ActivityIndicator size="small" color={COLORS.accent} style={{ marginVertical: 20 }} />
              ) : (
                <ScrollView style={{ maxHeight: 280, width: '100%', marginVertical: 10 }} showsVerticalScrollIndicator={true} nestedScrollEnabled={true}>
                  {statusOptions.map((opt) => (
                    <TouchableOpacity
                      key={opt.value}
                      style={{
                        paddingVertical: 12,
                        paddingHorizontal: 16,
                        borderWidth: 1,
                        borderColor: selectedModalStatus === opt.value ? COLORS.accent : '#E2E8F0',
                        borderRadius: 8,
                        marginBottom: 8,
                        backgroundColor: selectedModalStatus === opt.value ? 'rgba(0,123,255,0.05)' : '#FFFFFF',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                      onPress={() => setSelectedModalStatus(opt.value)}
                    >
                      <Text style={{ 
                        color: selectedModalStatus === opt.value ? COLORS.accent : '#0F172A', 
                        fontWeight: selectedModalStatus === opt.value ? '700' : '500',
                        fontSize: 14
                      }}>
                        {opt.label}
                      </Text>
                      {selectedModalStatus === opt.value && (
                        <MaterialIcons name="check-circle" size={18} color={COLORS.accent} />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setIsModalOpen(false)}
                disabled={updating}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleUpdateStatus}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
            </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal>
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
    <View style={styles.infoItem}>
      <MaterialIcons
        name={icon as any}
        size={14}
        color={isLink ? COLORS.accent : '#94A3B8'}
        style={{ marginTop: 1 }}
      />
      <View style={styles.infoTextBlock}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, isLink && styles.linkText]}>{value}</Text>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity style={{ flex: 1 }} onPress={onPress} activeOpacity={0.6}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

export default LandingPageCard;

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 8,
    gap: 10,
  },
  headerRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  dropdownWrapper: {
    width: 140,
  },
  headerDropdown: {
    height: 36,
    minHeight: 36,
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
  },
  headerDropdownList: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 8,
  },
  dropdownBlackText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000000', // Pure Black text for dropdown items
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0,123,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0,123,255,0.2)',
  },
  exportBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accent,
  },
  activeFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeFilterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,123,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0,123,255,0.25)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  activeFilterChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accent,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardSelected: {
    borderColor: COLORS.accent,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxActive: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accent,
  },
  dateTimeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flex: 1,
  },
  dateTimeText: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '500',
  },
  currentStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  currentStatusText: {
    fontSize: 9,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },
  infoGrid: {
    gap: 4,
    marginBottom: 6,
  },
  infoTwoColumnRow: {
    flexDirection: 'row',
    gap: 6,
  },
  infoItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  infoTextBlock: {
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
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    padding: 6,
    marginBottom: 6,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accent,
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
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: 'rgba(0,123,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContentContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalSubTitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
    marginTop: 2,
  },
  modalDropdownWrapper: {
    marginBottom: 20,
  },
  modalDropdown: {
    borderColor: '#E2E8F0',
    borderRadius: 8,
    minHeight: 42,
  },
  modalDropdownList: {
    borderColor: '#E2E8F0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  modalActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  saveBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.accent,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});