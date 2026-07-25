import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  Image,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { NativeStackHeaderProps } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scale, verticalScale, moderateScale } from "../utils/responsive";
import { COLORS } from "../theme/colors";

const HEADER_HEIGHT = verticalScale(66);

const StackHeader = ({
  navigation,
  options,
  route,
}: NativeStackHeaderProps) => {
  const insets = useSafeAreaInsets();

  const title =
    options.title !== undefined ? options.title : route.name;

  return (
    <>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      <View
        style={[
          styles.container,
          {
            paddingTop:
              Platform.OS === "android"
                ? StatusBar.currentHeight
                : insets.top,
          },
        ]}
      >
        <View style={styles.header}>
          {/* Left */}
          <View style={styles.side}>
            {navigation.canGoBack() && (
              <TouchableOpacity
                style={styles.iconButton}
                activeOpacity={0.8}
                onPress={() => navigation.goBack()}
              >
                <MaterialIcons
                  name="arrow-back"
                  size={moderateScale(24)}
                  color="#fff"
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Center */}
          <View style={styles.center}>
            {title === 'WebbiTech' ? (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Image 
                  source={require('../asset/images/logo.png')} 
                  style={{ width: scale(140), height: moderateScale(40), resizeMode: 'contain' }} 
                />
              </View>
            ) : (
              <Text
                style={styles.title}
                numberOfLines={1}
              >
                {title}
              </Text>
            )}
          </View>


          {/* Right */}
          <View style={styles.side}>
            {route.name === "LeadsStatus" && (
              <TouchableOpacity
                style={styles.iconButton}
                activeOpacity={0.8}
                onPress={() => navigation.navigate("AddLeadsStatus")}
              >
                <MaterialIcons
                  name="add"
                  size={moderateScale(26)}
                  color="#fff"
                />
              </TouchableOpacity>
            )}
          </View>        
          </View>
      </View>
    </>
  );
};

export default StackHeader;

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.accent,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  header: {
    height: HEADER_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
  },

  side: {
    width: scale(56),
    justifyContent: "center",
    alignItems: "center",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  iconButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    justifyContent: "center",
    alignItems: "center",
    borderRadius: moderateScale(20),
  },

  title: {
    color: "#fff",
    fontSize: moderateScale(18),
    fontWeight: "600",
    textAlign: "center",
  },
});