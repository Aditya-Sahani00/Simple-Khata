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
import { useApp, Party } from "@/context/AppContext";
import { useTheme } from "@/hooks/useTheme";
import { formatAmount } from "@/components/CurrencyText";

function PartyItem({
  party,
  toGive,
  toReceive,
  onPress,
  onEdit,
  onDelete,
  currency,
  compact,
}: {
  party: Party;
  toGive: number;
  toReceive: number;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
  currency: string;
  compact?: boolean;
}) {
  const { colors } = useTheme();
  const net = toReceive - toGive;
  // compact used via prop
  const hasBalance = toGive > 0 || toReceive > 0;

  return (
    <TouchableOpacity
      style={[styles.partyItem, { backgroundColor: colors.card }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.partyAvatar, { backgroundColor: "#1565C0" + "20" }]}>
        <Text style={[styles.partyAvatarText, { color: "#1565C0" }]}>
          {party.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.partyContent}>
        <Text style={[styles.partyName, { color: colors.text }]}>{party.name}</Text>
        <View style={styles.partyBalance}>
          {toReceive > 0 && (
            <View style={[styles.badge, { backgroundColor: "#00C853" + "15" }]}>
              <Text style={[styles.badgeText, { color: "#00C853" }]}>
                Rcv {currency} {formatAmount(toReceive, compact)}
              </Text>
            </View>
          )}
          {toGive > 0 && (
            <View style={[styles.badge, { backgroundColor: "#FF6F00" + "15" }]}>
              <Text style={[styles.badgeText, { color: "#FF6F00" }]}>
                Give {currency} {formatAmount(toGive, compact)}
              </Text>
            </View>
          )}
          {!hasBalance && (
            <Text style={[styles.settled, { color: colors.textMuted }]}>All Clear</Text>
          )}
        </View>
      </View>
      <View style={styles.partyActions}>
        {hasBalance && (
          <View style={styles.netBadge}>
            <Text
              style={[
                styles.netText,
                { color: net >= 0 ? "#00C853" : "#FF6F00" },
              ]}
            >
              {net >= 0 ? "+" : ""}{currency} {formatAmount(Math.abs(net), compact)}
            </Text>
          </View>
        )}
        <View style={styles.actionRow}>
          <TouchableOpacity onPress={onEdit} style={styles.iconBtn}>
            <Ionicons name="pencil" size={14} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onDelete} style={styles.iconBtn}>
            <Ionicons name="trash" size={14} color="#F44336" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function PartiesScreen() {
  const insets = useSafeAreaInsets();
  const { colors, primary } = useTheme();
  const { parties, partyEntries, deleteParty, settings, totalToGive, totalToReceive } = useApp();
  const [search, setSearch] = useState("");

  const currency = settings.currency || "NPR";
  const compact = settings.amountFormat === "compact";

  const filtered = useMemo(() => {
    let list = [...parties].sort((a, b) => a.name.localeCompare(b.name));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q));
    }
    return list;
  }, [parties, search]);

  const getPartyBalances = (partyId: string) => {
    const entries = partyEntries.filter(e => e.partyId === partyId && !e.settled);
    const toGive = entries.filter(e => e.entryType === "to_give").reduce((s, e) => s + e.amount, 0);
    const toReceive = entries.filter(e => e.entryType === "to_receive").reduce((s, e) => s + e.amount, 0);
    return { toGive, toReceive };
  };

  const handleDelete = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Delete Party", "This will delete all entries for this party.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteParty(id) },
    ]);
  };

  const topPad = Platform.OS === "web" ? 16 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8, backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.text }]}>Parties</Text>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: primary }]}
            onPress={() => router.push("/modal/party")}
          >
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Summary row */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryChip, { backgroundColor: "#00C853" + "15" }]}>
            <Ionicons name="arrow-back" size={14} color="#00C853" />
            <Text style={[styles.summaryChipText, { color: "#00C853" }]}>
              To Receive: {currency} {formatAmount(totalToReceive, compact)}
            </Text>
          </View>
          <View style={[styles.summaryChip, { backgroundColor: "#FF6F00" + "15" }]}>
            <Ionicons name="arrow-forward" size={14} color="#FF6F00" />
            <Text style={[styles.summaryChipText, { color: "#FF6F00" }]}>
              To Give: {currency} {formatAmount(totalToGive, compact)}
            </Text>
          </View>
        </View>

        {/* Search */}
        <View style={[styles.searchBar, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
          <Ionicons name="search" size={16} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search parties..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: Platform.OS === "ios" ? 100 : 80 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={56} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Parties</Text>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              Add people to track money you owe or are owed
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const { toGive, toReceive } = getPartyBalances(item.id);
          return (
            <PartyItem
              party={item}
              toGive={toGive}
              toReceive={toReceive}
              onPress={() => router.push({ pathname: "/party/[id]", params: { id: item.id } })}
              onEdit={() => router.push({ pathname: "/modal/party", params: { id: item.id } })}
              onDelete={() => handleDelete(item.id)}
              currency={currency}
              compact={compact}
            />
          );
        }}
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
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
    flexWrap: "wrap",
  },
  summaryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  summaryChipText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  list: { padding: 16 },
  partyItem: {
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
  partyAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  partyAvatarText: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  partyContent: { flex: 1 },
  partyName: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 6,
  },
  partyBalance: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  settled: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  partyActions: {
    alignItems: "flex-end",
    gap: 8,
  },
  netBadge: {
    alignItems: "flex-end",
  },
  netText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  actionRow: {
    flexDirection: "row",
    gap: 6,
  },
  iconBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 80,
    gap: 12,
    paddingHorizontal: 40,
  },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
});
