import { useColorScheme } from "react-native";
import { useApp } from "@/context/AppContext";
import { AppColors } from "@/constants/colors";

export function useTheme() {
  const systemScheme = useColorScheme();
  const { settings } = useApp();

  const isDark =
    settings.theme === "dark" ||
    (settings.theme === "system" && systemScheme === "dark");

  const colors = isDark ? AppColors.dark : AppColors.light;

  return {
    isDark,
    colors,
    primary: AppColors.primary,
    primaryLight: AppColors.primaryLight,
    teal: AppColors.teal,
    income: AppColors.income,
    expense: AppColors.expense,
    toGive: AppColors.toGive,
    toReceive: AppColors.toReceive,
  };
}
