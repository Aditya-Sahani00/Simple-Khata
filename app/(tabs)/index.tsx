import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Platform,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useApp, Period } from "@/context/AppContext";
import { useTheme } from "@/hooks/useTheme";
import { formatAmount } from "@/components/CurrencyText";
import BarChart from "@/components/BarChart";
import { formatDateShort } from "@/utils/nepali-date";

const PERIODS: { label: string; value: Period }[] = [
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Yearly", value: "yearly" },
];

function SummaryCard({
  title,
  amount,
  icon,
  color,
  onPress,
  currency,
}: {
  title: string;
  amount: number;
  icon: string;
  color: string;
  onPress?: () => void;
  currency: string;
}) {
  const { colors, isDark } = useTheme();
  return (
    <TouchableOpacity
      style={[styles.summaryCard, { backgroundColor: colors.card }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.summaryIconBg, { backgroundColor: color + "20" }]}>
        <Ionicons name={icon as any} size={18} color={color} />
      </View>
      <Text style={[styles.summaryTitle, { color: colors.textSecondary }]} numberOfLines={1}>
        {title}
      </Text>
      <Text style={[styles.summaryAmount, { color: colors.text }]} numberOfLines={1}>
        {currency} {formatAmount(Math.abs(amount), true)}
      </Text>
    </TouchableOpacity>
  );
}

