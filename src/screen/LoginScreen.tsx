import React, { useState, useRef } from "react";
import {
  Alert,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StatusBar,
  Animated,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { verticalScale, scale, moderateScale } from "../utils/responsive";
import { useNavigation } from "@react-navigation/native";
import api, { setAuthToken, setStoredUser } from "../config/apiConfig";

const Login = () => {
  const navigation = useNavigation<any>();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [usernameFocused, setUsernameFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [loading, setLoading] = useState(false);

  const buttonScale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  const handleLogin = async () => {
    if (!username.trim() || !password) {
      Alert.alert("Missing details", "Please enter both username and password.");
      return;
    }

    setLoading(true);
    try {
      // NOTE: backend field name assumed as "email" below (common Laravel
      // auth convention). If your /login endpoint expects a "username" key
      // instead, just change the key on the line below.
      const response = await api.post("/login", {
        email: username.trim(),
        password,
      });

      console.log("API Response:", response.data);
      const { status, token, user } = response.data || {};

      if (status && token) {
        // Save token in memory + AsyncStorage — every future api.* call
        // will automatically carry `Authorization: Bearer <token>` from
        // here on, via the request interceptor in apiConfig.tsx.
        await setAuthToken(token);
        if (user) {
          await setStoredUser(user);
        }
        navigation.replace("MainTabs");
      } else {
        Alert.alert("Login failed", response.data?.message || "Please check your credentials.");
      }
    } catch (error) {
      // Network / server errors already show an Alert via the response
      // interceptor in apiConfig.tsx, so nothing else to do here.
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Gradient Background */}
      <LinearGradient
        colors={["#0A1628", "#0D2060", "#1A3A8C"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        // style={styles.absoluteFillObject}
      />

      {/* Decorative Circles */}
      <View style={styles.circle1} />
      <View style={styles.circle2} />
      <View style={styles.circle3} />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : (StatusBar.currentHeight || 0)}
          style={styles.container}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            {/* Header Section */}
            <View style={styles.headerContainer}>
              <View style={styles.logoWrapper}>
                <Image
                  source={require("../asset/images/logo.png")}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>Sign in to your Webbitech account</Text>
            </View>

            {/* Glass Card */}
            <View style={styles.card}>
              {/* Username */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Username</Text>
                <View style={[styles.inputWrapper, usernameFocused && styles.inputWrapperFocused]}>
                  <MaterialIcons
                    name="person-outline"
                    size={20}
                    color={usernameFocused ? "#4E8EFF" : "#9AA5B4"}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your username"
                    placeholderTextColor="#6B7A8D"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                    onFocus={() => setUsernameFocused(true)}
                    onBlur={() => setUsernameFocused(false)}
                  />
                </View>
              </View>

              {/* Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={[styles.inputWrapper, passwordFocused && styles.inputWrapperFocused]}>
                  <MaterialIcons
                    name="lock-outline"
                    size={20}
                    color={passwordFocused ? "#4E8EFF" : "#9AA5B4"}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your password"
                    placeholderTextColor="#6B7A8D"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}
                  >
                    <MaterialIcons
                      name={showPassword ? "visibility" : "visibility-off"}
                      size={20}
                      color="#9AA5B4"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Forgot Password */}
              <TouchableOpacity style={styles.forgotWrapper}>
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>

              {/* Sign In Button */}
              <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                <TouchableOpacity
                  activeOpacity={1}
                  disabled={loading}
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                  onPress={handleLogin}
                >
                  <LinearGradient
                    colors={["#4E8EFF", "#1A5CFF"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.button, loading && styles.buttonDisabled]}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Text style={styles.buttonText}>Sign In</Text>
                        <MaterialIcons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Powered by </Text>
              <Text style={styles.footerBrand}>Webbitech</Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

export default Login;

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    paddingVertical: verticalScale(24),
  },

  // Decorative circles
  circle1: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(78, 142, 255, 0.12)",
    top: -80,
    right: -80,
  },
  circle2: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(78, 142, 255, 0.08)",
    bottom: 120,
    left: -60,
  },
  circle3: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(100, 180, 255, 0.06)",
    bottom: 300,
    right: 20,
  },
  // Header
  headerContainer: {
    alignItems: "center",
    marginBottom: 32,
    paddingTop: verticalScale(20),
  },
  logoWrapper: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  logo: {
    height: 80,
    width: 80,

  },
  title: {
    fontSize: moderateScale(28),
    fontWeight: "800",
    color: "#000",
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: moderateScale(14),
    fontWeight: "400",
    // color: "rgba(255,255,255,0.6)",
    color: "#000",
    textAlign: "center",
  },
  // Glass Card
  card: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: moderateScale(13),
    fontWeight: "600",
    // color: "rgba(255,255,255,0.8)",
    color:"#000",
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  inputWrapperFocused: {
    borderColor: "#4E8EFF",
    backgroundColor: "rgba(78,142,255,0.08)",
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: moderateScale(15),
    color: "#000000",
    paddingVertical: 0,
  },
  eyeButton: {
    padding: 4,
  },
  forgotWrapper: {
    alignItems: "flex-end",
    marginBottom: 24,
    marginTop: 4,
  },
  forgotText: {
    fontSize: moderateScale(13),
    color: "#4E8EFF",
    fontWeight: "600",
  },
  button: {
    height: 54,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  buttonDisabled: {
    opacity: 0.75,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: moderateScale(16),
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  // Footer
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 32,
    paddingBottom: 20,
  },
  footerText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
  },
  footerBrand: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
});
