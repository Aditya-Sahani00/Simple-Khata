import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useApp, Period } from "@/context/AppContext";
import { useTheme } from "@/hooks/useTheme";
import { formatAmount } from "@/components/CurrencyText";
import BarChart from "@/components/BarChart";
import { formatDateShort } from "@/utils/nepali-date";
import { getCategoryById } from "@/utils/categories";

const PERIODS: { label: string; value: Period }[] = [
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Yearly", value: "yearly" },
];

// --- Summary Card ---
function SummaryCard({
  title, amount, subtitle, color, bg, onPress, currency, privacy, large,
}: {
  title: string; amount?: number; subtitle?: string; color: string;
  bg: string; onPress: () => void; currency: string; privacy: boolean; large?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={[styles.summaryCard, { backgroundColor: bg }]}
      onPress={onPress}
      activeOpacity={0.82}
    >
      <View style={styles.summaryCardRow}>
        <View style={{ flex: 1 }}>
          {amount !== undefined ? (
            <Text style={[styles.summaryAmount, { color, fontSize: large ? 20 : 18 }]} numberOfLines={1}>
              {privacy ? "Rs. XXXX" : `${currency} ${formatAmount(Math.abs(amount), true)}`}
            </Text>
          ) : (
            <Text style={[styles.balanceBig, { color }]}>
              {title}
            </Text>
          )}
          {amount !== undefined && (
            <Text style={[styles.summaryTitle, { color: color + "BB" }]} numberOfLines={1}>
              {title}
              {subtitle ? ` (${subtitle})` : ""}
            </Text>
          )}
          {amount === undefined && subtitle && (
            <Text style={[styles.summarySubLine, { color: color + "90" }]}>{subtitle}</Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={16} color={color + "70"} />
      </View>
    </TouchableOpacity>
  );
}

// --- Shortcut ---
function ShortcutBtn({ icon, label, color, onPress }: {
  icon: string; label: string; color: string; onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity style={styles.shortcutBtn} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.shortcutIcon, { backgroundColor: color + "22" }]}>
        <Ionicons name={icon as any} size={22} color={color} />
      </View>
      <Text style={[styles.shortcutLabel, { color: colors.textSecondary }]} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// --- Recent transaction row ---
function TxRow({ t, accounts, useBS, currency, privacy }: any) {
  const { colors } = useTheme();
  const cat = getCategoryById(t.categoryId);
  const acct = accounts.find((a: any) => a.id === t.accountId);
  const isIncome = t.type === "income";
  return (
    <TouchableOpacity
      style={[styles.txRow, { borderBottomColor: colors.divider }]}
      onPress={() => router.push({ pathname: "/modal/transaction", params: { id: t.id, type: t.type } })}
      activeOpacity={0.8}
    >
      <View style={[styles.txIcon, { backgroundColor: cat.color + "22" }]}>
        <Ionicons name={cat.icon as any} size={17} color={cat.color} />
      </View>
      <View style={styles.txInfo}>
        <Text style={[styles.txDesc, { color: colors.text }]} numberOfLines={1}>
          {t.description || cat.name}
        </Text>
        <Text style={[styles.txMeta, { color: colors.textMuted }]}>
          {acct?.name || ""} · {formatDateShort(t.date, useBS)}
        </Text>
      </View>
      <Text style={[styles.txAmount, { color: isIncome ? "#00C853" : "#F44336" }]}>
        {privacy ? "Rs. **" : `${isIncome ? "+" : "-"}${currency} ${formatAmount(t.amount, true)}`}
      </Text>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark, primary } = useTheme();
  const {
    settings, totalBalance, totalIncome, totalExpense,
    totalToGive, totalToReceive, transactions, accounts,
    activeProfile, updateSettings, partyEntries,
  } = useApp();

  const currency = settings.currency || "NPR";
  const useBS = settings.dateFormat === "BS";
  const [chartPeriod, setChartPeriod] = useState<Period>(settings.period);
  const [privacy, setPrivacy] = useState(false);

  const income = totalIncome(settings.period);
  const expense = totalExpense(settings.period);

  // Notification badge count
  const notifCount = useMemo(
    () => partyEntries.filter(e => !e.settled).length,
    [partyEntries]
  );

  const periodLabel = new Date().toLocaleString("default", { month: "long" });

  const chartData = useMemo(() => {
    const now = new Date();
    if (chartPeriod === "weekly") {
      const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const data = days.map(label => ({ label, income: 0, expense: 0 }));
      const weekStart = new Date(now);
      const day = weekStart.getDay();
      weekStart.setDate(weekStart.getDate() - (day === 0 ? 6 : day - 1));
      weekStart.setHours(0, 0, 0, 0);
      transactions.forEach(t => {
        const d = new Date(t.date);
        if (d >= weekStart) {
          const idx = Math.min(Math.floor((d.getTime() - weekStart.getTime()) / 86400000), 6);
          if (idx >= 0 && idx < 7) {
            if (t.type === "income") data[idx].income += t.amount;
            else data[idx].expense += t.amount;
          }
        }
      });
      return data;
    }
    if (chartPeriod === "monthly") {
      const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      const data = months.map(label => ({ label, income: 0, expense: 0 }));
      const year = now.getFullYear();
      transactions.forEach(t => {
        const d = new Date(t.date);
        if (d.getFullYear() === year) {
          const m = d.getMonth();
          if (t.type === "income") data[m].income += t.amount;
          else data[m].expense += t.amount;
        }
      });
      return data.slice(0, now.getMonth() + 1);
    }
    const years = [];
    for (let y = now.getFullYear() - 4; y <= now.getFullYear(); y++) {
      const entry = { label: String(y).slice(2), income: 0, expense: 0 };
      transactions.forEach(t => {
        if (new Date(t.date).getFullYear() === y) {
          if (t.type === "income") entry.income += t.amount;
          else entry.expense += t.amount;
        }
      });
      years.push(entry);
    }
    return years;
  }, [transactions, chartPeriod]);

  const recentTxs = useMemo(
    () => [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5),
    [transactions]
  );

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const TEAL = "#00C853";
  const bg = isDark ? "#111111" : colors.background;
  const cardDark = isDark ? "#1E1E1E" : colors.card;

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 6, backgroundColor: bg }]}>
        <TouchableOpacity
          style={styles.profileArea}
          onPress={() => router.push("/(tabs)/profile")}
          activeOpacity={0.8}
        >
          <View style={[styles.avatar, { backgroundColor: primary }]}>
            <Text style={styles.avatarText}>
              {activeProfile?.name?.charAt(0)?.toUpperCase() || "A"}
            </Text>
          </View>
          <View style={styles.profileTextBox}>
            <Text style={[styles.profileName, { color: colors.text }]}>
              {activeProfile?.name || "Personal"}
            </Text>
            <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
          </View>
        </TouchableOpacity>

        {/* Notification bell */}
        <TouchableOpacity
          style={[styles.headerIconBtn, { backgroundColor: cardDark }]}
          onPress={() => router.push("/modal/notifications")}
        >
          <Ionicons name="notifications-outline" size={20} color={colors.textSecondary} />
          {notifCount > 0 && (
            <View style={styles.notifBadge}>
              <Text style={styles.notifBadgeText}>
                {notifCount > 9 ? "9+" : notifCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Privacy Mode */}
        <View style={[styles.privacyRow, { backgroundColor: cardDark }]}>
          <Ionicons name="eye-off-outline" size={18} color={colors.textSecondary} />
          <Text style={[styles.privacyLabel, { color: colors.textSecondary }]}>Privacy Mode</Text>
          <Switch
            value={privacy}
            onValueChange={v => { setPrivacy(v); Haptics.selectionAsync(); }}
            trackColor={{ false: colors.border, true: TEAL }}
            thumbColor="#fff"
            style={{ transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] }}
          />
        </View>

        {/* Period selector */}
        <View style={styles.periodRow}>
          {PERIODS.map(p => (
            <TouchableOpacity
              key={p.value}
              style={[
                styles.periodBtn,
                { backgroundColor: cardDark },
                settings.period === p.value && {
                  backgroundColor: TEAL + "22", borderColor: TEAL, borderWidth: 1,
                },
              ]}
              onPress={() => {
                updateSettings({ period: p.value });
                setChartPeriod(p.value);
                Haptics.selectionAsync();
              }}
            >
              <Text style={[styles.periodText, {
                color: settings.period === p.value ? TEAL : colors.textMuted,
              }]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary Cards — open filter-history */}
        <View style={styles.cardGrid}>
          <SummaryCard
            title="Income"
            subtitle={periodLabel}
            amount={income}
            color={TEAL}
            bg={isDark ? "#0D2B1D" : "#E8F5E9"}
            onPress={() => router.push({ pathname: "/modal/filter-history", params: { type: "income" } })}
            currency={currency}
            privacy={privacy}
          />
          <SummaryCard
            title="Expense"
            subtitle={periodLabel}
            amount={expense}
            color="#F44336"
            bg={isDark ? "#2B0D12" : "#FFEBEE"}
            onPress={() => router.push({ pathname: "/modal/filter-history", params: { type: "expense" } })}
            currency={currency}
            privacy={privacy}
          />
          <SummaryCard
            title="To Receive"
            amount={totalToReceive}
            color={colors.text as string}
            bg={cardDark}
            onPress={() => router.push({ pathname: "/modal/filter-history", params: { type: "to_receive" } })}
            currency={currency}
            privacy={privacy}
          />
          <SummaryCard
            title="To Give"
            amount={totalToGive}
            color={colors.text as string}
            bg={cardDark}
            onPress={() => router.push({ pathname: "/modal/filter-history", params: { type: "to_give" } })}
            currency={currency}
            privacy={privacy}
          />
          {/* Total Balance */}
          <TouchableOpacity
            style={[styles.summaryCard, { backgroundColor: cardDark }]}
            onPress={() => router.push("/(tabs)/accounts")}
            activeOpacity={0.82}
          >
            <View style={styles.summaryCardRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.balanceBig, { color: colors.text }]} numberOfLines={1}>
                  {privacy ? "Rs. XXXX" : `${currency} ${formatAmount(totalBalance, true)}`}
                </Text>
                <Text style={[styles.summaryTitle, { color: colors.textMuted }]}>Total Balance</Text>
                <Text style={[styles.summarySubLine, { color: colors.textMuted }]}>Cash & Bank</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </View>
          </TouchableOpacity>
          {/* Reports */}
          <TouchableOpacity
            style={[styles.summaryCard, { backgroundColor: cardDark }]}
            onPress={() => router.push("/(tabs)/transactions")}
            activeOpacity={0.82}
          >
            <View style={styles.summaryCardRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.balanceBig, { color: colors.text }]}>Reports</Text>
                <Text style={[styles.summarySubLine, { color: colors.textMuted }]}>
                  Transactions, Parties...
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Shortcuts */}
        <View style={[styles.sectionCard, { backgroundColor: cardDark }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Shortcuts</Text>
          </View>
          <View style={styles.shortcutsGrid}>
            <ShortcutBtn icon="person-add" label="Add Party" color={TEAL}
              onPress={() => router.push("/modal/party")} />
            <ShortcutBtn icon="arrow-down-circle" label="Payment In" color={TEAL}
              onPress={() => router.push({ pathname: "/modal/transaction", params: { type: "income" } })} />
            <ShortcutBtn icon="arrow-up-circle" label="Payment Out" color={TEAL}
              onPress={() => router.push({ pathname: "/modal/transaction", params: { type: "expense" } })} />
            <ShortcutBtn icon="remove-circle" label="Expense" color={TEAL}
              onPress={() => router.push({ pathname: "/modal/transaction", params: { type: "expense" } })} />
            <ShortcutBtn icon="add-circle" label="Income" color={TEAL}
              onPress={() => router.push({ pathname: "/modal/transaction", params: { type: "income" } })} />
          </View>
        </View>

        {/* Cashflow */}
        <View style={[styles.sectionCard, { backgroundColor: cardDark }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Cashflow{" "}
              <Text style={[styles.cashflowSub, { color: colors.textMuted }]}>
                {chartPeriod === "weekly" ? "(Last 7 Days)" : chartPeriod === "monthly" ? "(This Year)" : "(Last 5 Years)"}
              </Text>
            </Text>
            <View style={styles.chartPeriodRow}>
              {PERIODS.map(p => (
                <TouchableOpacity
                  key={p.value}
                  style={[styles.chartPeriodBtn, chartPeriod === p.value && { backgroundColor: TEAL + "22" }]}
                  onPress={() => setChartPeriod(p.value)}
                >
                  <Text style={[styles.chartPeriodText, { color: chartPeriod === p.value ? TEAL : colors.textMuted }]}>
                    {p.label.charAt(0)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <BarChart data={chartData} isDark={isDark} />
        </View>

        {/* Recent */}
        <View style={[styles.sectionCard, { backgroundColor: cardDark }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/transactions")}>
              <Text style={[styles.seeAll, { color: TEAL }]}>See All</Text>
            </TouchableOpacity>
          </View>
          {recentTxs.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={40} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>No transactions yet</Text>
            </View>
          ) : (
            recentTxs.map(t => (
              <TxRow key={t.id} t={t} accounts={accounts} useBS={useBS} currency={currency} privacy={privacy} />
            ))
          )}
        </View>

        <View style={{ height: Platform.OS === "ios" ? 100 : 80 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16, paddingBottom: 10,
  },
  profileArea: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#fff" },
  profileTextBox: { flexDirection: "row", alignItems: "center", gap: 4 },
  profileName: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  headerIconBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: "center", justifyContent: "center",
  },
  notifBadge: {
    position: "absolute", top: 4, right: 4,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: "#F44336",
    alignItems: "center", justifyContent: "center",
  },
  notifBadgeText: { fontSize: 9, fontFamily: "Inter_700Bold", color: "#fff" },
  privacyRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    marginHorizontal: 16, marginBottom: 10, borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 12,
  },
  privacyLabel: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  periodRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16, marginBottom: 10 },
  periodBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: "center" },
  periodText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  cardGrid: {
    flexDirection: "row", flexWrap: "wrap", gap: 10,
    paddingHorizontal: 16, marginBottom: 10,
  },
  summaryCard: { width: "48%", borderRadius: 14, padding: 16, minHeight: 82, justifyContent: "center" },
  summaryCardRow: { flexDirection: "row", alignItems: "flex-start" },
  summaryAmount: { fontFamily: "Inter_700Bold", marginBottom: 4 },
  summaryTitle: { fontSize: 12, fontFamily: "Inter_400Regular" },
  summarySubLine: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  balanceBig: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 4 },
  sectionCard: { margin: 16, marginBottom: 0, borderRadius: 16, padding: 16 },
  sectionHeader: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: 14,
  },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  cashflowSub: { fontSize: 13, fontFamily: "Inter_400Regular" },
  shortcutsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  shortcutBtn: { width: "18%", alignItems: "center", gap: 6, minWidth: 56 },
  shortcutIcon: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  shortcutLabel: { fontSize: 10, fontFamily: "Inter_500Medium", textAlign: "center" },
  chartPeriodRow: { flexDirection: "row", gap: 4 },
  chartPeriodBtn: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  chartPeriodText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  seeAll: { fontSize: 14, fontFamily: "Inter_500Medium" },
  txRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 11, borderBottomWidth: 1,
  },
  txIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  txInfo: { flex: 1 },
  txDesc: { fontSize: 14, fontFamily: "Inter_500Medium" },
  txMeta: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  txAmount: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  emptyState: { alignItems: "center", paddingVertical: 24, gap: 8 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
});
