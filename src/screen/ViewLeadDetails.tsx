import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Linking,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Feather from 'react-native-vector-icons/Feather';
import api from '../config/apiConfig';
import { COLORS } from '../theme/colors';
import StackHeader from '../utils/StackHeader';

interface FollowUpRecord {
  followup_date: string;
  commend: string | null;
  created_at: string;
  status_relation: {
    name: string;
  } | null;
}

interface LeadDetails {
  id: number;
  name: string;
  email: string;
  phone: string;
  state: string;
  city: string;
  sources: string;
  message: string;
  followups: FollowUpRecord[];
  // Fallbacks if available
  websiteType?: string;
  business_goal?: string;
  status?: string; 
}

const ViewContactLeadDetails = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { leadData } = route.params || {};

  const [details, setDetails] = useState<LeadDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (leadData?.id) {
      fetchLeadDetails(leadData.id);
    } else {
      setLoading(false);
      Alert.alert('Error', 'No Lead ID provided.');
    }
  }, [leadData]);

  const fetchLeadDetails = async (id: number | string) => {
    try {
      setLoading(true);
      const response = await api.get(`/contacts/${id}/followups`);
      
      if (response.data?.status && response.data?.data) {
        setDetails(response.data.data);
      } else {
        Alert.alert('Notice', 'Failed to fetch the complete details.');
      }
    } catch (error: any) {
      console.error('Fetch Lead Details Error:', error?.response?.data || error.message);
      Alert.alert('Error', 'Network error while fetching details.');
    } finally {
      setLoading(false);
    }
  };

  const handlePhonePress = () => {
    if (details?.phone) {
      Linking.openURL(`tel:${details.phone}`);
    }
  };

  const handleEmailPress = () => {
    if (details?.email) {
      Linking.openURL(`mailto:${details.email}`);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StackHeader
          navigation={navigation as any}
          route={{ name: 'ViewLeadDetails' } as any}
          options={{ title: 'Lead Details' } as any}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accent || '#2563EB'} />
          <Text style={styles.loadingText}>Fetching complete profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!details) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StackHeader
          navigation={navigation as any}
          route={{ name: 'ViewLeadDetails' } as any}
          options={{ title: 'Lead Details' } as any}
        />
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={48} color="#94A3B8" />
          <Text style={styles.errorText}>No details found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const firstLetter = details.name ? details.name.charAt(0).toUpperCase() : '?';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StackHeader
        navigation={navigation as any}
        route={{ name: 'ViewLeadDetails' } as any}
        options={{ title: 'Lead Details' } as any}
      />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} bounces={false}>

        {/* Floating Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity style={styles.actionBtn} onPress={handlePhonePress} activeOpacity={0.8}>
            <View style={[styles.actionIconCircle, { backgroundColor: '#E0E7FF' }]}>
              <MaterialIcons name="phone" size={20} color="#4F46E5" />
            </View>
            <Text style={styles.actionBtnText}>Call</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={handleEmailPress} activeOpacity={0.8} disabled={!details.email}>
            <View style={[styles.actionIconCircle, { backgroundColor: '#FCE7F3', opacity: details.email ? 1 : 0.5 }]}>
              <MaterialIcons name="email" size={20} color="#DB2777" />
            </View>
            <Text style={styles.actionBtnText}>Email</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={() => {}} activeOpacity={0.8}>
            <View style={[styles.actionIconCircle, { backgroundColor: '#DCFCE7' }]}>
              <MaterialIcons name="message" size={20} color="#16A34A" />
            </View>
            <Text style={styles.actionBtnText}>WhatsApp</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.contentPadding}>
          {/* Contact Details Card */}
          <View style={styles.modernCard}>
            <Text style={styles.cardSectionTitle}>Contact Details</Text>
            <View style={styles.cardDivider} />
            
            <View style={styles.detailRow}>
              <View style={styles.detailIconBox}>
                <Feather name="phone" size={16} color="#64748B" />
              </View>
              <View style={styles.detailTextBox}>
                <Text style={styles.detailLabel}>Phone Number</Text>
                <Text style={styles.detailValue}>{details.phone || 'N/A'}</Text>
              </View>
            </View>

            {details.email && (
              <View style={styles.detailRow}>
                <View style={styles.detailIconBox}>
                  <Feather name="mail" size={16} color="#64748B" />
                </View>
                <View style={styles.detailTextBox}>
                  <Text style={styles.detailLabel}>Email Address</Text>
                  <Text style={styles.detailValue}>{details.email}</Text>
                </View>
              </View>
            )}

            <View style={styles.detailRow}>
              <View style={styles.detailIconBox}>
                <Feather name="globe" size={16} color="#64748B" />
              </View>
              <View style={styles.detailTextBox}>
                <Text style={styles.detailLabel}>Lead Source</Text>
                <Text style={styles.detailValue}>{details.sources || 'Organic'}</Text>
              </View>
            </View>
          </View>

          {/* Message Notes */}
          {details.message && (
            <View style={styles.modernCard}>
              <Text style={styles.cardSectionTitle}> Message</Text>
              <View style={styles.cardDivider} />
              <Text style={styles.messageText}>{details.message}</Text>
            </View>
          )}

          {/* Timeline */}
          <View style={styles.modernCard}>
            <Text style={styles.cardSectionTitle}>Follow-up History</Text>
            <View style={styles.cardDivider} />

            {details.followups && details.followups.length > 0 ? (
              <View style={styles.timelineContainer}>
                {details.followups.map((f, i) => {
                  const dt = new Date(f.created_at);
                  const formattedDate = !isNaN(dt.getTime()) ? dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Date unknown';
                  const isLast = i === details.followups.length - 1;

                  return (
                    <View key={i} style={styles.timelineItem}>
                      <View style={styles.timelineIndicator}>
                        <View style={styles.timelineDot}>
                           <MaterialIcons name="check" size={10} color="#FFFFFF" />
                        </View>
                        {!isLast && <View style={styles.timelineLine} />}
                      </View>
                      
                      <View style={styles.timelineContentBox}>
                        <View style={styles.timelineHeader}>
                          <Text style={styles.timelineStatus}>{f.status_relation?.name || 'Status Updated'}</Text>
                          <Text style={styles.timelineDate}>{formattedDate}</Text>
                        </View>
                        
                        {f.commend && (
                          <View style={styles.timelineCommentBox}>
                            <Text style={styles.timelineComment}>{f.commend}</Text>
                          </View>
                        )}

                        {f.followup_date && (
                          <View style={styles.timelineNextBox}>
                            <MaterialIcons name="event" size={14} color="#0EA5E9" />
                            <Text style={styles.timelineNextText}>Next Action: {f.followup_date.split(' ')[0]}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Feather name="clock" size={32} color="#CBD5E1" />
                <Text style={styles.emptyStateText}>No follow-ups recorded yet.</Text>
              </View>
            )}
          </View>
          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ViewContactLeadDetails;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  
  /* --- Simple Profile Header --- */
  simpleProfileHeader: {
    alignItems: 'center',
    paddingTop: 30,
    paddingBottom: 24,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${COLORS.accent || '#2563EB'}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarLetter: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.accent || '#2563EB',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  profileSubtext: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },

  /* --- Quick Actions --- */
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 24,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  actionBtn: {
    alignItems: 'center',
    width: 80,
  },
  actionIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },

  /* --- Content Body --- */
  contentPadding: {
    paddingHorizontal: 16,
  },
  modernCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 16,
  },
  cardSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 16,
  },
  
  /* --- Details List --- */
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  detailTextBox: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '600',
  },

  messageText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },

  /* --- Enhanced Timeline --- */
  timelineContainer: {
    paddingLeft: 8,
    paddingTop: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  timelineIndicator: {
    alignItems: 'center',
    width: 24,
    marginRight: 16,
  },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.accent || '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E2E8F0',
    marginTop: 4,
    marginBottom: -24,
  },
  timelineContentBox: {
    flex: 1,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  timelineStatus: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
    marginRight: 8,
  },
  timelineDate: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
    marginTop: 2,
  },
  timelineCommentBox: {
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 10,
  },
  timelineComment: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  timelineNextBox: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  timelineNextText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0284C7',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 12,
  },
});
