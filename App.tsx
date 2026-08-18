import "react-native-gesture-handler";
import "react-native-reanimated";

import React, { useEffect } from "react";
import { StatusBar } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";

import StackScreen from "./src/navigation/StackScreen";
import Toast, { BaseToast } from 'react-native-toast-message';
import NotificationManager from "./src/utils/NotificationManager";
import { navigationRef } from "./src/navigation/NavigationService";

const toastConfig = {
  blueToast: (props: any) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: '#3B82F6', backgroundColor: '#EFF6FF' }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{ fontSize: 15, fontWeight: '700', color: '#1E3A8A' }}
      text2Style={{ fontSize: 13, color: '#1E40AF' }}
    />
  )
};

const App = () => {

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NotificationManager>
          <NavigationContainer ref={navigationRef}>
            <StatusBar
              translucent
              backgroundColor="transparent"
              barStyle="light-content"
            />
            <StackScreen />
          </NavigationContainer>
        </NotificationManager>
        <Toast config={toastConfig} />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;