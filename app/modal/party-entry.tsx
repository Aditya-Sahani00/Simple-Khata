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
import { todayString, formatDate } from "@/utils/nepali-date";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function PartyEntryModal() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { partyId, entryType: paramEntryType, id } = useLocalSearchParams<{
    partyId?: string; entryType?: string; id?: string;
  }>();
  const { parties, accounts, partyEntries, addPartyEntry, editPartyEntry, settings } = useApp();
  const useBS = settings.dateFormat === "BS";

  const existing = id ? partyEntries.find(e => e.id === id) : undefined;

  const [entryType, setEntryType] = useState<"to_give" | "to_receive">(
    existing?.entryType || (paramEntryType as "to_give" | "to_receive") || "to_receive"
  );
  const [selectedPartyId, setSelectedPartyId] = useState(existing?.partyId || partyId || "");
  const [accountId, setAccountId] = useState(
    existing?.accountId || accounts.find(a => a.isDefault)?.id || accounts[0]?.id || ""
  );
  const [amount, setAmount] = useState(existing ? String(existing.amount) : "");
  const [description, setDescription] = useState(existing?.description || "");
  const [date, setDate] = useState(existing?.date || todayString());

  const isEditing = !!existing;
  const isGive = entryType === "to_give";
  const color = isGive ? "#FF6F00" : "#1565C0";

  const handleSave = () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount.");
      return;
    }
    if (!selectedPartyId) {
      Alert.alert("Select Party", "Please select a party.");
      return;
    }
    if (!accountId) {
      Alert.alert("Select Account", "Please select an account.");
      return;
    }
    const data = {
      partyId: selectedPartyId, accountId, entryType,
      amount: Number(amount), description: description.trim(), date, settled: false,
    };
    if (isEditing) editPartyEntry(id!, data);
    else addPartyEntry(data);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, paddingBottom: insets.bottom + 8 }]}>
      <View style={[styles.handle, { backgroundColor: colors.border }]} />

      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          {isEditing ? "Edit Entry" : "Add Entry"}
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
        {/* Entry Type toggle */}
        <View style={styles.section}>
          <View style={[styles.typeToggle, { backgroundColor: colors.inputBg }]}>
            <TouchableOpacity
              style={[styles.typeBtn, entryType === "to_receive" && { backgroundColor: "#1565C0" }]}
              onPress={() => setEntryType("to_receive")}
            >
              <Ionicons name="arrow-back" size={16}
                color={entryType === "to_receive" ? "#fff" : colors.textMuted} />
              <Text style={[styles.typeBtnText, { color: entryType === "to_receive" ? "#fff" : colors.textMuted }]}>
                To Receive
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeBtn, entryType === "to_give" && { backgroundColor: "#FF6F00" }]}
              onPress={() => setEntryType("to_give")}
            >
              <Ionicons name="arrow-forward" size={16}
                color={entryType === "to_give" ? "#fff" : colors.textMuted} />
              <Text style={[styles.typeBtnText, { color: entryType === "to_give" ? "#fff" : colors.textMuted }]}>
                To Give
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Amount */}
        <View style={styles.amountBox}>
          <Text style={[styles.currencySymbol, { color }]}>NPR</Text>
          <TextInput
            style={[styles.amountInput, { color }]}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={color + "40"}
            returnKeyType="done"
            autoFocus={!isEditing}
          />
        </View>

        {/* Party — only if not pre-selected */}
        {!partyId && (
          <View style={styles.section}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Party</Text>
              <TouchableOpacity onPress={() => router.push("/modal/party")}>  
                <Text style={{ color: "#007AFF", fontSize: 13, fontFamily: "Inter_500Medium" }}>+ Add Party</Text>
              </TouchableOpacity>
            </View>
            {parties.length === 0 ? (
              <View style={[styles.emptyNote, { backgroundColor: colors.inputBg }]}> 
                <Text style={[styles.emptyNoteText, { color: colors.textMuted }]}> 
                  No parties yet. Tap Add Party to create one.
                </Text>
              </View>
            ) : (
              <View style={styles.chipRow}>
                {parties.map(p => (
                  <TouchableOpacity
                    key={p.id}
                    style={[
                      styles.chip,
                      { borderColor: colors.border, backgroundColor: colors.inputBg },
                      selectedPartyId === p.id && { backgroundColor: color + "20", borderColor: color },
                    ]}
                    onPress={() => setSelectedPartyId(p.id)}
                  >
                    <Text style={[styles.chipText, { color: selectedPartyId === p.id ? color : colors.text }]}>
                      {p.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Account */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Account</Text>
          <View style={styles.chipRow}>
            {accounts.map(a => (
              <TouchableOpacity
                key={a.id}
                style={[
                  styles.chip,
                  { borderColor: colors.border, backgroundColor: colors.inputBg },
                  accountId === a.id && { backgroundColor: color + "20", borderColor: color },
                ]}
                onPress={() => setAccountId(a.id)}
              >
                <Ionicons
                  name={a.type === "cash" ? "cash" : a.type === "bank" ? "card" : "wallet"}
                  size={14} color={accountId === a.id ? color : colors.textMuted}
                />
                <Text style={[styles.chipText, { color: accountId === a.id ? color : colors.text }]}>
                  {a.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Description (optional)</Text>
          <View style={[styles.inputBox, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Add a note..."
              placeholderTextColor={colors.textMuted}
              returnKeyType="next"
            />
          </View>
        </View>

        {/* Date */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Date</Text>
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

        {/* Save button INSIDE scroll */}
        <View style={styles.saveSection}>
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: color }]}
            onPress={handleSave}
          >
            <Ionicons name={isEditing ? "checkmark-circle" : "add-circle"} size={20} color="#fff" />
            <Text style={styles.saveBtnText}>{isEditing ? "Update" : "Add"} Entry</Text>
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
  section: { paddingHorizontal: 16, marginBottom: 12 },
  label: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 6 },
  typeToggle: { flexDirection: "row", borderRadius: 12, padding: 4 },
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
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1,
  },
  chipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  emptyNote: { borderRadius: 10, padding: 14, alignItems: "center" },
  emptyNoteText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
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
