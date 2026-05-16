import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/hooks/useTheme";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function CategoryModal() {
  const insets = useSafeAreaInsets();
  const { colors, primary } = useTheme();
  const { addCategory } = useApp();
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("pricetag");
  const [color, setColor] = useState("#1565C0");
  const [type, setType] = useState<"income" | "expense">("expense");

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Category Name", "Please add a category name.");
      return;
    }

    addCategory({
      name: name.trim(),
      icon,
      color,
      type,
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, paddingBottom: insets.bottom + 12 }]}> 
      <View style={[styles.handle, { backgroundColor: colors.border }]} />

      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Add Category</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <KeyboardAwareScrollViewCompat
        style={{ flex: 1 }}
        bottomOffset={48}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Name</Text>
          <View style={[styles.inputBox, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Fuel, Shopping"
              placeholderTextColor={colors.textMuted}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Icon</Text>
          <TextInput
            style={[styles.inputBox, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
            value={icon}
            onChangeText={setIcon}
            placeholder="Ionicons name (e.g. car, restaurant)"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Color</Text>
          <TextInput
            style={[styles.inputBox, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
            value={color}
            onChangeText={setColor}
            placeholder="#FF5733"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Type</Text>
          <View style={styles.typeToggle}>
            <TouchableOpacity
              style={[styles.typeBtn, type === "income" && { backgroundColor: "#00C853" }]}
              onPress={() => setType("income")}
            >
              <Text style={[styles.typeBtnText, { color: type === "income" ? "#fff" : colors.textMuted }]}>Income</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeBtn, type === "expense" && { backgroundColor: "#F44336" }]}
              onPress={() => setType("expense")}
            >
              <Text style={[styles.typeBtnText, { color: type === "expense" ? "#fff" : colors.textMuted }]}>Expense</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.saveSection}>
          <TouchableOpacity style={[styles.saveBtn, { backgroundColor: primary || "#1565C0" }]} onPress={handleSave}>
            <Ionicons name="add-circle" size={20} color="#fff" />
            <Text style={styles.saveBtnText}>Save Category</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginTop: 8, marginBottom: 4 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
  title: { fontSize: 18, fontFamily: "Inter_700Bold" },
  section: { paddingHorizontal: 16, marginBottom: 12 },
  label: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 6 },
  inputBox: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 10 },
  input: { fontSize: 15, fontFamily: "Inter_400Regular" },
  typeToggle: { flexDirection: "row", borderRadius: 12, overflow: "hidden" },
  typeBtn: { flex: 1, alignItems: "center", paddingVertical: 12 },
  typeBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  saveSection: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 28 },
  saveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, borderRadius: 14 },
  saveBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
