import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { Redirect } from "expo-router";
import LoadingScreen from "./loading";
import { useApp } from "@/context/AppContext";
import { loadData, STORAGE_KEYS } from "@/utils/storage";

export default function Index() {
  const { isLoaded, settings } = useApp();
  const [showLoading, setShowLoading] = useState(true);
  const [hasLoggedIn, setHasLoggedIn] = useState(false);
  const [checkedLogin, setCheckedLogin] = useState(false);

  useEffect(() => {
    if (isLoaded) {
      checkLoginStatus();
    }
  }, [isLoaded]);

  const checkLoginStatus = async () => {
    try {
      const loggedIn = await loadData<boolean>(STORAGE_KEYS.HAS_LOGGED_IN, false);
      setHasLoggedIn(loggedIn);
    } catch (e) {
      console.error("Error checking login status:", e);
      setHasLoggedIn(false);
    } finally {
      setCheckedLogin(true);

      // Show loading for at least 1.5 seconds for nice animation effect
      setTimeout(() => {
        setShowLoading(false);
      }, 1500);
    }
  };

  // Show loading screen while app initializes
  if (showLoading || !checkedLogin || !isLoaded) {
    return <LoadingScreen />;
  }

  // If user has logged in before and app lock is enabled, go to PIN
  if (hasLoggedIn && settings.appLockEnabled) {
    return <Redirect href="/modal/pin?mode=enter" />;
  }

  // If user has logged in before, go directly to tabs
  if (hasLoggedIn) {
    return <Redirect href="/(tabs)" />;
  }

  // First time user - go to login page
  return <Redirect href="/login" />;
}
