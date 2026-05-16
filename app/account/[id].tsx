import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  TextInput,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useApp, Transaction } from "@/context/AppContext";
import { useTheme } from "@/hooks/useTheme";
import { getCategoryById } from "@/utils/categories";
import { formatDate } from "@/utils/nepali-date";
import { formatAmount } from "@/components/CurrencyText";

const ACCOUNT_GRADIENTS: Record<string, [string, string]> = {
  cash: ["#1565C0", "#0D47A1"],
  bank: ["#00897B", "#00695C"],
  wallet: ["#7B1FA2", "#4A148C"],
};

function TxItem({
  item, accountName, useBS, currency, onPress, onLongPress, compact,
}: {
  item: Transaction; accountName: string; useBS: boolean;
  currency: string; onPress: () => void; onLongPress: () => void; compact?: boolean;
}) {
  const { colors } = useTheme();
  const cat = getCategoryById(item.categoryId);
  const isIncome = item.type === "income";
  return (
    <TouchableOpacity
      style={[styles.txCard, { backgroundColor: colors.card }]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.8}
    >
      <View style={[styles.txCatIcon, { backgroundColor: cat.color + "20" }]}>
        <Ionicons name={cat.icon as any} size={18} color={cat.color} />
      </View>
      <View style={styles.txInfo}>
        <Text style={[styles.txDesc, { color: colors.text }]} numberOfLines={1}>
          {item.description || cat.name}
        </Text>
        <Text style={[styles.txMeta, { color: colors.textMuted }]}>
          {cat.name} · {formatDate(item.date, useBS)}
        </Text>
      </View>
      <View style={styles.txRight}>
        <Text style={[styles.txAmount, { color: isIncome ? "#00C853" : "#F44336" }]}>
          {isIncome ? "+" : "-"}{currency} {formatAmount(item.amount, compact)}
        </Text>
        <Text style={[styles.txHint, { color: colors.textMuted }]}>Tap to edit • Hold to delete</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function AccountHistoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { accounts, transactions, deleteTransaction, settings } = useApp();

  const currency = settings.currency || "NPR";
  const useBS = settings.dateFormat === "BS";
  const compact = settings.amountFormat === "compact";

  const account = accounts.find(a => a.id === id);
  const gradient = ACCOUNT_GRADIENTS[account?.type || "cash"];

  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");
  const [search, setSearch] = useState("");

  const accountTxs = useMemo(() => {
    let list = transactions
      .filter(t => t.accountId === id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (filter !== "all") list = list.filter(t => t.type === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        t.description?.toLowerCase().includes(q) ||
        getCategoryById(t.categoryId).name.toLowerCase().includes(q)
      );
    }
    return list;
  }, [transactions, id, filter, search]);

  const totalIn = useMemo(
    () => transactions.filter(t => t.accountId === id && t.type === "income").reduce((s, t) => s + t.amount, 0),
    [transactions, id]
  );
  const totalOut = useMemo(
    () => transactions.filter(t => t.accountId === id && t.type === "expense").reduce((s, t) => s + t.amount, 0),
    [transactions, id]
  );

  const topPad = Platform.OS === "web" ? 16 : insets.top;

  const handleDelete = (txId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Delete Transaction", "Move to recycle bin?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteTransaction(txId) },
    ]);
  };

  if (!account) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topPad }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.notFound}>
          <Text style={[styles.notFoundText, { color: colors.textMuted }]}>Account not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Gradient Header */}
      <LinearGradient colors={gradient} style={[styles.gradientHeader, { paddingTop: topPad + 8 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.accountName}>{account.name}</Text>
            {account.bankName ? (
              <Text style={styles.accountSub}>{account.bankName}</Text>
            ) : null}
          </View>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => router.push({ pathname: "/modal/account", params: { id: account.id } })}
          >
            <Ionicons name="pencil" size={18} color="rgba(255,255,255,0.9)" />
          </TouchableOpacity>
        </View>

        {/* Balance */}
        <View style={styles.balanceSection}>
          <Text style={styles.balanceLabel}>Current Balance</Text>
          <Text style={styles.balanceAmount}>
            {currency} {formatAmount(account.balance)}
          </Text>
        </View>

        {/* In/Out summary */}
        <View style={styles.inOutRow}>
          <View style={styles.inOutCard}>
            <Ionicons name="arrow-down-circle" size={16} color="rgba(255,255,255,0.8)" />
            <Text style={styles.inOutLabel}>Total In</Text>
            <Text style={styles.inOutAmount}>
              {currency} {formatAmount(totalIn, compact)}
            </Text>
          </View>
          <View style={styles.inOutDivider} />
          <View style={styles.inOutCard}>
            <Ionicons name="arrow-up-circle" size={16} color="rgba(255,255,255,0.8)" />
            <Text style={styles.inOutLabel}>Total Out</Text>
            <Text style={styles.inOutAmount}>
              {currency} {formatAmount(totalOut, compact)}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Controls */}
      <View style={[styles.controls, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {/* Search */}
        <View style={[styles.searchBar, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
          <Ionicons name="search" size={15} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search transactions..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={15} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter */}
        <View style={[styles.filterRow, { backgroundColor: colors.inputBg }]}>
          {(["all", "income", "expense"] as const).map(f => (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterBtn,
                f === "income" && filter === f && { backgroundColor: "#00C853" },
                f === "expense" && filter === f && { backgroundColor: "#F44336" },
                f === "all" && filter === f && { backgroundColor: gradient[0] },
              ]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, { color: filter === f ? "#fff" : colors.textSecondary }]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={accountTxs}
        keyExtractor={i => i.id}
        contentContainerStyle={[styles.list, { paddingBottom: Platform.OS === "ios" ? 100 : 80 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={52} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Transactions</Text>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              Transactions using this account will appear here
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TxItem
            item={item}
            accountName={account.name}
            useBS={useBS}
            currency={currency}
            compact={compact}
            onPress={() =>
              router.push({ pathname: "/modal/transaction", params: { id: item.id, type: item.type } })
            }
            onLongPress={() => handleDelete(item.id)}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      />

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: gradient[0] }]}
        onPress={() =>
          router.push({
            pathname: "/modal/transaction",
            params: { type: "expense", accountId: account.id },
          })
        }
      >
        <Ionicons name="add" size={26} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradientHeader: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  headerCenter: { flex: 1, alignItems: "center" },
  accountName: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#fff" },
  accountSub: { fontSize: 12, color: "rgba(255,255,255,0.7)", fontFamily: "Inter_400Regular" },
  editBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  balanceSection: { alignItems: "center", marginBottom: 16 },
  balanceLabel: { fontSize: 12, color: "rgba(255,255,255,0.7)", fontFamily: "Inter_400Regular" },
  balanceAmount: { fontSize: 36, fontFamily: "Inter_700Bold", color: "#fff", marginTop: 2 },
  inOutRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 14,
    padding: 14,
  },
  inOutCard: { flex: 1, alignItems: "center", gap: 4 },
  inOutDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.2)" },
  inOutLabel: { fontSize: 11, color: "rgba(255,255,255,0.7)", fontFamily: "Inter_400Regular" },
  inOutAmount: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff" },
  controls: {
    paddingHorizontal: 16, paddingVertical: 12, gap: 8,
    borderBottomWidth: 1,
  },
  searchBar: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  filterRow: { flexDirection: "row", borderRadius: 10, padding: 3 },
  filterBtn: { flex: 1, paddingVertical: 7, borderRadius: 8, alignItems: "center" },
  filterText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  list: { padding: 16 },
  txCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderRadius: 14, padding: 14,
  },
  txCatIcon: {
    width: 42, height: 42, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  txInfo: { flex: 1 },
  txDesc: { fontSize: 14, fontFamily: "Inter_500Medium", marginBottom: 3 },
  txMeta: { fontSize: 11, fontFamily: "Inter_400Regular" },
  txRight: { alignItems: "flex-end", gap: 6 },
  txAmount: { fontSize: 14, fontFamily: "Inter_700Bold" },
  txHint: { fontSize: 11, fontFamily: "Inter_400Regular" },
  emptyState: {
    alignItems: "center", paddingTop: 80, gap: 12, paddingHorizontal: 40,
  },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center" },
  notFoundText: { fontSize: 16, fontFamily: "Inter_400Regular" },
  fab: {
    position: "absolute", right: 20, bottom: 100,
    width: 56, height: 56, borderRadius: 28,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 8,
  },
});
