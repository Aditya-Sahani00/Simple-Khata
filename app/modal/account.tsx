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
import { useApp, AccountType } from "@/context/AppContext";
import { useTheme } from "@/hooks/useTheme";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";

const ACCOUNT_TYPES: { label: string; value: AccountType; icon: string; color: string }[] = [
  { label: "Cash", value: "cash", icon: "cash", color: "#1565C0" },
  { label: "Bank", value: "bank", icon: "card", color: "#00897B" },
  { label: "Wallet", value: "wallet", icon: "wallet", color: "#7B1FA2" },
];

export default function AccountModal() {
  const { colors } = useTheme();
  const { id, prefillType } = useLocalSearchParams<{ id?: string; prefillType?: string }>();
  const { accounts, addAccount, editAccount } = useApp();

  const existing = id ? accounts.find(a => a.id === id) : undefined;

  const [type, setType] = useState<AccountType>(
    existing?.type || (prefillType as AccountType) || "cash"
  );
  const [name, setName] = useState(existing?.name || "");
  const [bankName, setBankName] = useState(existing?.bankName || "");
  const [holderName, setHolderName] = useState(existing?.holderName || "");
  const [accountNumber, setAccountNumber] = useState(existing?.accountNumber || "");
  const [balance, setBalance] = useState(existing ? String(existing.balance) : "0");

  const isEditing = !!existing;
  const isBank = type === "bank" || type === "wallet";
  const selectedType = ACCOUNT_TYPES.find(t => t.value === type)!;

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert("Required", "Please enter an account name.");
      return;
    }
    const data = {
      name: name.trim(), type,
      bankName: bankName.trim() || undefined,
      holderName: holderName.trim() || undefined,
      accountNumber: accountNumber.trim() || undefined,
      balance: Number(balance) || 0,
    };
    if (isEditing) editAccount(id!, data);
    else addAccount(data);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={[styles.handle, { backgroundColor: colors.border }]} />

      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          {isEditing ? "Edit Account" : "Add Account"}
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
        {/* Account Type */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Account Type</Text>
          <View style={styles.typeRow}>
            {ACCOUNT_TYPES.map(t => (
              <TouchableOpacity
                key={t.value}
                style={[
                  styles.typeCard,
                  { backgroundColor: colors.inputBg, borderColor: colors.border },
                  type === t.value && { backgroundColor: t.color + "15", borderColor: t.color },
                ]}
                onPress={() => setType(t.value)}
              >
                <Ionicons name={t.icon as any} size={22}
                  color={type === t.value ? t.color : colors.textMuted} />
                <Text style={[styles.typeText, { color: type === t.value ? t.color : colors.textSecondary }]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Account Name */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Account Name *</Text>
          <View style={[styles.inputBox, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
            <Ionicons name={selectedType.icon as any} size={18} color={selectedType.color} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              value={name}
              onChangeText={setName}
              placeholder={
                type === "cash" ? "e.g., My Cash"
                : type === "bank" ? "e.g., Nabil Savings"
                : "e.g., eSewa"
              }
              placeholderTextColor={colors.textMuted}
              returnKeyType="next"
              autoFocus={!isEditing}
            />
          </View>
        </View>

        {/* Opening Balance */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            {isEditing ? "Current Balance" : "Opening Balance"}
          </Text>
          <View style={[styles.inputBox, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
            <Text style={[styles.currencyLabel, { color: selectedType.color }]}>NPR</Text>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              value={balance}
              onChangeText={setBalance}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              returnKeyType={isBank ? "next" : "done"}
            />
          </View>
        </View>

        {/* Bank / Wallet specific fields */}
        {isBank && (
          <>
            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                {type === "bank" ? "Bank Name" : "Wallet Provider"}
              </Text>
              <View style={[styles.inputBox, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={bankName}
                  onChangeText={setBankName}
                  placeholder={type === "bank" ? "e.g., Nabil Bank" : "e.g., eSewa, Khalti"}
                  placeholderTextColor={colors.textMuted}
                  returnKeyType="next"
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Account Holder Name</Text>
              <View style={[styles.inputBox, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={holderName}
                  onChangeText={setHolderName}
                  placeholder="e.g., Ram Bahadur Thapa"
                  placeholderTextColor={colors.textMuted}
                  returnKeyType="next"
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Account Number (optional)</Text>
              <View style={[styles.inputBox, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={accountNumber}
                  onChangeText={setAccountNumber}
                  placeholder="e.g., 1234567890"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  returnKeyType="done"
                />
              </View>
            </View>
          </>
        )}

        {/* Save button INSIDE scroll */}
        <View style={styles.saveSection}>
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: selectedType.color }]}
            onPress={handleSave}
          >
            <Ionicons name={isEditing ? "checkmark-circle" : "add-circle"} size={20} color="#fff" />
            <Text style={styles.saveBtnText}>{isEditing ? "Update" : "Add"} Account</Text>
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
  typeRow: { flexDirection: "row", gap: 10 },
  typeCard: {
    flex: 1, alignItems: "center", gap: 6, borderRadius: 12,
    paddingVertical: 14, borderWidth: 1,
  },
  typeText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  inputBox: {
    flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 13, borderWidth: 1,
  },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  currencyLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  saveSection: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 36 },
  saveBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 16, borderRadius: 14,
  },
  saveBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
