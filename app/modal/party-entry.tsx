import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/hooks/useTheme";
import { todayString } from "@/utils/nepali-date";

export default function PartyEntryModal() {
  const { colors } = useTheme();
  const { partyId, entryType: paramEntryType, id } = useLocalSearchParams<{
    partyId?: string;
    entryType?: string;
    id?: string;
  }>();
  const { parties, accounts, partyEntries, addPartyEntry, editPartyEntry } = useApp();

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
      partyId: selectedPartyId,
      accountId,
      entryType,
      amount: Number(amount),
      description: description.trim(),
      date,
      settled: false,
    };

    if (isEditing) {
      editPartyEntry(id!, data);
    } else {
      addPartyEntry(data);
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={[styles.handle, { backgroundColor: colors.border }]} />

      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          {isEditing ? "Edit Entry" : "Add Entry"}
        </Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {/* Entry Type */}
        <View style={styles.section}>
          <View style={[styles.typeToggle, { backgroundColor: colors.inputBg }]}>
            <TouchableOpacity
              style={[styles.typeBtn, entryType === "to_receive" && { backgroundColor: "#1565C0" }]}
              onPress={() => setEntryType("to_receive")}
            >
              <Ionicons name="arrow-back" size={16} color={entryType === "to_receive" ? "#fff" : colors.textMuted} />
              <Text style={[styles.typeBtnText, { color: entryType === "to_receive" ? "#fff" : colors.textMuted }]}>
                To Receive
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeBtn, entryType === "to_give" && { backgroundColor: "#FF6F00" }]}
              onPress={() => setEntryType("to_give")}
            >
              <Ionicons name="arrow-forward" size={16} color={entryType === "to_give" ? "#fff" : colors.textMuted} />
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
          />
        </View>

        {/* Party */}
        {!partyId && (
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Party</Text>
            {parties.length === 0 ? (
              <View style={[styles.emptyChip, { backgroundColor: colors.inputBg }]}>
                <Text style={[styles.emptyChipText, { color: colors.textMuted }]}>
                  No parties yet. Add a party first.
                </Text>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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
              </ScrollView>
            )}
          </View>
        )}

        {/* Account */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Account</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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
                    size={14}
                    color={accountId === a.id ? color : colors.textMuted}
                  />
                  <Text style={[styles.chipText, { color: accountId === a.id ? color : colors.text }]}>
                    {a.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
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
            />
          </View>
        </View>

        {/* Date */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Date</Text>
          <View style={[styles.inputBox, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
            <Ionicons name="calendar-outline" size={18} color={colors.textMuted} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textMuted}
            />
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: color }]}
          onPress={handleSave}
        >
          <Text style={styles.saveBtnText}>{isEditing ? "Update" : "Add"} Entry</Text>
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
  section: { paddingHorizontal: 20, marginBottom: 16 },
  label: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 8 },
  typeToggle: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 4,
  },
  typeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 9,
  },
  typeBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  amountBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 4,
  },
  currencySymbol: { fontSize: 24, fontFamily: "Inter_600SemiBold" },
  amountInput: {
    fontSize: 48,
    fontFamily: "Inter_700Bold",
    minWidth: 100,
    textAlign: "center",
  },
  chipRow: { flexDirection: "row", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
  },
  chipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  emptyChip: {
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
  },
  emptyChipText: { fontSize: 13, fontFamily: "Inter_400Regular" },
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
  footer: { padding: 20, borderTopWidth: 1 },
  saveBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  saveBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
