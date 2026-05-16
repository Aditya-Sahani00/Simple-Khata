import React from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/hooks/useTheme";
import { formatAmount } from "@/components/CurrencyText";
import { formatDate } from "@/utils/nepali-date";
import { getCategoryById } from "@/utils/categories";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

export default function RecycleBinScreen() {
  const insets = useSafeAreaInsets();
  const { colors, primary } = useTheme();
  const {
    deletedTransactions,
    deletedPartyEntries,
    restoreTransaction,
    permanentDeleteTransaction,
    restorePartyEntry,
    permanentDeletePartyEntry,
  } = useApp();

  const handleRestoreTx = (id: string) => {
    restoreTransaction(id);
  };

  const handleDeleteTx = (id: string) => {
    Alert.alert("Delete permanently", "This transaction will be permanently removed.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => permanentDeleteTransaction(id) },
    ]);
  };

  const handleRestorePartyEntry = (id: string) => {
    restorePartyEntry(id);
  };

  const handleDeletePartyEntry = (id: string) => {
    Alert.alert("Delete permanently", "This entry will be permanently removed.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => permanentDeletePartyEntry(id) },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 8 }]}> 
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}> 
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Recycle Bin</Text>
      </View>

      <FlatList
        data={[...deletedTransactions.map(tx => ({ kind: "tx" as const, item: tx })), ...deletedPartyEntries.map(pe => ({ kind: "entry" as const, item: pe }))]}
        keyExtractor={(item) => `${item.kind}-${item.item.id}`}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="trash-bin-outline" size={56} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Recycle Bin is empty</Text>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>Deleted entries will appear here until permanently removed.</Text>
          </View>
        }
        renderItem={({ item }) => {
          if (item.kind === "tx") {
            const tx = item.item;
            const category = getCategoryById(tx.categoryId);
            return (
              <View style={[styles.row, { backgroundColor: colors.card }]}> 
                <View style={styles.rowHeader}>
                  <Text style={[styles.rowTitle, { color: colors.text }]}>{tx.description || category.name}</Text>
                  <Text style={[styles.rowSub, { color: colors.textMuted }]}>{formatDate(tx.date, false)}</Text>
                </View>
                <Text style={[styles.rowAmount, { color: tx.type === "income" ? "#00C853" : "#F44336" }]}>
                  {(tx.type === "income" ? "+" : "-")}{formatAmount(tx.amount, true)}
                </Text>
                <View style={styles.rowActions}>
                  <TouchableOpacity onPress={() => handleRestoreTx(tx.id)} style={styles.actionBtn}>
                    <Ionicons name="arrow-up-circle" size={18} color={primary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteTx(tx.id)} style={styles.actionBtn}>
                    <Ionicons name="trash" size={18} color="#F44336" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          }

          const e = item.item;
          return (
            <View style={[styles.row, { backgroundColor: colors.card }]}> 
              <View style={styles.rowHeader}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>{e.description || (e.entryType === "to_give" ? "To Give" : "To Receive")}</Text>
                <Text style={[styles.rowSub, { color: colors.textMuted }]}>{formatDate(e.date, false)}</Text>
              </View>
              <Text style={[styles.rowAmount, { color: e.entryType === "to_receive" ? "#1565C0" : "#FF6F00" }]}>
                {e.entryType === "to_receive" ? "+" : "-"}{formatAmount(e.amount, true)}
              </Text>
              <View style={styles.rowActions}>
                <TouchableOpacity onPress={() => handleRestorePartyEntry(e.id)} style={styles.actionBtn}>
                  <Ionicons name="arrow-up-circle" size={18} color={primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeletePartyEntry(e.id)} style={styles.actionBtn}>
                  <Ionicons name="trash" size={18} color="#F44336" />
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 16 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1 },
  backBtn: { marginRight: 10 },
  title: { fontSize: 20, fontFamily: "Inter_700Bold" },
  emptyState: { alignItems: "center", paddingTop: 80, gap: 12, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  row: { borderRadius: 14, padding: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  rowHeader: { flex: 1, marginRight: 12 },
  rowTitle: { fontSize: 14, fontFamily: "Inter_500Medium" },
  rowSub: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  rowAmount: { fontSize: 14, fontFamily: "Inter_700Bold" },
  rowActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  actionBtn: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.06)" },
});