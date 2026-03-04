const PRIMARY = "#1565C0";
const PRIMARY_LIGHT = "#1976D2";
const PRIMARY_DARK = "#0D47A1";
const TEAL = "#00897B";
const TEAL_LIGHT = "#00ACC1";
const INCOME = "#00C853";
const EXPENSE = "#F44336";
const TO_GIVE = "#FF6F00";
const TO_RECEIVE = "#1565C0";

export const AppColors = {
  primary: PRIMARY,
  primaryLight: PRIMARY_LIGHT,
  primaryDark: PRIMARY_DARK,
  teal: TEAL,
  tealLight: TEAL_LIGHT,
  income: INCOME,
  expense: EXPENSE,
  toGive: TO_GIVE,
  toReceive: TO_RECEIVE,

  light: {
    background: "#F0F4F8",
    surface: "#FFFFFF",
    surfaceSecondary: "#F5F7FA",
    card: "#FFFFFF",
    text: "#0D1B2A",
    textSecondary: "#546E7A",
    textMuted: "#90A4AE",
    border: "#E0E7EF",
    divider: "#ECF0F5",
    tabBar: "#FFFFFF",
    header: "#1565C0",
    headerText: "#FFFFFF",
    inputBg: "#F0F4F8",
    shadow: "rgba(13, 27, 42, 0.08)",
  },

  dark: {
    background: "#0A1628",
    surface: "#0F2040",
    surfaceSecondary: "#132850",
    card: "#0F2040",
    text: "#E8F0FE",
    textSecondary: "#90CAF9",
    textMuted: "#546E7A",
    border: "#1A3050",
    divider: "#1A3050",
    tabBar: "#0A1628",
    header: "#0A1628",
    headerText: "#E8F0FE",
    inputBg: "#132850",
    shadow: "rgba(0, 0, 0, 0.4)",
  },
};

export default {
  light: {
    text: AppColors.light.text,
    background: AppColors.light.background,
    tint: PRIMARY,
    tabIconDefault: "#90A4AE",
    tabIconSelected: PRIMARY,
  },
};
