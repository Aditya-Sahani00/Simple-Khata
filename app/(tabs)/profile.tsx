import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useApp, ThemeMode, DateFormat, AmountFormat, CurrencyOption, Profile } from "@/context/AppContext";
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

function SettingRow({ icon, label, value, onPress, iconColor }: {
  icon: string;
  label: string;
  value?: string;
  onPress: () => void;
  iconColor?: string;
}) {
  const { colors, primary } = useTheme();
  return (
    <TouchableOpacity style={[styles.settingRow, { borderBottomColor: colors.divider }]} onPress={onPress}>
      <View style={[styles.settingIcon, { backgroundColor: (iconColor || primary) + "15" }]}>
        <Ionicons name={icon as any} size={18} color={iconColor || primary} />
      </View>
      <Text style={[styles.settingLabel, { color: colors.text }]}>{label}</Text>
      <View style={styles.settingRight}>
        {value && (
          <Text style={[styles.settingValue, { color: colors.textSecondary }]}>{value}</Text>
        )}
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

function ToggleGroup({ label, options, value, onChange }: {
  label: string;
  options: { label: string; value: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  const { colors, primary } = useTheme();
  return (
    <View style={styles.toggleSection}>
      <Text style={[styles.toggleLabel, { color: colors.textSecondary }]}>{label}</Text>
      <View style={[styles.toggleRow, { backgroundColor: colors.inputBg }]}>
        {options.map(opt => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.toggleBtn, value === opt.value && { backgroundColor: primary }]}
            onPress={() => onChange(opt.value)}
          >
            <Text style={[styles.toggleText, { color: value === opt.value ? "#fff" : colors.textSecondary }]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { colors, primary } = useTheme();
  const {
    profiles,
    activeProfileId,
    setActiveProfile,
    deleteProfile,
    settings,
    updateSettings,
    accounts,
    transactions,
    parties,
    deletedTransactions,
    deletedPartyEntries,
  } = useApp();

  const topPad = Platform.OS === "web" ? 16 : insets.top;
  const currency = settings.currency || "NPR";

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
        <Text style={[styles.title, { color: colors.text }]}>Profile</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Platform.OS === "ios" ? 100 : 80 }}
      >
        {/* Stats */}
        <View style={[styles.statsRow, { paddingTop: 16 }]}>
          <View style={[styles.statBox, { backgroundColor: colors.card }]}>
            <Text style={[styles.statValue, { color: primary }]}>{accounts.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Accounts</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: colors.card }]}>
            <Text style={[styles.statValue, { color: primary }]}>{transactions.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Transactions</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: colors.card }]}>
            <Text style={[styles.statValue, { color: primary }]}>{parties.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Parties</Text>
          </View>
        </View>

        {/* Profiles */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Profiles</Text>
            <TouchableOpacity
              style={[styles.addSmallBtn, { backgroundColor: primary }]}
              onPress={() => router.push("/modal/profile")}
            >
              <Ionicons name="add" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
          {profiles.map(p => (
            <ProfileCard
              key={p.id}
              profile={p}
              isActive={p.id === activeProfileId}
              onPress={() => {
                setActiveProfile(p.id);
                Haptics.selectionAsync();
              }}
              onDelete={() => handleDeleteProfile(p.id)}
            />
          ))}
        </View>

        {/* Settings */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Settings</Text>

          <ToggleGroup
            label="Theme"
            options={[
              { label: "Light", value: "light" },
              { label: "Dark", value: "dark" },
              { label: "System", value: "system" },
            ]}
            value={settings.theme}
            onChange={v => updateSettings({ theme: v as ThemeMode })}
          />

          <ToggleGroup
            label="Date Format"
            options={[
              { label: "BS (Nepali)", value: "BS" },
              { label: "AD (English)", value: "AD" },
            ]}
            value={settings.dateFormat}
            onChange={v => updateSettings({ dateFormat: v as DateFormat })}
          />

          <ToggleGroup
            label="Currency"
            options={[
              { label: "NPR", value: "NPR" },
              { label: "Rs.", value: "Rs." },
              { label: "INR", value: "INR" },
              { label: "$", value: "$" },
            ]}
            value={settings.currency as CurrencyOption}
            onChange={v => updateSettings({ currency: v as CurrencyOption })}
          />

          <ToggleGroup
            label="Amount Display"
            options={[
              { label: "Full (10,000)", value: "full" },
              { label: "Compact (10K)", value: "compact" },
            ]}
            value={settings.amountFormat || "full"}
            onChange={v => updateSettings({ amountFormat: v as AmountFormat })}
          />

          <SettingRow
            icon="trash-bin-outline"
            label="Recycle Bin"
            value={`${deletedTransactions.length + deletedPartyEntries.length} items`}
            onPress={() => router.push("recycle-bin" as any)}
            iconColor="#F44336"
          />
        </View>

        {/* Security */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Security</Text>
          
          <SettingRow
            icon="lock-closed-outline"
            label="App Lock"
            value={settings.appLockEnabled ? "On" : "Off"}
            onPress={() => {
              if (!settings.appLockEnabled) {
                // First time enabling - require PIN setup
                router.push("/modal/pin?mode=set");
              } else {
                // Already enabled - offer to disable or change PIN
                Alert.alert(
                  "App Lock",
                  "What would you like to do?",
                  [
                    {
                      text: "Change PIN",
                      onPress: () => router.push("/modal/pin?mode=change"),
                    },
                    {
                      text: "Disable Lock",
                      style: "destructive",
                      onPress: () => {
                        Alert.alert(
                          "Disable App Lock",
                          "Are you sure you want to disable app lock?",
                          [
                            { text: "Cancel", style: "cancel" },
                            {
                              text: "Disable",
                              style: "destructive",
                              onPress: () => updateSettings({ appLockEnabled: false }),
                            },
                          ]
                        );
                      },
                    },
                    { text: "Cancel", style: "cancel" },
                  ]
                );
              }
            }}
          />

          <SettingRow
            icon="key-outline"
            label="Set/Change PIN"
            onPress={() => router.push("/modal/pin?mode=change")}
          />
        </View>

        {/* Data */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Data</Text>
          <SettingRow
            icon="wallet-outline"
            label="Manage Accounts"
            onPress={() => router.push("/accounts")}
          />
        </View>

        {/* About */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
          
          <View style={styles.aboutContent}>
            <View style={[styles.appIconBox, { backgroundColor: primary }]}>
              <Ionicons name="book" size={28} color="#fff" />
            </View>
            <View>
              <Text style={[styles.appName, { color: colors.text }]}>Simple Khata</Text>
              <Text style={[styles.appVersion, { color: colors.textMuted }]}>Version 1.0.0</Text>
              <Text style={[styles.appTagline, { color: colors.textSecondary }]}>
                Offline Financial Ledger
              </Text>
            </View>
          </View>

          <View style={[styles.madeBy, { borderTopColor: colors.divider }]}>
            <Text style={[styles.madeByText, { color: colors.textMuted }]}>
              Made by <Text style={{ color: primary }}>ABG Groups</Text>
            </Text>
          </View>

          <TouchableOpacity 
            style={[styles.linkRow, { borderTopColor: colors.divider }]}
            onPress={() => Linking.openURL("https://stutyhub.web.app/")}
          >
            <View style={styles.linkContent}>
              <Ionicons name="school-outline" size={20} color={primary} />
              <Text style={[styles.linkText, { color: colors.text }]}>StudyHub</Text>
            </View>
            <Ionicons name="open-outline" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.linkRow, { borderTopColor: colors.divider }]}
            onPress={() => router.push("/modal/info?type=apps&title=Other+Apps")}
          >
            <View style={styles.linkContent}>
              <Ionicons name="apps-outline" size={20} color={primary} />
              <Text style={[styles.linkText, { color: colors.text }]}>Other Apps</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.linkRow, { borderTopColor: colors.divider }]}
            onPress={() => router.push("/modal/info?type=company&title=About+Company")}
          >
            <View style={styles.linkContent}>
              <Ionicons name="business-outline" size={20} color={primary} />
              <Text style={[styles.linkText, { color: colors.text }]}>About Company</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.linkRow, { borderTopColor: colors.divider }]}
            onPress={() => router.push("/modal/info?type=howto&title=How+to+Use")}
          >
            <View style={styles.linkContent}>
              <Ionicons name="help-circle-outline" size={20} color={primary} />
              <Text style={[styles.linkText, { color: colors.text }]}>How to Use</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    gap: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
  },
  statLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  sectionCard: {
    margin: 16,
    marginBottom: 0,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  addSmallBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
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
  profileInfo: { flex: 1 },
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
  toggleSection: {
    gap: 8,
  },
  toggleLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  toggleRow: {
    flexDirection: "row",
    borderRadius: 10,
    padding: 3,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  toggleText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  settingLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  settingRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  settingValue: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  aboutContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  appIconBox: {
    width: 60,
    height: 60,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  appName: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  appVersion: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  appTagline: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  madeBy: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  madeByText: {
    fontSize: 13,
    textAlign: "center",
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  linkContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  linkText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
});
