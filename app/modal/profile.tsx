import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/hooks/useTheme";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PROFILE_TYPES = [
  { label: "Personal", value: "personal", icon: "person", color: "#1565C0" },
  { label: "Business", value: "business", icon: "business", color: "#00897B" },
  { label: "Shop", value: "shop", icon: "storefront", color: "#7B1FA2" },
  { label: "Other", value: "other", icon: "bookmark", color: "#E64A19" },
] as const;

export default function ProfileModal() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { profiles, addProfile, editProfile } = useApp();

  const existing = id ? profiles.find(p => p.id === id) : undefined;

  const [name, setName] = useState(existing?.name || "");
  const [type, setType] = useState<"personal" | "business" | "shop" | "other">(
    existing?.type || "personal"
  );

  const isEditing = !!existing;
  const selectedType = PROFILE_TYPES.find(t => t.value === type)!;

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert("Required", "Please enter a profile name.");
      return;
    }
    const data = { name: name.trim(), type, icon: selectedType.icon };
    if (isEditing) editProfile(id!, data);
    else addProfile(data);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, paddingBottom: insets.bottom + 8 }]}>
      <View style={[styles.handle, { backgroundColor: colors.border }]} />

      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          {isEditing ? "Edit Profile" : "New Profile"}
        </Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <KeyboardAwareScrollViewCompat
        style={{ flex: 1 }}
        bottomOffset={48}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Profile Type grid */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Profile Type</Text>
          <View style={styles.typeGrid}>
            {PROFILE_TYPES.map(t => (
              <TouchableOpacity
                key={t.value}
                style={[
                  styles.typeCard,
                  { backgroundColor: colors.inputBg, borderColor: colors.border },
                  type === t.value && { backgroundColor: t.color + "15", borderColor: t.color },
                ]}
                onPress={() => setType(t.value)}
              >
                <Ionicons name={t.icon as any} size={26}
                  color={type === t.value ? t.color : colors.textMuted} />
                <Text style={[styles.typeLabel, { color: type === t.value ? t.color : colors.textSecondary }]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Name */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Profile Name *</Text>
          <View style={[styles.inputBox, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
            <Ionicons name={selectedType.icon as any} size={18} color={selectedType.color} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              value={name}
              onChangeText={setName}
              placeholder="e.g., My Business, Personal"
              placeholderTextColor={colors.textMuted}
              returnKeyType="done"
              autoFocus={!isEditing}
            />
          </View>
        </View>

        {/* Save button INSIDE scroll */}
        <View style={styles.saveSection}>
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: selectedType.color }]}
            onPress={handleSave}
          >
            <Ionicons name={isEditing ? "checkmark-circle" : "person-add"} size={20} color="#fff" />
            <Text style={styles.saveBtnText}>{isEditing ? "Update" : "Create"} Profile</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginTop: 8, marginBottom: 4 },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 12,
  },
  title: { fontSize: 18, fontFamily: "Inter_700Bold" },
  section: { paddingHorizontal: 16, marginBottom: 16 },
  label: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 8 },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  typeCard: {
    width: "47%", alignItems: "center", gap: 8,
    borderRadius: 14, paddingVertical: 16, borderWidth: 1,
  },
  typeLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  inputBox: {
    flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1,
  },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  saveSection: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 28 },
  saveBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 18, borderRadius: 14,
  },
  saveBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
