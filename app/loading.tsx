import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Easing, useColorScheme } from "react-native";
import { useApp } from "@/context/AppContext";
import { AppColors } from "@/constants/colors";

export default function LoadingScreen() {
  const { settings } = useApp();
  const systemScheme = useColorScheme();
  
  // Sync theme with system
  const isDark = settings.theme === "dark" || 
    (settings.theme === "system" && systemScheme === "dark");
  
  const colors = isDark ? AppColors.dark : AppColors.light;
  const primary = AppColors.primary;

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Rotate animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View
        style={[
          styles.logoContainer,
          { transform: [{ scale: pulseAnim }] },
        ]}
      >
        <View style={[styles.logoCircle, { backgroundColor: primary }]}>
          <Text style={styles.logoText}>SK</Text>
        </View>
      </Animated.View>

      <Animated.View
        style={[
          styles.spinner,
          { borderTopColor: primary, transform: [{ rotate: spin }] },
        ]}
      />

      <Text style={[styles.title, { color: colors.text }]}>Simple Khata</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Loading...
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    marginBottom: 20,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  logoText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
  },
  spinner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 3,
    borderTopColor: "transparent",
    borderRightColor: "transparent",
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
});
