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
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
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
    if (isEditing) {
      editProfile(id!, data);
    } else {
      addProfile(data);
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
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
        bottomOffset={20}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Type */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Profile Type</Text>
          <View style={styles.typeGrid}>
            {PROFILE_TYPES.map(t => (
              <TouchableOpacity
                key={t.value}
                style={[
                  styles.typeCard,
                  { backgroundColor: colors.inputBg, borderColor: colors.border },
                  type === t.value && {
                    backgroundColor: t.color + "15",
                    borderColor: t.color,
                  },
                ]}
                onPress={() => setType(t.value)}
              >
                <Ionicons
                  name={t.icon as any}
                  size={26}
                  color={type === t.value ? t.color : colors.textMuted}
                />
                <Text
                  style={[
                    styles.typeLabel,
                    { color: type === t.value ? t.color : colors.textSecondary },
                  ]}
                >
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Name */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Profile Name *</Text>
          <View
            style={[styles.inputBox, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
          >
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

        <View style={{ height: 24 }} />
      </KeyboardAwareScrollViewCompat>

      <View
        style={[
          styles.footer,
          {
            borderTopColor: colors.border,
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: selectedType.color }]}
          onPress={handleSave}
        >
          <Text style={styles.saveBtnText}>{isEditing ? "Update" : "Create"} Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  title: { fontSize: 18, fontFamily: "Inter_700Bold" },
  section: { paddingHorizontal: 20, marginBottom: 20 },
  label: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 10 },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  typeCard: {
    width: "47%",
    alignItems: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 18,
    borderWidth: 1,
  },
  typeLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderWidth: 1,
  },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  footer: { padding: 20, paddingTop: 12, borderTopWidth: 1 },
  saveBtn: { paddingVertical: 16, borderRadius: 14, alignItems: "center" },
  saveBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