function TransactionRow({ t, accounts, useBS, currency }: any) {
  const { colors } = useTheme();
  const account = accounts.find((a: any) => a.id === t.accountId);
  const isIncome = t.type === "income";

  return (
    <View style={[styles.txRow, { borderBottomColor: colors.divider }]}>
      <View style={[styles.txIcon, { backgroundColor: (isIncome ? "#00C853" : "#F44336") + "20" }]}>
        <Ionicons
          name={isIncome ? "arrow-down" : "arrow-up"}
          size={16}
          color={isIncome ? "#00C853" : "#F44336"}
        />
      </View>
      <View style={styles.txInfo}>
        <Text style={[styles.txDesc, { color: colors.text }]} numberOfLines={1}>
          {t.description || t.categoryId}
        </Text>
        <Text style={[styles.txMeta, { color: colors.textMuted }]}>
          {account?.name || "Unknown"} · {formatDateShort(t.date, useBS)}
        </Text>
      </View>
      <Text style={[styles.txAmount, { color: isIncome ? "#00C853" : "#F44336" }]}>
        {isIncome ? "+" : "-"}{currency} {formatAmount(t.amount, true)}
      </Text>
    </View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark, primary } = useTheme();
  const {
    settings,
    totalBalance,
    totalIncome,
    totalExpense,
    totalToGive,
    totalToReceive,
    transactions,
    accounts,
    activeProfile,
    updateSettings,
  } = useApp();

  const currency = settings.currency || "NPR";
  const useBS = settings.dateFormat === "BS";
  const [chartPeriod, setChartPeriod] = useState<Period>(settings.period);

  const income = totalIncome(settings.period);
  const expense = totalExpense(settings.period);

  // Build chart data
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
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
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
    // yearly - last 5 years
    const years: { label: string; income: number; expense: number }[] = [];
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
    () => [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5),
    [transactions]
  );

  const handleAddTransaction = (type: "income" | "expense") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({ pathname: "/modal/transaction", params: { type } });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      {/* Header */}
      <LinearGradient
        colors={["#1565C0", "#0D47A1"]}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>Simple Khata</Text>
            <Text style={styles.profileName}>{activeProfile?.name || "Personal"}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => router.push("/accounts/index")}
            >
              <Ionicons name="wallet-outline" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Balance */}
        <View style={styles.balanceBox}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <TouchableOpacity onPress={() => router.push("/accounts/index")}>
            <Text style={styles.balanceAmount}>
              {currency} {formatAmount(totalBalance)}
            </Text>
          </TouchableOpacity>
          <Text style={styles.balanceSub}>Tap to view all accounts</Text>
        </View>

        {/* Period selector */}
        <View style={styles.periodRow}>
          {PERIODS.map(p => (
            <TouchableOpacity
              key={p.value}
              style={[styles.periodBtn, settings.period === p.value && styles.periodBtnActive]}
              onPress={() => {
                updateSettings({ period: p.value });
                setChartPeriod(p.value);
              }}
            >
              <Text style={[styles.periodText, settings.period === p.value && styles.periodTextActive]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Cards */}
        <View style={styles.cardsGrid}>
          <SummaryCard
            title="Income"
            amount={income}
            icon="arrow-down-circle"
            color="#00C853"
            currency={currency}
          />
          <SummaryCard
            title="Expense"
            amount={expense}
            icon="arrow-up-circle"
            color="#F44336"
            currency={currency}
          />
          <SummaryCard
            title="To Receive"
            amount={totalToReceive}
            icon="time"
            color="#1565C0"
            currency={currency}
            onPress={() => router.push("/(tabs)/parties")}
          />
          <SummaryCard
            title="To Give"
            amount={totalToGive}
            icon="alert-circle"
            color="#FF6F00"
            currency={currency}
            onPress={() => router.push("/(tabs)/parties")}
          />
        </View>

        {/* Quick Actions */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: "#00C853" + "15", borderColor: "#00C853" + "40" }]}
              onPress={() => handleAddTransaction("income")}
            >
              <View style={[styles.actionIcon, { backgroundColor: "#00C853" }]}>
                <Ionicons name="add" size={20} color="#fff" />
              </View>
              <Text style={[styles.actionText, { color: "#00C853" }]}>Cash In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: "#F44336" + "15", borderColor: "#F44336" + "40" }]}
              onPress={() => handleAddTransaction("expense")}
            >
              <View style={[styles.actionIcon, { backgroundColor: "#F44336" }]}>
                <Ionicons name="remove" size={20} color="#fff" />
              </View>
              <Text style={[styles.actionText, { color: "#F44336" }]}>Cash Out</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: "#FF6F00" + "15", borderColor: "#FF6F00" + "40" }]}
              onPress={() => router.push({ pathname: "/modal/party-entry", params: { entryType: "to_give" } })}
            >
              <View style={[styles.actionIcon, { backgroundColor: "#FF6F00" }]}>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </View>
              <Text style={[styles.actionText, { color: "#FF6F00" }]}>To Give</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: "#1565C0" + "15", borderColor: "#1565C0" + "40" }]}
              onPress={() => router.push({ pathname: "/modal/party-entry", params: { entryType: "to_receive" } })}
            >
              <View style={[styles.actionIcon, { backgroundColor: "#1565C0" }]}>
                <Ionicons name="arrow-back" size={20} color="#fff" />
              </View>
              <Text style={[styles.actionText, { color: "#1565C0" }]}>To Receive</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Chart */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Cash Flow</Text>
            <View style={styles.chartPeriodRow}>
              {PERIODS.map(p => (
                <TouchableOpacity
                  key={p.value}
                  style={[styles.chartPeriodBtn, chartPeriod === p.value && { backgroundColor: primary + "20" }]}
                  onPress={() => setChartPeriod(p.value)}
                >
                  <Text style={[styles.chartPeriodText, { color: chartPeriod === p.value ? primary : colors.textMuted }]}>
                    {p.label.slice(0, 1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <BarChart data={chartData} isDark={isDark} />
        </View>

        {/* Recent Transactions */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/transactions")}>
              <Text style={[styles.seeAll, { color: primary }]}>See All</Text>
            </TouchableOpacity>
          </View>
          {recentTxs.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={40} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>No transactions yet</Text>
            </View>
          ) : (
            recentTxs.map(t => (
              <TransactionRow key={t.id} t={t} accounts={accounts} useBS={useBS} currency={currency} />
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
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  greeting: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
  },
  profileName: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.75)",
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  balanceBox: {
    alignItems: "center",
    paddingVertical: 12,
  },
  balanceLabel: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.75)",
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 36,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
  },
  balanceSub: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.5)",
    marginTop: 4,
  },
  periodRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 20,
    padding: 3,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 17,
    alignItems: "center",
  },
  periodBtnActive: {
    backgroundColor: "#FFFFFF",
  },
  periodText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.8)",
  },
  periodTextActive: {
    color: "#1565C0",
  },
  cardsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    padding: 16,
    paddingBottom: 0,
  },
  summaryCard: {
    width: "47%",
    borderRadius: 14,
    padding: 14,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryTitle: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  summaryAmount: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  section: {
    margin: 16,
    marginBottom: 0,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 12,
  },
  seeAll: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  quickActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    alignItems: "center",
    gap: 6,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
  chartPeriodRow: {
    flexDirection: "row",
    gap: 4,
  },
  chartPeriodBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  chartPeriodText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  txIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  txInfo: { flex: 1 },
  txDesc: { fontSize: 14, fontFamily: "Inter_500Medium" },
  txMeta: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  txAmount: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  emptyState: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
});
