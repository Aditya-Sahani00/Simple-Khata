import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  TextInput,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/hooks/useTheme";
import { getCategoryById } from "@/utils/categories";
import { formatDate } from "@/utils/nepali-date";
import { formatAmount } from "@/components/CurrencyText";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type FilterType = "income" | "expense" | "to_receive" | "to_give";

const CONFIG: Record<FilterType, {
  label: string; color: string; bg: [string, string];
  icon: string; addLabel: string;
}> = {
  income: {
    label: "Income", color: "#00C853",
    bg: ["#00C853", "#00897B"], icon: "arrow-down-circle",
    addLabel: "Add Income",
  },
  expense: {
    label: "Expenses", color: "#F44336",
    bg: ["#F44336", "#C62828"], icon: "arrow-up-circle",
    addLabel: "Add Expense",
  },
  to_receive: {
    label: "To Receive", color: "#1565C0",
    bg: ["#1565C0", "#0D47A1"], icon: "arrow-back-circle",
    addLabel: "Add Entry",
  },
  to_give: {
    label: "To Give", color: "#FF6F00",
    bg: ["#FF6F00", "#E65100"], icon: "arrow-forward-circle",
    addLabel: "Add Entry",
  },
};

export default function FilterHistoryModal() {
  const insets = useSafeAreaInsets();
  const { type } = useLocalSearchParams<{ type: string }>();
  const filterType = (type || "income") as FilterType;
  const config = CONFIG[filterType];

  const { colors } = useTheme();
  const {
    transactions, accounts, partyEntries, parties, settings,
  } = useApp();

  const currency = settings.currency || "NPR";
  const useBS = settings.dateFormat === "BS";
  const compact = settings.amountFormat === "compact";
  const [search, setSearch] = useState("");

  const isPartyFilter = filterType === "to_receive" || filterType === "to_give";

  // Transaction items
  const txItems = useMemo(() => {
    if (isPartyFilter) return [];
    let list = transactions
      .filter(t => t.type === filterType)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        t.description?.toLowerCase().includes(q) ||
        getCategoryById(t.categoryId).name.toLowerCase().includes(q)
      );
    }
    return list;
  }, [transactions, filterType, search, isPartyFilter]);

  // Party entry items
  const entryItems = useMemo(() => {
    if (!isPartyFilter) return [];
    let list = partyEntries
      .filter(e => e.entryType === filterType && !e.settled)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(e => {
        const partyName = parties.find(p => p.id === e.partyId)?.name || "";
        return (
          e.description?.toLowerCase().includes(q) ||
          partyName.toLowerCase().includes(q)
        );
      });
    }
    return list;
  }, [partyEntries, filterType, search, parties, isPartyFilter]);

  const total = useMemo(() => {
    if (isPartyFilter) return entryItems.reduce((s, e) => s + e.amount, 0);
    return txItems.reduce((s, t) => s + t.amount, 0);
  }, [txItems, entryItems, isPartyFilter]);

  const count = isPartyFilter ? entryItems.length : txItems.length;

  const handleAdd = () => {
    router.back();
    setTimeout(() => {
      if (isPartyFilter) {
        router.push({ pathname: "/modal/party-entry", params: { entryType: filterType } });
      } else {
        router.push({ pathname: "/modal/transaction", params: { type: filterType } });
      }
    }, 150);
  };

  const topInset = Platform.OS === "ios" ? 0 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, paddingTop: topInset, paddingBottom: insets.bottom + 8 }]}>
      {/* Drag handle */}
      <View style={[styles.handle, { backgroundColor: colors.border }]} />

      {/* Gradient header */}
      <LinearGradient colors={config.bg} style={styles.gradientHeader}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-down" size={22} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{config.label}</Text>
          <TouchableOpacity style={styles.addHeaderBtn} onPress={handleAdd}>
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Summary */}
        <View style={styles.headerSummary}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>
            {currency} {formatAmount(total, compact)}
          </Text>
          <Text style={styles.countLabel}>
            {count} {isPartyFilter ? "pending entries" : "transactions"}
          </Text>
        </View>
      </LinearGradient>

      {/* Search */}
      <View style={[styles.searchBar, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
        <Ionicons name="search" size={15} color={colors.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder={`Search ${config.label.toLowerCase()}...`}
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

      {/* List */}
      {isPartyFilter ? (
        <FlatList
          data={entryItems}
          keyExtractor={i => i.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.list, { paddingBottom: 40 }]}
          ListEmptyComponent={
            <EmptyState config={config} onAdd={handleAdd} colors={colors} />
          }
          renderItem={({ item }) => {
            const party = parties.find(p => p.id === item.partyId);
            const account = accounts.find(a => a.id === item.accountId);
            return (
              <View style={[styles.entryCard, { backgroundColor: colors.card }]}>
                <View style={[styles.entryAvatar, { backgroundColor: config.color + "20" }]}>
                  <Text style={[styles.entryAvatarText, { color: config.color }]}>
                    {party?.name?.charAt(0)?.toUpperCase() || "?"}
                  </Text>
                </View>
                <View style={styles.entryInfo}>
                  <Text style={[styles.entryParty, { color: colors.text }]}>
                    {party?.name || "Unknown"}
                  </Text>
                  <Text style={[styles.entryMeta, { color: colors.textMuted }]}>
                    {account?.name || ""} · {formatDate(item.date, useBS)}
                  </Text>
                  {item.description ? (
                    <Text style={[styles.entryDesc, { color: colors.textSecondary }]} numberOfLines={1}>
                      {item.description}
                    </Text>
                  ) : null}
                </View>
                <Text style={[styles.entryAmount, { color: config.color }]}>
                  {currency} {formatAmount(item.amount, compact)}
                </Text>
              </View>
            );
          }}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        />
      ) : (
        <FlatList
          data={txItems}
          keyExtractor={i => i.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.list, { paddingBottom: 40 }]}
          ListEmptyComponent={
            <EmptyState config={config} onAdd={handleAdd} colors={colors} />
          }
          renderItem={({ item }) => {
            const cat = getCategoryById(item.categoryId);
            const account = accounts.find(a => a.id === item.accountId);
            return (
              <TouchableOpacity
                style={[styles.txCard, { backgroundColor: colors.card }]}
                onPress={() =>
                  router.push({ pathname: "/modal/transaction", params: { id: item.id, type: item.type } })
                }
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
                    {cat.name} · {account?.name || ""} · {formatDate(item.date, useBS)}
                  </Text>
                </View>
                <View style={styles.txRight}>
                  <Text style={[styles.txAmount, { color: config.color }]}>
                    {filterType === "income" ? "+" : "-"}{currency} {formatAmount(item.amount, compact)}
                  </Text>
                  <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
                </View>
              </TouchableOpacity>
            );
          }}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        />
      )}
    </View>
  );
}

