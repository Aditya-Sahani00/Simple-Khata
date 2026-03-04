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
  wallet: { icon: "wallet", gradient: ["#7B1FA2", "#6A1B9A"] as [string, string] },
};

function AccountCard({ account, onEdit, onDelete, currency }: {
  account: Account;
  onEdit: () => void;
  onDelete: () => void;
  currency: string;
}) {
  const { colors } = useTheme();
  const config = ACCOUNT_CONFIG[account.type];

  return (
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
        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.cardBtn} onPress={onEdit}>
            <Ionicons name="pencil" size={16} color="rgba(255,255,255,0.9)" />
          </TouchableOpacity>
          {!account.isDefault && (
            <TouchableOpacity style={styles.cardBtn} onPress={onDelete}>
              <Ionicons name="trash" size={16} color="rgba(255,255,255,0.9)" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      <View style={styles.cardBottom}>
        <Text style={styles.cardAccountName}>{account.name}</Text>
        {account.holderName && (
          <Text style={styles.cardHolderName}>{account.holderName}</Text>
        )}
        {account.bankName && (
          <Text style={styles.cardBankName}>{account.bankName}</Text>
        )}
        <Text style={styles.cardBalance}>
          {currency} {formatAmount(account.balance)}
        </Text>
        <Text style={styles.cardType}>
          {account.type.charAt(0).toUpperCase() + account.type.slice(1)}
          {account.isDefault ? " · Default" : ""}
        </Text>
      </View>
    </LinearGradient>
  );
}

export default function AccountsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, primary } = useTheme();
  const { accounts, deleteAccount, totalBalance, settings } = useApp();
  const currency = settings.currency || "NPR";
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const handleDelete = (acc: Account) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Delete Account", `Delete "${acc.name}"? This won't remove associated transactions.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteAccount(acc.id) },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8, backgroundColor: colors.surface }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Accounts</Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: primary }]}
          onPress={() => router.push("/modal/account")}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Total */}
      <LinearGradient
        colors={["#1565C0", "#00897B"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.totalBanner}
      >
        <Text style={styles.totalLabel}>Total Balance</Text>
        <Text style={styles.totalAmount}>{currency} {formatAmount(totalBalance)}</Text>
        <Text style={styles.totalSub}>{accounts.length} account{accounts.length !== 1 ? "s" : ""}</Text>
      </LinearGradient>

      <FlatList
        data={accounts}
        keyExtractor={item => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: Platform.OS === "ios" ? 100 : 80 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="wallet-outline" size={56} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Accounts</Text>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              Add accounts to track your money across different sources
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <AccountCard
            account={item}
            onEdit={() => router.push({ pathname: "/modal/account", params: { id: item.id } })}
            onDelete={() => handleDelete(item)}
            currency={currency}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
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
    paddingBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  totalBanner: {
    margin: 16,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    gap: 4,
  },
  totalLabel: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.75)",
  },
  totalAmount: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  totalSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.6)",
  },
  list: {
    padding: 16,
    paddingTop: 0,
  },
  accountCard: {
    borderRadius: 20,
    padding: 20,
    minHeight: 160,
    justifyContent: "space-between",
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardActions: {
    flexDirection: "row",
    gap: 8,
  },
  cardBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardBottom: {
    gap: 2,
  },
  cardAccountName: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  cardHolderName: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.8)",
  },
  cardBankName: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.7)",
  },
  cardBalance: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    marginTop: 8,
  },
  cardType: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.6)",
    marginTop: 2,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 60,
    gap: 12,
    paddingHorizontal: 40,
  },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
});
