import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Platform,
  ToastAndroid,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Feather from 'react-native-vector-icons/Feather';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import api from '../config/apiConfig';

import { COLORS } from '../theme/colors';

const NotificationScreen = () => {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchNotifications = async (pageNum = 1, isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const response = await api.get(`/firebase/notifications?page=${pageNum}`);
      
      if (response.data && response.data.status && response.data.data) {
        const newNotifications = response.data.data.data;
        const lastPage = response.data.data.last_page;
        
        if (isRefresh || pageNum === 1) {
          setNotifications(newNotifications);
        } else {
          setNotifications((prev) => [...prev, ...newNotifications]);
        }
        
        setHasMore(pageNum < lastPage);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications(1);
  }, []);

  const onRefresh = () => {
    fetchNotifications(1, true);
  };

  const handleLoadMore = () => {
    if (hasMore && !isLoading) {
      fetchNotifications(page + 1);
    }
  };

  const handleNotificationPress = async (item: any) => {
    if (!item.is_read) {
      // Optimistically mark as read
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === item.id ? { ...notif, is_read: true } : notif
        )
      );
      
      try {
        console.log(`Calling POST /firebase/notifications/${item.id}/handle`);
        const response = await api.post(`/firebase/notifications/${item.id}/handle`);
        console.log('POST Notification Response:', response.data);
      } catch (error: any) {
        console.error('Error marking notification as read:', error?.response?.data || error);
      }
    }
  };

  const handleDelete = async (id: number) => {
    // Optimistic delete
    const previousNotifications = [...notifications];
    setNotifications(prev => prev.filter(item => item.id !== id));
    
    try {
      console.log(`Calling DELETE /firebase/notifications/${id}`);
      const response = await api.delete(`/firebase/notifications/${id}`);
      console.log('DELETE Notification Response:', response.data);
      if (Platform.OS === 'android') {
        ToastAndroid.show('Notification deleted', ToastAndroid.SHORT);
      }
    } catch (error: any) {
      console.error('Error deleting notification:', error?.response?.data || error);
      // Revert if failed
      setNotifications(previousNotifications);
      if (Platform.OS === 'android') {
        ToastAndroid.show('Failed to delete notification', ToastAndroid.SHORT);
      }
    }
  };

  const handleClearAll = () => {
    Alert.alert(
      "Clear All Notifications",
      "Are you sure you want to delete all notifications?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Clear All", 
          style: "destructive",
          onPress: async () => {
            try {
              console.log('Calling DELETE /firebase/notifications');
              const response = await api.delete('/firebase/notifications');
              console.log('DELETE All Notifications Response:', response.data);
              
              setNotifications([]);
              if (Platform.OS === 'android') {
                ToastAndroid.show('All notifications cleared', ToastAndroid.SHORT);
              }
            } catch (error: any) {
              console.error('Error clearing all notifications:', error?.response?.data || error);
              if (Platform.OS === 'android') {
                ToastAndroid.show('Failed to clear notifications', ToastAndroid.SHORT);
              }
            }
          }
        }
      ]
    );
  };

  const renderRightActions = (item: any) => {
    return (
      <TouchableOpacity 
        style={styles.deleteButton}
        onPress={() => handleDelete(item.id)}
      >
        <MaterialIcons name="delete" size={24} color="#FFF" />
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item }: { item: any }) => {
    const isWhatsapp = item.title?.toLowerCase().includes('whatsapp');
    const iconColor = isWhatsapp ? '#16A34A' : '#2563EB';
    const iconBgColor = isWhatsapp ? '#DCFCE7' : '#E0E7FF';

    return (
      <View style={styles.swipeWrapper}>
        <Swipeable renderRightActions={() => renderRightActions(item)}>
          <View style={{ backgroundColor: '#F8FAFC' }}>
            <TouchableOpacity 
              style={[
                styles.notificationCard, 
                { backgroundColor: item.is_read ? '#FFFFFF' : '#F4F7FB' }
              ]}
              onPress={() => handleNotificationPress(item)}
              activeOpacity={0.8}
            >
              <View style={[styles.iconCircle, { backgroundColor: iconBgColor }]}>
                {isWhatsapp ? (
                  <MaterialIcons name="chat" size={20} color={iconColor} />
                ) : (
                  <Feather name="user-plus" size={20} color={iconColor} />
                )}
              </View>
              <View style={styles.textContainer}>
                <View style={styles.titleRow}>
                  <Text style={styles.title}>{item.title}</Text>
                  {!item.is_read && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.body}>{item.body}</Text>
                <View style={styles.dateRow}>
                  <Feather name="clock" size={12} color="#94A3B8" style={{ marginRight: 4 }} />
                  <Text style={styles.date}>
                    {new Date(item.created_at).toLocaleDateString('en-GB')} {new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </Swipeable>
      </View>
    );
  };

  const insets = useSafeAreaInsets();
  
  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: (Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : insets.top) + 16 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        {notifications.length > 0 && (
          <TouchableOpacity style={styles.clearAllBtn} onPress={handleClearAll} activeOpacity={0.7}>
            <Text style={styles.clearAllText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) + 40 }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[COLORS.accent]} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isLoading && page > 1 ? (
            <ActivityIndicator size="small" color={COLORS.accent} style={{ margin: 20 }} />
          ) : null
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="notifications-none" size={60} color="#CBD5E1" />
              <Text style={styles.emptyText}>No notifications yet</Text>
            </View>
          ) : (
            <ActivityIndicator size="large" color={COLORS.accent} style={{ marginTop: 50 }} />
          )
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent,
    paddingVertical: 16,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    bottom: 16,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  clearAllBtn: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.15)', // Sleek, semi-transparent pill
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  clearAllText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  swipeWrapper: {
    marginHorizontal: 16,
    marginTop: 12,
  },
  notificationCard: {
    flexDirection: 'row',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    alignItems: 'flex-start',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 16,
    color: '#0F172A',
    fontWeight: '600',
  },
  body: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 8,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2563EB',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: 8,
    marginLeft: 12, // Space between card and delete button
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
  },
});

export default NotificationScreen;
