import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/hooks/useTheme";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";

import { todayString, formatDate } from "@/utils/nepali-date";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TransactionModal() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { id, type: paramType } = useLocalSearchParams<{ id?: string; type?: string }>();
  const { transactions, accounts, categories, addTransaction, editTransaction, settings } = useApp();
  const currency = settings.currency || "NPR";
  const useBS = settings.dateFormat === "BS";

  const existing = id ? transactions.find(t => t.id === id) : undefined;

  const [txType, setTxType] = useState<"income" | "expense">(
    existing?.type || (paramType as "income" | "expense") || "expense"
  );
  const [amount, setAmount] = useState(existing ? String(existing.amount) : "");
  const [categoryId, setCategoryId] = useState(existing?.categoryId || "");
  const [accountId, setAccountId] = useState(
    existing?.accountId || accounts.find(a => a.isDefault)?.id || accounts[0]?.id || ""
  );
  const [description, setDescription] = useState(existing?.description || "");
  const [date, setDate] = useState(existing?.date || todayString());

  const categoriesByType = categories.filter(c => c.type === txType || c.type === "both");
  const isEditing = !!existing;

  useEffect(() => {
    if (!existing) setCategoryId("");
  }, [txType]);

  const handleSave = () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount greater than 0.");
      return;
    }
    if (!categoryId) {
      Alert.alert("Select Category", "Please select a category.");
      return;
    }
    if (!accountId) {
      Alert.alert("Select Account", "Please select an account.");
      return;
    }
    const data = {
      type: txType, amount: Number(amount), categoryId,
      accountId, description: description.trim(), date,
    };
    if (isEditing) editTransaction(id!, data);
    else addTransaction(data);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  const incomeColor = "#00C853";
  const expenseColor = "#F44336";
  const activeColor = txType === "income" ? incomeColor : expenseColor;

  const topInset = Platform.OS === "ios" ? 0 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, paddingTop: topInset, paddingBottom: insets.bottom + 8 }]}>
      <View style={[styles.handle, { backgroundColor: colors.border }]} />

      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          {isEditing ? "Edit Transaction" : "Add Transaction"}
        </Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Type toggle — outside scroll, always visible */}
      <View style={[styles.typeToggle, { backgroundColor: colors.inputBg }]}>
        <TouchableOpacity
          style={[styles.typeBtn, txType === "income" && { backgroundColor: incomeColor }]}
          onPress={() => setTxType("income")}
        >
          <Ionicons name="arrow-down-circle" size={16}
            color={txType === "income" ? "#fff" : colors.textMuted} />
          <Text style={[styles.typeBtnText, { color: txType === "income" ? "#fff" : colors.textMuted }]}>
            Income
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.typeBtn, txType === "expense" && { backgroundColor: expenseColor }]}
          onPress={() => setTxType("expense")}
        >
          <Ionicons name="arrow-up-circle" size={16}
            color={txType === "expense" ? "#fff" : colors.textMuted} />
          <Text style={[styles.typeBtnText, { color: txType === "expense" ? "#fff" : colors.textMuted }]}>
            Expense
          </Text>
        </TouchableOpacity>
      </View>

      {/* ALL form content + Save button inside scroll so keyboard never hides anything */}
      <KeyboardAwareScrollViewCompat
        style={{ flex: 1 }}
        bottomOffset={48}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Amount */}
        <View style={styles.amountBox}>
          <Text style={[styles.currencySymbol, { color: activeColor }]}>{currency}</Text>
          <TextInput
            style={[styles.amountInput, { color: activeColor }]}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={activeColor + "40"}
            returnKeyType="done"
            autoFocus={!isEditing}
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Description</Text>
          <View style={[styles.inputBox, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Add a note... (optional)"
              placeholderTextColor={colors.textMuted}
              returnKeyType="next"
            />
          </View>
        </View>

        {/* Date */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Date</Text>
          <View style={[styles.inputBox, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
            <Ionicons name="calendar-outline" size={18} color={colors.textMuted} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.input, { color: colors.text, paddingVertical: 2 }]}>
                {formatDate(date, useBS)}
              </Text>
              <TextInput
                style={[styles.input, { color: colors.textMuted, fontSize: 11, paddingVertical: 0 }]}
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD (AD)"
                placeholderTextColor={colors.textMuted}
                returnKeyType="done"
              />
            </View>
          </View>
        </View>

        {/* Account */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Account</Text>
          <View style={styles.chipRow}>
            {accounts.map(a => (
              <TouchableOpacity
                key={a.id}
                style={[
                  styles.chip,
                  { borderColor: colors.border, backgroundColor: colors.inputBg },
                  accountId === a.id && { backgroundColor: "#1565C0" + "20", borderColor: "#1565C0" },
                ]}
                onPress={() => setAccountId(a.id)}
              >
                <Ionicons
                  name={a.type === "cash" ? "cash" : a.type === "bank" ? "card" : "wallet"}
                  size={14}
                  color={accountId === a.id ? "#1565C0" : colors.textMuted}
                />
                <Text style={[styles.chipText, { color: accountId === a.id ? "#1565C0" : colors.text }]}>
                  {a.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Category */}
        <View style={styles.section}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Category</Text>
            <TouchableOpacity onPress={() => router.push("/modal/category")}> 
              <Text style={[styles.sectionLabel, { color: "#007AFF" }]}>+ Add Category</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.categoryGrid}>
            {categoriesByType.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryChip,
                  { backgroundColor: colors.inputBg, borderColor: colors.border },
                  categoryId === cat.id && { backgroundColor: cat.color + "20", borderColor: cat.color },
                ]}
                onPress={() => setCategoryId(cat.id)}
              >
                <Ionicons name={cat.icon as any} size={15}
                  color={categoryId === cat.id ? cat.color : colors.textMuted} />
                <Text style={[styles.categoryText, {
                  color: categoryId === cat.id ? cat.color : colors.textSecondary,
                }]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Save button — INSIDE scroll, scrolls up when keyboard opens */}
        <View style={styles.saveSection}>
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: activeColor }]}
            onPress={handleSave}
          >
            <Ionicons name={isEditing ? "checkmark-circle" : "add-circle"} size={20} color="#fff" />
            <Text style={styles.saveBtnText}>{isEditing ? "Update" : "Add"} Transaction</Text>
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
  typeToggle: {
    flexDirection: "row", marginHorizontal: 16, borderRadius: 12,
    padding: 4, marginBottom: 4,
  },
  typeBtn: {
    flex: 1, flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 6, paddingVertical: 12, borderRadius: 9,
  },
  typeBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  amountBox: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 14, gap: 4,
  },
  currencySymbol: { fontSize: 22, fontFamily: "Inter_600SemiBold" },
  amountInput: { fontSize: 44, fontFamily: "Inter_700Bold", minWidth: 100, textAlign: "center" },
  section: { paddingHorizontal: 16, marginBottom: 12 },
  sectionLabel: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 6 },
  inputBox: {
    flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1,
  },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1,
  },
  chipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  categoryChip: {
    flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1,
  },
  categoryText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  saveSection: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 28 },
  saveBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 18, borderRadius: 14,
  },
  saveBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
