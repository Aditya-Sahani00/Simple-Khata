import AsyncStorage from "@react-native-async-storage/async-storage";

export async function loadData<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function saveData<T>(key: string, data: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error("Storage save error:", e);
  }
}

export async function removeData(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (e) {
    console.error("Storage remove error:", e);
  }
}

export const STORAGE_KEYS = {
  PROFILES: "sk_profiles",
  ACTIVE_PROFILE: "sk_active_profile",
  ACCOUNTS: "sk_accounts",
  TRANSACTIONS: "sk_transactions",
  PARTIES: "sk_parties",
  SETTINGS: "sk_settings",
};
