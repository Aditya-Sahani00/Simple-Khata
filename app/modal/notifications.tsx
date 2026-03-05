import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/hooks/useTheme";
import { getCategoryById } from "@/utils/categories";
import { formatDate } from "@/utils/nepali-date";
import { formatAmount } from "@/components/CurrencyText";

interface NotificationItem {
  id: string;
  type: "income" | "expense" | "to_give" | "to_receive" | "account" | "party";
  title: string;
  body: string;
  date: string;
  icon: string;
  color: string;
  action?: () => void;
}

export default function NotificationsModal() {
  const { colors } = useTheme();
  const {
    transactions, accounts, partyEntries, parties, settings,
  } = useApp();

  const currency = settings.currency || "NPR";
  const useBS = settings.dateFormat === "BS";

  const notifications = useMemo<NotificationItem[]>(() => {
    const items: NotificationItem[] = [];

    // Unsettled to-give entries (oldest first = most urgent)
    const unsettledGive = partyEntries
      .filter(e => e.entryType === "to_give" && !e.settled)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    unsettledGive.slice(0, 5).forEach(e => {
      const party = parties.find(p => p.id === e.partyId);
      items.push({
        id: `give_${e.id}`,
        type: "to_give",
        title: `You owe ${party?.name || "someone"}`,
        body: `${currency} ${formatAmount(e.amount, true)} to pay · ${formatDate(e.date, useBS)}`,
        date: e.date,
        icon: "arrow-forward-circle",
        color: "#FF6F00",
        action: () => {
          router.back();
          setTimeout(() => router.push("/(tabs)/parties"), 200);
        },
      });
    });

    // Unsettled to-receive entries
    const unsettledReceive = partyEntries
      .filter(e => e.entryType === "to_receive" && !e.settled)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    unsettledReceive.slice(0, 5).forEach(e => {
      const party = parties.find(p => p.id === e.partyId);
      items.push({
        id: `receive_${e.id}`,
        type: "to_receive",
        title: `${party?.name || "Someone"} owes you`,
        body: `${currency} ${formatAmount(e.amount, true)} to collect · ${formatDate(e.date, useBS)}`,
        date: e.date,
        icon: "arrow-back-circle",
        color: "#1565C0",
        action: () => {
          router.back();
          setTimeout(() => router.push("/(tabs)/parties"), 200);
        },
      });
    });

    // Accounts with zero balance
    accounts.forEach(a => {
      if (a.balance <= 0) {
        items.push({
          id: `acct_${a.id}`,
          type: "account",
          title: `${a.name} balance is ${a.balance <= 0 ? "zero" : "low"}`,
          body: `Balance: ${currency} ${formatAmount(a.balance, true)} · Tap to view`,
          date: new Date().toISOString(),
          icon: a.type === "cash" ? "cash" : a.type === "bank" ? "card" : "wallet",
          color: "#607D8B",
          action: () => {
            router.back();
            setTimeout(() => router.push({ pathname: "/account/[id]", params: { id: a.id } }), 200);
          },
        });
      }
    });

    // Recent large transactions (top 5 by amount in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentLarge = [...transactions]
      .filter(t => new Date(t.date) >= thirtyDaysAgo)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);
    recentLarge.forEach(t => {
      const cat = getCategoryById(t.categoryId);
      const isIncome = t.type === "income";
      items.push({
        id: `tx_${t.id}`,
        type: t.type,
        title: isIncome ? "Income recorded" : "Expense recorded",
        body: `${currency} ${formatAmount(t.amount, true)} · ${t.description || cat.name} · ${formatDate(t.date, useBS)}`,
        date: t.date,
        icon: isIncome ? "arrow-down-circle" : "arrow-up-circle",
        color: isIncome ? "#00C853" : "#F44336",
        action: () => {
          router.back();
          setTimeout(() => router.push({ pathname: "/modal/transaction", params: { id: t.id, type: t.type } }), 200);
        },
      });
    });

    // Sort by date descending
    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, partyEntries, parties, accounts, currency, useBS]);

  const urgentCount = useMemo(
    () => partyEntries.filter(e => !e.settled).length + accounts.filter(a => a.balance <= 0).length,
    [partyEntries, accounts]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={[styles.handle, { backgroundColor: colors.border }]} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Notifications</Text>
          {urgentCount > 0 && (
            <Text style={[styles.subtitle, { color: "#FF6F00" }]}>
              {urgentCount} item{urgentCount > 1 ? "s" : ""} need attention
            </Text>
          )}
        </View>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={i => i.id}
        contentContainerStyle={[styles.list, { paddingBottom: 40 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={64} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>All Caught Up!</Text>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              Notifications will appear here for pending payments, large transactions, and low balances.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.notifCard, { backgroundColor: colors.card }]}
            onPress={item.action}
            activeOpacity={0.8}
          >
            <View style={[styles.notifIcon, { backgroundColor: item.color + "20" }]}>
              <Ionicons name={item.icon as any} size={22} color={item.color} />
            </View>
            <View style={styles.notifContent}>
              <Text style={[styles.notifTitle, { color: colors.text }]} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={[styles.notifBody, { color: colors.textMuted }]} numberOfLines={2}>
                {item.body}
              </Text>
            </View>
            {item.action && (
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            )}
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    alignSelf: "center", marginTop: 8, marginBottom: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  title: { fontSize: 20, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 12, fontFamily: "Inter_500Medium", marginTop: 2 },
  list: { paddingHorizontal: 16 },
  notifCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    padding: 14,
  },
  notifIcon: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  notifContent: { flex: 1 },
  notifTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 4 },
  notifBody: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  emptyState: {
    alignItems: "center", paddingTop: 80, gap: 12, paddingHorizontal: 40,
  },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
});
