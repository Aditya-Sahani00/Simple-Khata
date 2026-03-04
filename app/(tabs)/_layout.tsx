import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { NativeTabs, Icon, Label } from "expo-router/unstable-native-tabs";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet, View, useColorScheme } from "react-native";
import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { AppColors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "house", selected: "house.fill" }} />
        <Label>Home</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="transactions">
        <Icon sf={{ default: "list.bullet.rectangle", selected: "list.bullet.rectangle.fill" }} />
        <Label>Transactions</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="parties">
        <Icon sf={{ default: "person.2", selected: "person.2.fill" }} />
        <Label>Parties</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="accounts">
        <Icon sf={{ default: "creditcard", selected: "creditcard.fill" }} />
        <Label>Accounts</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Icon sf={{ default: "gearshape", selected: "gearshape.fill" }} />
        <Label>More</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const systemScheme = useColorScheme();
  const { settings } = useApp();
  const isDark =
    settings.theme === "dark" ||
    (settings.theme === "system" && systemScheme === "dark");
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const TEAL = "#00C853";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: TEAL,
        tabBarInactiveTintColor: isDark ? "#546E7A" : "#90A4AE",
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS
            ? "transparent"
            : isDark
            ? "#0D0D0D"
            : "#FFFFFF",
          borderTopWidth: isWeb ? 1 : 0.5,
          borderTopColor: isDark ? "#2A2A2A" : "#E0E7EF",
          elevation: 0,
          height: isWeb ? 84 : 60,
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={100}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : isWeb ? (
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: isDark ? "#0D0D0D" : "#FFFFFF" },
              ]}
            />
          ) : null,
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: "Inter_500Medium",
          marginBottom: Platform.OS === "ios" ? 0 : 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: "Transactions",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="swap-vertical" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="parties"
        options={{
          title: "Parties",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="accounts"
        options={{
          title: "Accounts",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "More",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
