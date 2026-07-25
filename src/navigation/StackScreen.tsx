import { View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RootStackParamList } from "../type/type";
import SplashScreen from "../screen/SplashScreen";
import Login from "../screen/LoginScreen";
import AddLeadsForm from "../screen/AddLeadsForm";
import EditEnquiryForm from "../screen/EditEnquiryForm";
import DrawerScreen from "./DrawerScreen";
import ViewContactLeadDetails from "../screen/ViewLeadDetails";

const Stack = createNativeStackNavigator<RootStackParamList>();

const StackScreen = () => {
  return (
    <View style={{ flex: 1 }}>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Splash">
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={Login} />

        <Stack.Screen
          name="MainTabs"
          component={DrawerScreen}
          options={{ headerShown: false }}
        />

        <Stack.Screen name="AddLeadsForm" component={AddLeadsForm} options={{ headerShown: false }} />
        <Stack.Screen name="EditEnquiryForm" component={EditEnquiryForm} options={{ headerShown: false }} />
        <Stack.Screen name="ViewContactLeadDetails" component={ViewContactLeadDetails} options={{ headerShown: false }} />
      </Stack.Navigator>
    </View>
  );
};

export default StackScreen;
