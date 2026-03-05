import React from "react";
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
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useApp, Account } from "@/context/AppContext";
import { useTheme } from "@/hooks/useTheme";
import { formatAmount } from "@/components/CurrencyText";

const ACCOUNT_CONFIG = {
  cash: { icon: "cash", gradient: ["#1565C0", "#0D47A1"] as [string, string] },
  bank: { icon: "card", gradient: ["#00897B", "#00695C"] as [string, string] },
  wallet: { icon: "wallet", gradient: ["#7B1FA2", "#4A148C"] as [string, string] },
};

function AccountCard({
  account, onTap, onEdit, onDelete, currency,
}: {
  account: Account; onTap: () => void; onEdit: () => void;
  onDelete: () => void; currency: string;
}) {
  const config = ACCOUNT_CONFIG[account.type];

  return (
    <TouchableOpacity
      onPress={onTap}
      activeOpacity={0.88}
      style={styles.cardTouchable}
    >
      <LinearGradient
        colors={config.gradient}
        style={styles.accountCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.cardTop}>
          <View style={styles.cardIconBox}>
            <Ionicons name={config.icon as any} size={22} color="#fff" />
          </View>
          <View style={styles.cardBadge}>
            <Text style={styles.cardTypeBadge}>{account.type.toUpperCase()}</Text>
          </View>
          <View style={styles.cardActions}>
            <TouchableOpacity
              style={styles.cardBtn}
              onPress={(e) => { e.stopPropagation(); onEdit(); }}
            >
              <Ionicons name="pencil" size={15} color="rgba(255,255,255,0.9)" />
            </TouchableOpacity>
            {!account.isDefault && (
              <TouchableOpacity
                style={styles.cardBtn}
                onPress={(e) => { e.stopPropagation(); onDelete(); }}
              >
                <Ionicons name="trash" size={15} color="rgba(255,255,255,0.9)" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.cardBottom}>
          <Text style={styles.cardAccountName}>{account.name}</Text>
          {account.holderName ? (
            <Text style={styles.cardHolderName}>{account.holderName}</Text>
          ) : null}
          {account.bankName ? (
            <Text style={styles.cardBankName}>{account.bankName}</Text>
          ) : null}
          {account.accountNumber ? (
            <Text style={styles.cardAccountNum}>···· {account.accountNumber.slice(-4)}</Text>
          ) : null}
          <Text style={styles.cardBalance}>
            {currency} {formatAmount(account.balance)}
          </Text>
          {account.isDefault ? (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultText}>Default</Text>
            </View>
          ) : null}
        </View>

        {/* Tap hint */}
        <View style={styles.tapHint}>
          <Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.5)" />
          <Text style={styles.tapHintText}>Tap for history</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

export default function AccountsTab() {
  const insets = useSafeAreaInsets();
  const { colors, primary } = useTheme();
  const { accounts, deleteAccount, totalBalance, settings } = useApp();
  const currency = settings.currency || "NPR";
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const handleDelete = (acc: Account) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Delete Account",
      `Delete "${acc.name}"? Linked transactions will remain.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteAccount(acc.id) },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8, backgroundColor: colors.surface }]}>
        <Text style={[styles.title, { color: colors.text }]}>Accounts</Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: primary }]}
          onPress={() => router.push("/modal/account")}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Total Balance Banner */}
      <LinearGradient
        colors={["#1565C0", "#00897B"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.totalBanner}
      >
        <Ionicons name="wallet" size={28} color="rgba(255,255,255,0.8)" />
        <View>
          <Text style={styles.totalLabel}>Total Balance</Text>
          <Text style={styles.totalAmount}>{currency} {formatAmount(totalBalance)}</Text>
        </View>
        <View style={styles.totalRight}>
          <Text style={styles.accountCount}>
            {accounts.length} {accounts.length === 1 ? "Account" : "Accounts"}
          </Text>
        </View>
      </LinearGradient>

      {/* Quick Add Row */}
      <View style={[styles.quickAddRow, { backgroundColor: colors.surface }]}>
        {(["cash", "bank", "wallet"] as const).map(type => {
          const config = ACCOUNT_CONFIG[type];
          const count = accounts.filter(a => a.type === type).length;
          return (
            <TouchableOpacity
              key={type}
              style={[styles.quickAddCard, { backgroundColor: colors.background }]}
              onPress={() =>
                router.push({ pathname: "/modal/account", params: { prefillType: type } })
              }
            >
              <LinearGradient colors={config.gradient} style={styles.quickAddIcon}>
                <Ionicons name={config.icon as any} size={18} color="#fff" />
              </LinearGradient>
              <Text style={[styles.quickAddLabel, { color: colors.text }]}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
              <Text style={[styles.quickAddCount, { color: colors.textMuted }]}>{count}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={accounts}
        keyExtractor={item => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: Platform.OS === "ios" ? 100 : 80 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="wallet-outline" size={64} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Accounts</Text>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              Add your cash, bank, or wallet accounts
            </Text>
            <TouchableOpacity
              style={[styles.emptyBtn, { backgroundColor: primary }]}
              onPress={() => router.push("/modal/account")}
            >
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={styles.emptyBtnText}>Add Account</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <AccountCard
            account={item}
            onTap={() =>
              router.push({ pathname: "/account/[id]", params: { id: item.id } })
            }
            onEdit={() =>
              router.push({ pathname: "/modal/account", params: { id: item.id } })
            }
            onDelete={() => handleDelete(item)}
            currency={currency}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", paddingHorizontal: 16, paddingBottom: 12,
  },
  title: { fontSize: 24, fontFamily: "Inter_700Bold" },
  addBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  totalBanner: {
    margin: 16, marginBottom: 0, borderRadius: 16, padding: 18,
    flexDirection: "row", alignItems: "center", gap: 14,
  },
  totalLabel: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.75)" },
  totalAmount: { fontSize: 26, fontFamily: "Inter_700Bold", color: "#fff" },
  totalRight: { marginLeft: "auto" },
  accountCount: {
    fontSize: 13, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.8)",
    backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  quickAddRow: {
    flexDirection: "row", margin: 16, marginBottom: 8,
    borderRadius: 14, padding: 12, gap: 8,
  },
  quickAddCard: {
    flex: 1, alignItems: "center", gap: 6, borderRadius: 12, padding: 12,
  },
  quickAddIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  quickAddLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  quickAddCount: { fontSize: 11, fontFamily: "Inter_400Regular" },
  list: { padding: 16, paddingTop: 8 },
  cardTouchable: { borderRadius: 20, overflow: "hidden" },
  accountCard: {
    borderRadius: 20, padding: 20, minHeight: 180,
    justifyContent: "space-between",
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 12, elevation: 6,
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  cardIconBox: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  cardBadge: { flex: 1, paddingLeft: 10 },
  cardTypeBadge: { fontSize: 10, fontFamily: "Inter_700Bold", color: "rgba(255,255,255,0.5)", letterSpacing: 1 },
  cardActions: { flexDirection: "row", gap: 8 },
  cardBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  cardBottom: { gap: 3 },
  cardAccountName: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#fff" },
  cardHolderName: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.8)" },
  cardBankName: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.7)" },
  cardAccountNum: { fontSize: 13, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.6)", letterSpacing: 2 },
  cardBalance: { fontSize: 26, fontFamily: "Inter_700Bold", color: "#fff", marginTop: 8 },
  defaultBadge: {
    alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3, marginTop: 4,
  },
  defaultText: { fontSize: 11, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.9)" },
  tapHint: {
    position: "absolute", bottom: 12, right: 16,
    flexDirection: "row", alignItems: "center", gap: 4,
  },
  tapHintText: { fontSize: 10, color: "rgba(255,255,255,0.4)", fontFamily: "Inter_400Regular" },
  emptyState: { alignItems: "center", paddingTop: 60, gap: 14, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  emptyBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderRadius: 14, paddingHorizontal: 24, paddingVertical: 14, marginTop: 8,
  },
  emptyBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
