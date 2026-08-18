import { useEffect } from "react";
import { NotificationService } from "../services/NotificationService";

const NotificationManager = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    let unsubscribeListeners: (() => void) | undefined;

    const setupFCM = async () => {
      try {
        const hasPermission = await NotificationService.requestUserPermission();


        if (hasPermission) {
          const token = await NotificationService.getFCMToken();
          console.log(' [Notifi cationManager] FCM Token on Startup:', token);
          unsubscribeListeners = NotificationService.initListeners();
        }
      } catch (error) {
        console.error(' [NotificationManager] FCM Setup Failed:', error);
      }
    };


    setupFCM();


    return () => {
      if (unsubscribeListeners) {
        unsubscribeListeners();
      }
    };
  }, []);


  return <>{children}</>;
};


export default NotificationManager
