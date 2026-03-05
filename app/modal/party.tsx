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
import { useApp, PartyType } from "@/context/AppContext";
import { useTheme } from "@/hooks/useTheme";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";

export default function PartyModal() {
  const { colors, primary } = useTheme();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { parties, addParty, editParty } = useApp();

  const existing = id ? parties.find(p => p.id === id) : undefined;

  const [name, setName] = useState(existing?.name || "");
  const [phone, setPhone] = useState(existing?.phone || "");
  const [type, setType] = useState<PartyType>(existing?.type || "person");

  const isEditing = !!existing;

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert("Required", "Please enter a name.");
      return;
    }
    const data = { name: name.trim(), phone: phone.trim() || undefined, type };
    if (isEditing) editParty(id!, data);
    else addParty(data);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={[styles.handle, { backgroundColor: colors.border }]} />

      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          {isEditing ? "Edit Party" : "Add Party"}
        </Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <KeyboardAwareScrollViewCompat
        style={{ flex: 1 }}
        bottomOffset={32}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Type toggle */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Type</Text>
          <View style={[styles.toggleRow, { backgroundColor: colors.inputBg }]}>
            {([
              { label: "Person", value: "person", icon: "person" },
              { label: "Business", value: "business", icon: "business" },
            ] as const).map(t => (
              <TouchableOpacity
                key={t.value}
                style={[styles.toggleBtn, type === t.value && { backgroundColor: primary }]}
                onPress={() => setType(t.value)}
              >
                <Ionicons name={t.icon} size={16}
                  color={type === t.value ? "#fff" : colors.textMuted} />
                <Text style={[styles.toggleText, { color: type === t.value ? "#fff" : colors.textSecondary }]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Name */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Name *</Text>
          <View style={[styles.inputBox, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
            <Ionicons name="person-outline" size={18} color={colors.textMuted} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              value={name}
              onChangeText={setName}
              placeholder="e.g., Ram Bahadur"
              placeholderTextColor={colors.textMuted}
              returnKeyType="next"
              autoFocus={!isEditing}
            />
          </View>
        </View>

        {/* Phone */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Phone (optional)</Text>
          <View style={[styles.inputBox, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
            <Ionicons name="call-outline" size={18} color={colors.textMuted} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              value={phone}
              onChangeText={setPhone}
              placeholder="98XXXXXXXX"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
              returnKeyType="done"
            />
          </View>
        </View>

        {/* Save button INSIDE scroll */}
        <View style={styles.saveSection}>
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: primary }]}
            onPress={handleSave}
          >
            <Ionicons name={isEditing ? "checkmark-circle" : "person-add"} size={20} color="#fff" />
            <Text style={styles.saveBtnText}>{isEditing ? "Update" : "Add"} Party</Text>
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
    paddingHorizontal: 20, paddingVertical: 12,
  },
  title: { fontSize: 18, fontFamily: "Inter_700Bold" },
  section: { paddingHorizontal: 20, marginBottom: 16 },
  label: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 8 },
  toggleRow: { flexDirection: "row", borderRadius: 10, padding: 4 },
  toggleBtn: {
    flex: 1, flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 8,
  },
  toggleText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  inputBox: {
    flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 13, borderWidth: 1,
  },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  saveSection: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 36 },
  saveBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 16, borderRadius: 14,
  },
  saveBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
