// import React, { useEffect, useRef } from "react";
// import { Animated, Easing, StatusBar, StyleSheet, Text, View } from "react-native";
// import { useNavigation } from "@react-navigation/native";
// import { useSafeAreaInsets } from "react-native-safe-area-context";
// import { loadAuthToken } from "../config/apiConfig";
// import { COLORS } from "../theme/colors";

// const SplashScreen = () => {
//   const navigation = useNavigation<any>();

//   // Logo animations
//   const logoOpacity = useRef(new Animated.Value(0)).current;
//   const logoScale = useRef(new Animated.Value(0.7)).current;

//   // Footer animation
//   const footerOpacity = useRef(new Animated.Value(0)).current;
//   const footerTranslateY = useRef(new Animated.Value(15)).current;

//   useEffect(() => {
//     Animated.sequence([
//       // Step 1: Logo fades in + scales up with a soft bounce
//       Animated.parallel([
//         Animated.timing(logoOpacity, {
//           toValue: 1,
//           duration: 600,
//           easing: Easing.out(Easing.ease),
//           useNativeDriver: true,
//         }),
//         Animated.spring(logoScale, {
//           toValue: 1,
//           friction: 5,
//           tension: 40,
//           useNativeDriver: true,
//         }),
//       ]),
//       // Step 2: Footer fades in and slides up slightly
//       Animated.parallel([
//         Animated.timing(footerOpacity, {
//           toValue: 1,
//           duration: 500,
//           easing: Easing.out(Easing.ease),
//           useNativeDriver: true,
//         }),
//         Animated.timing(footerTranslateY, {
//           toValue: 0,
//           duration: 500,
//           easing: Easing.out(Easing.ease),
//           useNativeDriver: true,
//         }),
//       ]),
//     ]).start();

//     const checkAuthAndNavigate = async () => {
//       try {
//         const token = await loadAuthToken();
//         if (token) {
//           navigation.replace("MainTabs");
//         } else {
//           navigation.replace("Login");
//         }
//       } catch (error) {
//         navigation.replace("Login");
//       }
//     };

//     const timer = setTimeout(() => {
//       checkAuthAndNavigate();
//     }, 2200);

//     return () => clearTimeout(timer);
//   }, []);

//   const insets = useSafeAreaInsets();

//   return (
//     <View style={styles.container}>
//       <StatusBar barStyle="light-content" backgroundColor="#007BFF" />

//       <View style={styles.logoContainer}>
//         <Animated.Image
//           source={require("../asset/images/logo.png")}
//           style={[
//             styles.image,
//             {
//               opacity: logoOpacity,
//               transform: [{ scale: logoScale }],
//             },
//           ]}
//           resizeMode="contain"
//         />
//       </View>

//       <Animated.View
//         style={[
//           styles.footerContainer,
//           {
//             opacity: footerOpacity,
//             transform: [{ translateY: footerTranslateY }],
//             bottom: Math.max(insets.bottom + 20, 50),
//           },
//         ]}
//       >
//         <Text style={styles.footerText}>POWERED BY</Text>
//         <Text style={styles.brandText}>YOUR BRAND</Text>
//       </Animated.View>
//     </View>
//   );
// };

// export default SplashScreen;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#007BFF",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   logoContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   image: {
//     height: 180,
//     width: 180,
//   },
//   footerContainer: {
//     position: "absolute",
//     bottom: 60, // Increased bottom margin to prevent hiding behind Android nav bar
//     left: 0,
//     right: 0,
//     alignItems: "center",
//   },
//   footerText: {
//     color: "rgba(255, 255, 255, 0.7)",
//     fontSize: 11,
//     letterSpacing: 2,
//     fontWeight: "500",
//   },
//   brandText: {
//     color: "#FFFFFF",
//     fontSize: 16,
//     letterSpacing: 1.5,
//     fontWeight: "700",
//     marginTop: 6,
//   },
// });

import React, { useEffect, useRef } from "react";
import { Animated, Easing, StatusBar, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { loadAuthToken } from "../config/apiConfig";

const SplashScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  // Animation Values
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const logoFloatY = useRef(new Animated.Value(0)).current;

  // Footer & Loader Animation
  const footerOpacity = useRef(new Animated.Value(0)).current;
  const footerTranslateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.sequence([
      // Step 1: Logo Reveal with Spring dynamic elasticity
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 5,
          tension: 50,
          useNativeDriver: true,
        }),
      ]),

      // Step 2: Footer Slide Up
      Animated.parallel([
        Animated.timing(footerOpacity, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(footerTranslateY, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.back(1)),
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      // Step 3: Gentle Floating Loop Effect for Logo while waiting
      Animated.loop(
        Animated.sequence([
          Animated.timing(logoFloatY, {
            toValue: -8,
            duration: 1200,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(logoFloatY, {
            toValue: 0,
            duration: 1200,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      ).start();
    });

    // Auth Check & Navigation
    const checkAuthAndNavigate = async () => {
      try {
        const token = await loadAuthToken();
        if (token) {
          navigation.replace("MainTabs");
        } else {
          navigation.replace("Login");
        }
      } catch (error) {
        navigation.replace("Login");
      }
    };

    const timer = setTimeout(() => {
      checkAuthAndNavigate();
    }, 2400);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent />

      {/* Animated Center Section */}
      <View style={styles.logoContainer}>
        {/* Floating Animated Logo */}
        <Animated.Image
          source={require("../asset/images/logo.png")}
          style={[
            styles.image,
            {
              opacity: logoOpacity,
              transform: [
                { scale: logoScale },
                { translateY: logoFloatY }
              ],
            },
          ]}
          resizeMode="contain"
        />
      </View>

      {/* Animated Footer */}
      <Animated.View
        style={[
          styles.footerContainer,
          {
            opacity: footerOpacity,
            transform: [{ translateY: footerTranslateY }],
            bottom: Math.max(insets.bottom + 20, 40),
          },
        ]}
      >
        <Text style={styles.footerText}>POWERED BY</Text>
        <Text style={styles.brandText}>Webbitech</Text>
      </Animated.View>
    </View>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  image: {
    height: 170,
    width: 170,
  },
  footerContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  footerText: {
    color: "#94A3B8",
    fontSize: 10,
    letterSpacing: 2.5,
    fontWeight: "600",
  },
  brandText: {
    color: "#0F172A",
    fontSize: 15,
    letterSpacing: 2,
    fontWeight: "800",
    marginTop: 4,
  },
});