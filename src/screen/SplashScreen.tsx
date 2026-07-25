// import React, { useEffect, useRef } from "react";
import { Animated, Easing, StatusBar, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useRef } from "react";

const SplashScreen = () => {
  const navigation = useNavigation<any>();

  // Logo animations
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.7)).current;

  // Footer animation
  const footerOpacity = useRef(new Animated.Value(0)).current;
  const footerTranslateY = useRef(new Animated.Value(15)).current;

  useEffect(() => {
    Animated.sequence([
      // Step 1: Logo fades in + scales up with a soft bounce
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 5,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
      // Step 2: Footer fades in and slides up slightly
      Animated.parallel([
        Animated.timing(footerOpacity, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(footerTranslateY, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    const timer = setTimeout(() => {
      navigation.replace("Login");
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FCFCFC" />

      <View style={styles.logoContainer}>
        <Animated.Image
          source={require("../asset/images/logo.png")}
          style={[
            styles.image,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
          resizeMode="contain"
        />
      </View>

      <Animated.View
        style={[
          styles.footerContainer,
          {
            opacity: footerOpacity,
            transform: [{ translateY: footerTranslateY }],
          },
        ]}
      >
        <Text style={styles.footerText}>POWERED BY</Text>
        <Text style={styles.brandText}>YOUR BRAND</Text>
      </Animated.View>
    </View>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FCFCFC",
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    height: 200,
    width: 200,
  },
  footerContainer: {
    position: "absolute",
    bottom: 50,
    alignItems: "center",
  },
  footerText: {
    color: "#8E8E93",
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: "600",
  },
  brandText: {
    color: "#1C1C1E",
    fontSize: 14,
    letterSpacing: 3,
    fontWeight: "700",
    marginTop: 4,
  },
});