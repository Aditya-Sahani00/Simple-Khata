import AsyncStorage from "@react-native-async-storage/async-storage";

// Enhanced error logging (can be connected to a monitoring service)
const logError = (context: string, error: any) => {
  console.error(`[Storage Error - ${context}]:`, error);
  // TODO: Send to error tracking service (e.g., Sentry)
};

export async function loadData<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch (error) {
    logError(`loadData(${key})`, error);
    return fallback;
  }
}

export async function saveData<T>(key: string, data: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    logError(`saveData(${key})`, error);
  }
}

export async function removeData(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    logError(`removeData(${key})`, error);
  }
}

// Consolidated storage keys - all strings mapped here to avoid duplicates
export const STORAGE_KEYS = {
  // Profiles
  PROFILES: "sk_profiles",
  ACTIVE_PROFILE: "sk_active_profile",
  
  // Accounts
  ACCOUNTS: "sk_accounts",
  
  // Transactions
  TRANSACTIONS: "sk_transactions",
  DELETED_TRANSACTIONS: "sk_deleted_transactions",
  
  // Parties
  PARTIES: "sk_parties",
  PARTY_ENTRIES: "sk_party_entries",
  DELETED_PARTY_ENTRIES: "sk_deleted_party_entries",
  
  // Settings & Security
  SETTINGS: "sk_settings",
  APP_LOCK: "sk_app_lock",
  HAS_LOGGED_IN: "sk_has_logged_in",
  
  // Other
  NOTES: "sk_notes",
  REVIEWED_NOTIFICATIONS: "sk_reviewed_notifications",
  
  // Data Sync
  SYNC_TIMESTAMP: "sk_sync_timestamp",
  PENDING_SYNCS: "sk_pending_syncs",

  // Categories
  CATEGORIES: "sk_categories",
};

// Validate storage key exists (helps catch typos at compile time)
export function getStorageKey(key: keyof typeof STORAGE_KEYS): string {
  return STORAGE_KEYS[key];
}
