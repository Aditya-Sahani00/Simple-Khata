import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, useColorScheme, Alert } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "@/context/AppContext";
import { AppColors } from "@/constants/colors";
import { saveData, STORAGE_KEYS } from "@/utils/storage";

export default function LoginPage() {
  const { settings, isLoaded } = useApp();
  const systemScheme = useColorScheme();
  
  // Sync theme with system
  const isDark = settings.theme === "dark" || 
    (settings.theme === "system" && systemScheme === "dark");
  
  const colors = isDark ? AppColors.dark : AppColors.light;
  const primary = AppColors.primary;

  // Placeholder for Google login logic
  const handleGoogleLogin = () => {
    Alert.alert(
      "Google Login Coming Soon",
      "Google Drive backup feature will be available in a future update. Your data is safely stored locally on this device."
    );
  };

  const handleLoginSuccess = async () => {
    Alert.alert(
      "Login as Guest",
      "You're logging in as a guest. Your data will be stored locally on this device.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Continue", 
          onPress: async () => {
            // Save login status
            await saveData(STORAGE_KEYS.HAS_LOGGED_IN, true);
            
            // Check if app lock is enabled
            if (settings.appLockEnabled) {
              // Show PIN entry before going to tabs
              router.replace("/modal/pin?mode=enter");
            } else {
              // Go directly to tabs
              router.replace("/(tabs)");
            }
          }
        },
      ]
    );
  };

  const handleGuestLogin = async () => {
    // TODO: Implement guest login logic
    // For now, just go to login success
    await handleLoginSuccess();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Image source={require("../assets/images/simpleKhata.png")} style={styles.logo} />
      <Text style={[styles.title, { color: colors.text }]}>Welcome to Simple Khata Tracker</Text>
      
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Your offline financial ledger
      </Text>
      
      <View style={styles.storageInfo}>
        <Ionicons name="phone-portrait-outline" size={16} color={colors.textMuted} />
        <Text style={[styles.storageText, { color: colors.textMuted }]}>
          Data stored locally on your device
        </Text>
      </View>

      <TouchableOpacity 
        style={[styles.googleBtn, { backgroundColor: "#4285F4" }]} 
        onPress={handleGoogleLogin}
      >
        <Ionicons name="logo-google" size={24} color="#fff" />
        <Text style={styles.googleBtnText}>Login with Google</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.guestBtn, { backgroundColor: colors.card, borderColor: primary }]} 
        onPress={handleGuestLogin}
      >
        <Ionicons name="person" size={24} color={primary} />
        <Text style={[styles.guestBtnText, { color: primary }]}>Continue as Guest</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 24,
    resizeMode: "contain",
  },
  title: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
    textAlign: "center",
  },
  storageInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 32,
  },
  storageText: {
    fontSize: 13,
  },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginBottom: 18,
  },
  googleBtnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    marginLeft: 12,
  },
  guestBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderWidth: 1,
  },
  guestBtnText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    marginLeft: 12,
  },
});
