import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Platform,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useApp, Transaction } from "@/context/AppContext";
import { useTheme } from "@/hooks/useTheme";
import { formatDate } from "@/utils/nepali-date";
import { getCategoryById } from "@/utils/categories";
import { formatAmount } from "@/components/CurrencyText";

function TransactionItem({
  item,
  onPress,
  onLongPress,
  useBS,
  currency,
  accountName,
  compact,
}: {
  item: Transaction;
  onPress: () => void;
  onLongPress: () => void;
  useBS: boolean;
  currency: string;
  accountName: string;
  compact?: boolean;
}) {
  const { colors } = useTheme();
  const { categories } = useApp();
  const category = categories.find(c => c.id === item.categoryId) || getCategoryById(item.categoryId);
  const isIncome = item.type === "income";

  return (
    <TouchableOpacity
      style={[styles.txItem, { backgroundColor: colors.card }]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.8}
    >
      <View style={[styles.txCatIcon, { backgroundColor: category.color + "20" }]}>
        <Ionicons name={category.icon as any} size={18} color={category.color} />
      </View>
      <View style={styles.txContent}>
        <Text style={[styles.txDesc, { color: colors.text }]} numberOfLines={1}>
          {item.description || category.name}
        </Text>
        <View style={styles.txMeta}>
          <Text style={[styles.txMetaText, { color: colors.textMuted }]}>
            {category.name}
          </Text>
          <View style={[styles.dot, { backgroundColor: colors.textMuted }]} />
          <Text style={[styles.txMetaText, { color: colors.textMuted }]}>{accountName}</Text>
          <View style={[styles.dot, { backgroundColor: colors.textMuted }]} />
          <Text style={[styles.txMetaText, { color: colors.textMuted }]}>
            {formatDate(item.date, useBS)}
          </Text>
        </View>
      </View>
      <View style={styles.txRight}>
        <Text style={[styles.txAmount, { color: isIncome ? "#00C853" : "#F44336" }]}>
          {isIncome ? "+" : "-"}{currency} {formatAmount(item.amount, compact)}
        </Text>
        <Text style={[styles.hintText, { color: colors.textMuted }]}>Tap to edit, long press to delete</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function TransactionsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark, primary } = useTheme();
  const { transactions, accounts, deleteTransaction, settings, categories } = useApp();
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");
  const [search, setSearch] = useState("");

  const useBS = settings.dateFormat === "BS";
  const currency = settings.currency || "NPR";
  const compact = settings.amountFormat === "compact";

  const filtered = useMemo(() => {
    let list = [...transactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    if (filter !== "all") list = list.filter(t => t.type === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        t =>
          t.description?.toLowerCase().includes(q) ||
          getCategoryById(t.categoryId).name.toLowerCase().includes(q) ||
          accounts.find(a => a.id === t.accountId)?.name.toLowerCase().includes(q)
      );
    }
    return list;
  }, [transactions, filter, search, accounts]);

  const handleDelete = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Delete Transaction", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteTransaction(id),
      },
    ]);
  };

  const handleEdit = (item: Transaction) => {
    router.push({ pathname: "/modal/transaction", params: { id: item.id, type: item.type } });
  };

  const topPad = Platform.OS === "web" ? 16 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8, backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Transactions</Text>
        <View style={[styles.actionRow, { backgroundColor: colors.inputBg, borderRadius: 14, padding: 4 }]}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: "#1565C0" }]} onPress={() => router.push({ pathname: "/modal/party-entry", params: { entryType: "to_receive" } })}>
            <Ionicons name="arrow-down-circle" size={14} color="#fff" />
            <Text style={styles.actionBtnText}>Payment In</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: "#FF6F00" }]} onPress={() => router.push({ pathname: "/modal/party-entry", params: { entryType: "to_give" } })}>
            <Ionicons name="arrow-up-circle" size={14} color="#fff" />
            <Text style={styles.actionBtnText}>Payment Out</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: primary }]} onPress={() => router.push({ pathname: "/modal/transaction", params: { type: "expense" } })}>
            <Ionicons name="add" size={14} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={[styles.searchBar, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
        <Ionicons name="search" size={16} color={colors.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search transactions..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter tabs */}
      <View style={[styles.filterRow, { backgroundColor: colors.inputBg }]}>
        {(["all", "income", "expense"] as const).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && { backgroundColor: primary }]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, { color: filter === f ? "#fff" : colors.textSecondary }]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: Platform.OS === "ios" ? 100 : 80 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={56} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Transactions</Text>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              Add your first transaction using the + button
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TransactionItem
            item={item}
            onPress={() => handleEdit(item)}
            onLongPress={() => handleDelete(item.id)}
            useBS={useBS}
            currency={currency}
            accountName={accounts.find(a => a.id === item.accountId)?.name || "Unknown"}
            compact={compact}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  actionBtnText: {
    color: "#fff",
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  filterRow: {
    flexDirection: "row",
    borderRadius: 10,
    padding: 3,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: "center",
  },
  filterText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  list: {
    padding: 16,
  },
  txItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  txCatIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  txContent: { flex: 1 },
  txDesc: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    marginBottom: 4,
  },
  txMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  txMetaText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  txRight: {
    alignItems: "flex-end",
    gap: 6,
  },
  txAmount: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  hintText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 80,
    gap: 12,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});
