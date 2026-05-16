import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useApp, PartyEntry } from "@/context/AppContext";
import { useTheme } from "@/hooks/useTheme";
import { formatAmount } from "@/components/CurrencyText";
import { formatDate } from "@/utils/nepali-date";

function EntryRow({ entry, onPress, onLongPress, onSettle, useBS, currency, accountName, compact }: {
  entry: PartyEntry;
  onPress: () => void;
  onLongPress: () => void;
  onSettle: () => void;
  useBS: boolean;
  currency: string;
  accountName: string;
  compact?: boolean;
}) {
  const { colors } = useTheme();
  const isGive = entry.entryType === "to_give";
  const color = isGive ? "#FF6F00" : "#1565C0";

  return (
    <TouchableOpacity
      style={[styles.entryRow, { backgroundColor: colors.card }]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.8}
    >
      <View style={[styles.entryIcon, { backgroundColor: color + "20" }]}>
        <Ionicons name={isGive ? "arrow-forward" : "arrow-back"} size={16} color={color} />
      </View>
      <View style={styles.entryContent}>
        <Text style={[styles.entryDesc, { color: colors.text }]} numberOfLines={1}>
          {entry.description || (isGive ? "To Give" : "To Receive")}
        </Text>
        <Text style={[styles.entryMeta, { color: colors.textMuted }]}>
          {accountName} · {formatDate(entry.date, useBS)}
        </Text>
      </View>
      <View style={styles.entryRight}>
        <Text style={[styles.entryAmount, { color }]}>
          {isGive ? "-" : "+"}{currency} {formatAmount(entry.amount, compact)}
        </Text>
        <View style={styles.entryActions}>
          {!entry.settled && (
            <TouchableOpacity style={[styles.settleBtn, { backgroundColor: "#00C853" + "20" }]} onPress={onSettle}>
              <Ionicons name="checkmark" size={14} color="#00C853" />
            </TouchableOpacity>
          )}
          <Text style={[styles.hintSmall, { color: colors.textMuted }]}>Hold row for delete</Text>
        </View>
        {entry.settled && (
          <View style={[styles.settledBadge, { backgroundColor: "#00C853" + "15" }]}>
            <Text style={[styles.settledText, { color: "#00C853" }]}>Settled</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function PartyDetailScreen() {
  const insets = useSafeAreaInsets();
  const { colors, primary } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { parties, partyEntries, accounts, deletePartyEntry, settlePartyEntry, settings } = useApp();

  const party = parties.find(p => p.id === id);
  const useBS = settings.dateFormat === "BS";
  const currency = settings.currency || "NPR";
  const compact = settings.amountFormat === "compact";

  const entries = useMemo(
    () =>
      [...partyEntries]
        .filter(e => e.partyId === id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [partyEntries, id]
  );

  const { toGive, toReceive } = useMemo(() => {
    const active = entries.filter(e => !e.settled);
    return {
      toGive: active.filter(e => e.entryType === "to_give").reduce((s, e) => s + e.amount, 0),
      toReceive: active.filter(e => e.entryType === "to_receive").reduce((s, e) => s + e.amount, 0),
    };
  }, [entries]);

  const topPad = Platform.OS === "web" ? 16 : insets.top;

  if (!party) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: colors.text }}>Party not found</Text>
      </View>
    );
  }

  const handleDelete = (eid: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Delete Entry", "Remove this entry?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deletePartyEntry(eid) },
    ]);
  };

  const handleSettle = (eid: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    settlePartyEntry(eid);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8, backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <View style={[styles.avatar, { backgroundColor: primary + "20" }]}>
            <Text style={[styles.avatarText, { color: primary }]}>
              {party.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.partyName, { color: colors.text }]}>{party.name}</Text>
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: primary }]}
          onPress={() => router.push({ pathname: "/modal/party-entry", params: { partyId: id } })}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Balance Summary */}
      <View style={styles.balanceSummary}>
        <View style={[styles.balanceCard, { backgroundColor: "#1565C0" + "15", borderColor: "#1565C0" + "30" }]}>
          <Text style={[styles.balanceCardLabel, { color: "#1565C0" }]}>To Receive</Text>
          <Text style={[styles.balanceCardAmount, { color: "#1565C0" }]}>
            {currency} {formatAmount(toReceive, compact)}
          </Text>
        </View>
        <View style={[styles.balanceCard, { backgroundColor: "#FF6F00" + "15", borderColor: "#FF6F00" + "30" }]}>
          <Text style={[styles.balanceCardLabel, { color: "#FF6F00" }]}>To Give</Text>
          <Text style={[styles.balanceCardAmount, { color: "#FF6F00" }]}>
            {currency} {formatAmount(toGive, compact)}
          </Text>
        </View>
      </View>

      <FlatList
        data={entries}
        keyExtractor={item => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: Platform.OS === "ios" ? 100 : 80 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="swap-horizontal-outline" size={56} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Entries</Text>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              Add entries to track money with {party.name}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <EntryRow
            entry={item}
            onPress={() => router.push({ pathname: "/modal/party-entry", params: { id: item.id } })}
            onLongPress={() => handleDelete(item.id)}
            onSettle={() => handleSettle(item.id)}
            useBS={useBS}
            currency={currency}
            compact={compact}
            accountName={accounts.find(a => a.id === item.accountId)?.name || "Unknown"}
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
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  partyName: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  balanceSummary: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
  },
  balanceCard: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    gap: 4,
  },
  balanceCardLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  balanceCardAmount: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  list: { padding: 16, paddingTop: 0 },
  entryRow: {
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
  entryIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  entryContent: { flex: 1 },
  entryDesc: { fontSize: 14, fontFamily: "Inter_500Medium" },
  entryMeta: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 3 },
  entryRight: { alignItems: "flex-end", gap: 6 },
  entryAmount: { fontSize: 14, fontFamily: "Inter_700Bold" },
  hintSmall: { fontSize: 10, fontFamily: "Inter_400Regular" },
  entryActions: { flexDirection: "row", gap: 6 },
  settleBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  settledBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  settledText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  emptyState: {
    alignItems: "center",
    paddingTop: 60,
    gap: 12,
    paddingHorizontal: 40,
  },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
});