function EmptyState({ config, onAdd, colors }: any) {
  return (
    <View style={styles.emptyState}>
      <Ionicons name={config.icon} size={56} color={config.color + "60"} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        No {config.label} Yet
      </Text>
      <Text style={[styles.emptyText, { color: colors.textMuted }]}>
        Tap the + button above to add your first entry
      </Text>
      <TouchableOpacity
        style={[styles.emptyAddBtn, { backgroundColor: config.color }]}
        onPress={onAdd}
      >
        <Ionicons name="add" size={16} color="#fff" />
        <Text style={styles.emptyAddText}>{config.addLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    alignSelf: "center", marginTop: 8,
  },
  gradientHeader: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 12,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  closeBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18, fontFamily: "Inter_700Bold", color: "#fff",
  },
  addHeaderBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center", justifyContent: "center",
  },
  headerSummary: { alignItems: "center", gap: 4 },
  totalLabel: { fontSize: 12, color: "rgba(255,255,255,0.7)", fontFamily: "Inter_400Regular" },
  totalAmount: { fontSize: 36, fontFamily: "Inter_700Bold", color: "#fff" },
  countLabel: { fontSize: 12, color: "rgba(255,255,255,0.7)", fontFamily: "Inter_400Regular" },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  list: { paddingHorizontal: 16 },
  txCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    padding: 14,
  },
  txCatIcon: {
    width: 42, height: 42, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  txInfo: { flex: 1 },
  txDesc: { fontSize: 14, fontFamily: "Inter_500Medium", marginBottom: 3 },
  txMeta: { fontSize: 11, fontFamily: "Inter_400Regular" },
  txRight: { alignItems: "flex-end", gap: 4 },
  txAmount: { fontSize: 14, fontFamily: "Inter_700Bold" },
  entryCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    padding: 14,
  },
  entryAvatar: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: "center", justifyContent: "center",
  },
  entryAvatarText: { fontSize: 18, fontFamily: "Inter_700Bold" },
  entryInfo: { flex: 1 },
  entryParty: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 3 },
  entryMeta: { fontSize: 11, fontFamily: "Inter_400Regular" },
  entryDesc: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  entryAmount: { fontSize: 15, fontFamily: "Inter_700Bold" },
  emptyState: {
    alignItems: "center", paddingTop: 60,
    gap: 12, paddingHorizontal: 40,
  },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
  emptyAddBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12, marginTop: 6,
  },
  emptyAddText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
