import React from "react";
import { Text, TextStyle } from "react-native";
import { useApp } from "@/context/AppContext";

interface Props {
  amount: number;
  style?: TextStyle | TextStyle[];
  showSign?: boolean;
  colored?: boolean;
  compact?: boolean;
}

export function formatAmount(amount: number, compact = false): string {
  const abs = Math.abs(amount);
  if (compact) {
    if (abs >= 100000) return (abs / 100000).toFixed(1) + "L";
    if (abs >= 1000) return (abs / 1000).toFixed(1) + "K";
  }
  return abs.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export default function CurrencyText({ amount, style, showSign = false, colored = false, compact = false }: Props) {
  const { settings } = useApp();
  const currency = settings.currency || "NPR";
  const sign = amount >= 0 ? (showSign ? "+" : "") : "-";
  const color = colored ? (amount >= 0 ? "#00C853" : "#F44336") : undefined;

  return (
    <Text style={[style, color ? { color } : undefined]}>
      {sign}{currency} {formatAmount(amount, compact)}
    </Text>
  );
}
