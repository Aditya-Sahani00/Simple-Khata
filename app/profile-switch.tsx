import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useApp, Profile } from "@/context/AppContext";
import { useTheme } from "@/hooks/useTheme";
import { LinearGradient } from "expo-linear-gradient";

const PROFILE_ICONS: Record<string, string> = {
  personal: "person",
  business: "business",
  shop: "storefront",
  other: "bookmark",
};

const PROFILE_COLORS: Record<string, string[]> = {
  personal: ["#1565C0", "#0D47A1"],
  business: ["#00897B", "#00695C"],
  shop: ["#7B1FA2", "#6A1B9A"],
  other: ["#E64A19", "#BF360C"],
};

function ProfileCard({ profile, isActive, onPress, onDelete }: {
  profile: Profile;
  isActive: boolean;
  onPress: () => void;
  onDelete: () => void;
}) {
  const { colors } = useTheme();
  const gradColors = (PROFILE_COLORS[profile.type] || ["#1565C0", "#0D47A1"]) as [string, string];

  return (
    <TouchableOpacity
      style={[
        styles.profileCard,
        { borderColor: isActive ? gradColors[0] : colors.border },
        isActive && { borderWidth: 2 },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <LinearGradient colors={gradColors} style={styles.profileIcon}>
        <Ionicons name={PROFILE_ICONS[profile.type] as any} size={20} color="#fff" />
      </LinearGradient>
      <View style={styles.profileInfo}>
        <Text style={[styles.profileName, { color: colors.text }]}>{profile.name}</Text>
        <Text style={[styles.profileType, { color: colors.textMuted }]}>
          {profile.type.charAt(0).toUpperCase() + profile.type.slice(1)}
        </Text>
      </View>
      {isActive && (
        <View style={[styles.activeChip, { backgroundColor: gradColors[0] + "20" }]}>
          <Text style={[styles.activeText, { color: gradColors[0] }]}>Active</Text>
        </View>
      )}
      {!isActive && (
        <TouchableOpacity onPress={onDelete} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={16} color="#F44336" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

export default function ProfileSwitchScreen() {
  const insets = useSafeAreaInsets();
  const { colors, primary } = useTheme();
  const { colors: systemColors } = useTheme();
  const {
    profiles,
    activeProfileId,
    setActiveProfile,
    deleteProfile,
  } = useApp();

  const topPad = Platform.OS === "web" ? 16 : insets.top;

  const isGuestMode = profiles.length === 0 || profiles.length === 1;

  const handleDeleteProfile = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Delete Profile", "All data for this profile will be deleted.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteProfile(id) },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8, backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Switch Profile</Text>
        <TouchableOpacity 
          onPress={() => router.push("/modal/profile")} 
          style={styles.addBtn}
        >
          <Ionicons name="add" size={24} color={primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
      >
        {/* Guest Mode Banner */}
        <View style={[styles.guestBanner, { backgroundColor: "#FF9800" + "20" }]}>
          <Ionicons name="information-circle" size={20} color="#FF9800" />
          <Text style={[styles.guestBannerText, { color: colors.text }]}>
            You&apos;re in Guest Mode - Data is stored locally on this device
          </Text>
        </View>

        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Select a profile to switch to, or create a new one
        </Text>

        {/* Profiles */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
          {profiles.map(p => (
            <ProfileCard
              key={p.id}
              profile={p}
              isActive={p.id === activeProfileId}
              onPress={() => {
                setActiveProfile(p.id);
                Haptics.selectionAsync();
                router.back();
              }}
              onDelete={() => handleDeleteProfile(p.id)}
            />
          ))}
          
          {profiles.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="person-add-outline" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                No profiles yet. Create one to get started.
              </Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <TouchableOpacity 
          style={[styles.actionBtn, { backgroundColor: primary }]}
          onPress={() => router.push("/modal/profile")}
        >
          <Ionicons name="add-circle" size={20} color="#fff" />
          <Text style={styles.actionBtnText}>Create New Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionBtn, styles.secondaryBtn, { borderColor: primary }]}
          onPress={() => router.push("/(tabs)/profile")}
        >
          <Ionicons name="settings-outline" size={20} color={primary} />
          <Text style={[styles.actionBtnText, { color: primary }]}>Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionBtn, styles.googleBtn]}
          onPress={() => {
            Alert.alert(
              "Google Login Coming Soon",
              "Google Drive backup feature will be available in a future update. Your data is safely stored locally on this device."
            );
          }}
        >
          <Ionicons name="logo-google" size={20} color="#fff" />
          <Text style={styles.actionBtnText}>Login with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionBtn, styles.logoutBtn, { borderColor: '#F44336' }]}
          onPress={() => {
            Alert.alert(
              "Switch Account",
              "Do you want to switch to a different account?",
              [
                { text: "Cancel", style: "cancel" },
                { 
                  text: "Switch", 
                  onPress: () => router.replace("/login") 
                },
              ]
            );
          }}
        >
          <Ionicons name="log-out-outline" size={20} color="#F44336" />
          <Text style={[styles.actionBtnText, { color: "#F44336" }]}>Switch Account</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 4,
  },
  addBtn: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: "center",
  },
  sectionCard: {
    borderRadius: 16,
    padding: 12,
    gap: 8,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "transparent",
  },
  profileIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  profileType: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  activeChip: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  activeText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F44336" + "10",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
  },
  actionBtnText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  secondaryBtn: {
    backgroundColor: "transparent",
    borderWidth: 1,
  },
  googleBtn: {
    backgroundColor: "#4285F4",
  },
  logoutBtn: {
    backgroundColor: "transparent",
    borderWidth: 1,
  },
  guestBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  guestBannerText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
});
