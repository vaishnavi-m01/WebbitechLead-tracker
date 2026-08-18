import { PermissionsAndroid, Platform } from 'react-native';
import {
  getMessaging,
  getToken,
  onMessage,
  onNotificationOpenedApp,
  getInitialNotification,
  onTokenRefresh,
  isDeviceRegisteredForRemoteMessages,
  registerDeviceForRemoteMessages,
} from '@react-native-firebase/messaging';
import notifee, {
  AndroidImportance,
  AuthorizationStatus,
  AndroidStyle,
} from '@notifee/react-native';


export class NotificationService {
  /**
   * Request Runtime Permissions natively using Notifee and Android APIs
   */
  static async requestUserPermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
      if (Platform.Version >= 33) {
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        } catch (error) {
          console.error('Failed to request Android 13+ permission:', error);
          return false;
        }
      }
      return true;
    }


    if (Platform.OS === 'ios') {
      try {
        const settings = await notifee.requestPermission();
        return settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED;
      } catch (error) {
        console.error('Failed to request iOS permission:', error);
        return false;
      }
    }


    return false;
  }


  /**
   * Fetch the Firebase Cloud Messaging device token using the Modular SDK
   */
  static async getFCMToken(): Promise<string | null> {
    try {
      const messaging = getMessaging();
      if (!isDeviceRegisteredForRemoteMessages(messaging)) {
        await registerDeviceForRemoteMessages(messaging);
      }


      const token = await getToken(messaging);


      if (token) {
        return token;
      }
      return null;
    } catch (error) {
      console.error('Failed to generate FCM device token:', error);
      return null;
    }
  }


  /**
   * Global listeners displaying native OS system tray alerts with image support
   */
  static initListeners(): () => void {
    const messaging = getMessaging();


    const unsubscribeForeground = onMessage(messaging, async (remoteMessage) => {
      if (remoteMessage.notification) {
        const imageUrl =
          remoteMessage.notification.android?.imageUrl || remoteMessage.data?.image;


        const channelId = await notifee.createChannel({
          id: 'high_importance_channel',
          name: 'High Importance Notifications',
          importance: AndroidImportance.HIGH,
        });


        const androidConfig: any = {
          channelId,
          importance: AndroidImportance.HIGH,
          color: '#FFFFFF',
          pressAction: {
            id: 'default',
          },
          showTimestamp: true,
          timestamp: Date.now(),
        };


        if (imageUrl) {
          androidConfig.style = {
            type: AndroidStyle.BIGPICTURE,
            picture: imageUrl,
          };
          androidConfig.largeIcon = imageUrl;
        }


        await notifee.displayNotification({
          id: remoteMessage.messageId,
          title: remoteMessage.notification.title,
          body: remoteMessage.notification.body,
          android: androidConfig,
        });
      }
    });


    const unsubscribeOpened = onNotificationOpenedApp(
      messaging,
      (remoteMessage) => {
        console.log(
          'App opened via background notification click:',
          remoteMessage,
        );
      },
    );


    getInitialNotification(messaging).then((remoteMessage) => {
      if (remoteMessage) {
        console.log(
          'App launched from completely killed state via notification:',
          remoteMessage,
        );
      }
    });


    const unsubscribeTokenRefresh = onTokenRefresh(messaging, (newToken) => {
      console.log('FCM Token refreshed automatically:', newToken);
    });


    return () => {
      unsubscribeForeground();
      unsubscribeTokenRefresh();
      if (unsubscribeOpened) unsubscribeOpened();
    };
  }
}