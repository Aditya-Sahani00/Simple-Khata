import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { loadData, saveData, STORAGE_KEYS } from "@/utils/storage";
import { todayString } from "@/utils/nepali-date";
import { Category, CATEGORIES as DEFAULT_CATEGORIES } from "@/utils/categories";

export type AccountType = "cash" | "bank" | "wallet";

export interface Account {
  id: string;
  profileId: string;
  name: string;
  type: AccountType;
  bankName?: string;
  holderName?: string;
  accountNumber?: string;
  balance: number;
  isDefault?: boolean;
  createdAt: string;
}

export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  profileId: string;
  accountId: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  description: string;
  partyId?: string;
  date: string;
  createdAt: string;
}

export type PartyType = "person" | "business";

export interface Party {
  id: string;
  profileId: string;
  name: string;
  phone?: string;
  type: PartyType;
  createdAt: string;
}

export interface PartyEntry {
  id: string;
  profileId: string;
  partyId: string;
  accountId: string;
  entryType: "to_give" | "to_receive";
  amount: number;
  description: string;
  date: string;
  settled: boolean;
  createdAt: string;
}

export interface Note {
  id: string;
  profileId: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Profile {
  id: string;
  name: string;
  type: "personal" | "business" | "shop" | "other";
  icon: string;
  createdAt: string;
}

export type ThemeMode = "light" | "dark" | "system";
export type DateFormat = "BS" | "AD";
export type Period = "weekly" | "monthly" | "yearly";
export type AmountFormat = "compact" | "full";
export type CurrencyOption = "NPR" | "Rs." | "INR" | "$";

export interface AppSettings {
  theme: ThemeMode;
  dateFormat: DateFormat;
  period: Period;
  currency: string;
  amountFormat: AmountFormat;
  appLockEnabled: boolean;
}

export interface AppLock {
  pin: string;
  enabled: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: "system",
  dateFormat: "BS",
  period: "monthly",
  currency: "NPR",
  amountFormat: "full",
  appLockEnabled: false,
};

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

interface AppContextValue {
  // Profiles
  profiles: Profile[];
  activeProfileId: string;
  activeProfile: Profile | null;
  addProfile: (p: Omit<Profile, "id" | "createdAt">) => void;
  editProfile: (id: string, p: Partial<Profile>) => void;
  deleteProfile: (id: string) => void;
  setActiveProfile: (id: string) => void;

  // Accounts
  accounts: Account[];
  addAccount: (a: Omit<Account, "id" | "createdAt" | "profileId">) => void;
  editAccount: (id: string, a: Partial<Account>) => void;
  deleteAccount: (id: string) => void;

  // Parties
  parties: Party[];
  addParty: (p: Omit<Party, "id" | "createdAt" | "profileId">) => void;
  editParty: (id: string, p: Partial<Party>) => void;
  deleteParty: (id: string) => void;

  // Party Entries
  partyEntries: PartyEntry[];
  deletedPartyEntries: (PartyEntry & { deletedAt: string })[];
  addPartyEntry: (e: Omit<PartyEntry, "id" | "createdAt" | "profileId">) => void;
  editPartyEntry: (id: string, e: Partial<PartyEntry>) => void;
  deletePartyEntry: (id: string) => void;
  restorePartyEntry: (id: string) => void;
  permanentDeletePartyEntry: (id: string) => void;
  settlePartyEntry: (id: string) => void;

  // Transactions
  transactions: Transaction[];
  deletedTransactions: (Transaction & { deletedAt: string })[];
  addTransaction: (t: Omit<Transaction, "id" | "createdAt" | "profileId">) => void;
  editTransaction: (id: string, t: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  restoreTransaction: (id: string) => void;
  permanentDeleteTransaction: (id: string) => void;

  // Categories
  categories: Category[];
  addCategory: (c: Omit<Category, "id">) => void;

  // Settings
  settings: AppSettings;
  updateSettings: (s: Partial<AppSettings>) => void;

  // Derived
  totalBalance: number;
  totalIncome: (period: Period) => number;
  totalExpense: (period: Period) => number;
  totalToGive: number;
  totalToReceive: number;
  isLoaded: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

const DEFAULT_PROFILE: Profile = {
  id: "default",
  name: "Personal",
  type: "personal",
  icon: "person",
  createdAt: new Date().toISOString(),
};

const DEFAULT_CASH_ACCOUNT: Account = {
  id: "cash_default",
  profileId: "default",
  name: "Cash",
  type: "cash",
  balance: 0,
  isDefault: true,
  createdAt: new Date().toISOString(),
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] = useState<Profile[]>([DEFAULT_PROFILE]);
  const [activeProfileId, setActiveProfileId] = useState("default");
  const [accounts, setAccounts] = useState<Account[]>([DEFAULT_CASH_ACCOUNT]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [deletedTransactions, setDeletedTransactions] = useState<(Transaction & { deletedAt: string })[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [partyEntries, setPartyEntries] = useState<PartyEntry[]>([]);
  const [deletedPartyEntries, setDeletedPartyEntries] = useState<(PartyEntry & { deletedAt: string })[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [p, api, acc, txs, deletedTxs, pts, pe, deletedPE, cats, s] = await Promise.all([
          loadData(STORAGE_KEYS.PROFILES, [DEFAULT_PROFILE]),
          loadData(STORAGE_KEYS.ACTIVE_PROFILE, "default"),
          loadData(STORAGE_KEYS.ACCOUNTS, [DEFAULT_CASH_ACCOUNT]),
          loadData(STORAGE_KEYS.TRANSACTIONS, []),
          loadData(STORAGE_KEYS.DELETED_TRANSACTIONS, []),
          loadData(STORAGE_KEYS.PARTIES, []),
          loadData(STORAGE_KEYS.PARTY_ENTRIES, []),
          loadData(STORAGE_KEYS.DELETED_PARTY_ENTRIES, []),
          loadData(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES),
          loadData(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS),
        ]);
        setProfiles(p as Profile[]);
        setActiveProfileId(api as string);
        setAccounts(acc as Account[]);
        setTransactions(txs as Transaction[]);
        setDeletedTransactions(deletedTxs as (Transaction & { deletedAt: string })[]);
        setParties(pts as Party[]);
        setPartyEntries(pe as PartyEntry[]);
        setDeletedPartyEntries(deletedPE as (PartyEntry & { deletedAt: string })[]);
        setCategories(cats as Category[]);
        setSettings(s as AppSettings);
        setIsLoaded(true);
      } catch (error) {
        console.error("Failed to load app data:", error);
        // Use defaults if loading fails
        setProfiles([DEFAULT_PROFILE]);
        setActiveProfileId("default");
        setAccounts([DEFAULT_CASH_ACCOUNT]);
        setIsLoaded(true);
      }
    };
    load();
  }, []);

  // Persist on change
  useEffect(() => { if (isLoaded) saveData(STORAGE_KEYS.PROFILES, profiles); }, [profiles, isLoaded]);
  useEffect(() => { if (isLoaded) saveData(STORAGE_KEYS.ACTIVE_PROFILE, activeProfileId); }, [activeProfileId, isLoaded]);
  useEffect(() => { if (isLoaded) saveData(STORAGE_KEYS.ACCOUNTS, accounts); }, [accounts, isLoaded]);
  useEffect(() => { if (isLoaded) saveData(STORAGE_KEYS.TRANSACTIONS, transactions); }, [transactions, isLoaded]);
  useEffect(() => { if (isLoaded) saveData(STORAGE_KEYS.PARTIES, parties); }, [parties, isLoaded]);
  useEffect(() => { if (isLoaded) saveData(STORAGE_KEYS.PARTY_ENTRIES, partyEntries); }, [partyEntries, isLoaded]);
  useEffect(() => { if (isLoaded) saveData(STORAGE_KEYS.DELETED_PARTY_ENTRIES, deletedPartyEntries); }, [deletedPartyEntries, isLoaded]);
  useEffect(() => { if (isLoaded) saveData(STORAGE_KEYS.DELETED_TRANSACTIONS, deletedTransactions); }, [deletedTransactions, isLoaded]);
  useEffect(() => { if (isLoaded) saveData(STORAGE_KEYS.CATEGORIES, categories); }, [categories, isLoaded]);
  useEffect(() => { if (isLoaded) saveData(STORAGE_KEYS.SETTINGS, settings); }, [settings, isLoaded]);

  const activeProfile = useMemo(
    () => profiles.find(p => p.id === activeProfileId) || profiles[0] || null,
    [profiles, activeProfileId]
  );

  // Profile-scoped data
  const profileAccounts = useMemo(
    () => accounts.filter(a => a.profileId === activeProfileId),
    [accounts, activeProfileId]
  );
  const profileTransactions = useMemo(
    () => transactions.filter(t => t.profileId === activeProfileId),
    [transactions, activeProfileId]
  );
  const profileParties = useMemo(
    () => parties.filter(p => p.profileId === activeProfileId),
    [parties, activeProfileId]
  );
  const profilePartyEntries = useMemo(
    () => partyEntries.filter(e => e.profileId === activeProfileId),
    [partyEntries, activeProfileId]
  );

  // Profile CRUD
  const addProfile = useCallback((p: Omit<Profile, "id" | "createdAt">) => {
    const newP: Profile = { ...p, id: generateId(), createdAt: new Date().toISOString() };
    setProfiles(prev => [...prev, newP]);
    // Add default cash account
    const cashAcc: Account = {
      id: generateId(),
      profileId: newP.id,
      name: "Cash",
      type: "cash",
      balance: 0,
      isDefault: true,
      createdAt: new Date().toISOString(),
    };
    setAccounts(prev => [...prev, cashAcc]);
    setActiveProfileId(newP.id);
  }, []);

  const editProfile = useCallback((id: string, p: Partial<Profile>) => {
    setProfiles(prev => prev.map(x => x.id === id ? { ...x, ...p } : x));
  }, []);

  const deleteProfile = useCallback((id: string) => {
    if (profiles.length <= 1) return;
    setProfiles(prev => {
      const filtered = prev.filter(x => x.id !== id);
      return filtered;
    });
    setAccounts(prev => prev.filter(a => a.profileId !== id));
    setTransactions(prev => prev.filter(t => t.profileId !== id));
    setParties(prev => prev.filter(p => p.profileId !== id));
    setPartyEntries(prev => prev.filter(e => e.profileId !== id));
    setActiveProfileId(prev => prev === id ? profiles.find(p => p.id !== id)?.id || "default" : prev);
  }, [profiles]);

  const setActiveProfile = useCallback((id: string) => {
    setActiveProfileId(id);
  }, []);

  // Account CRUD
  const addAccount = useCallback((a: Omit<Account, "id" | "createdAt" | "profileId">) => {
    const newA: Account = {
      ...a,
      id: generateId(),
      profileId: activeProfileId,
      createdAt: new Date().toISOString(),
    };
    setAccounts(prev => [...prev, newA]);
  }, [activeProfileId]);

  const editAccount = useCallback((id: string, a: Partial<Account>) => {
    setAccounts(prev => prev.map(x => x.id === id ? { ...x, ...a } : x));
  }, []);

  const deleteAccount = useCallback((id: string) => {
    setAccounts(prev => prev.filter(x => x.id !== id));
  }, []);

  // Transaction CRUD
  const addCategory = useCallback((c: Omit<Category, "id">) => {
    const newCat: Category = {
      ...c,
      id: `${c.type}_${c.name.toLowerCase().replace(/\s+/g, "_")}_${Date.now()}`,
    };
    setCategories(prev => [...prev, newCat]);
  }, []);

  const addTransaction = useCallback((t: Omit<Transaction, "id" | "createdAt" | "profileId">) => {
    const newT: Transaction = {
      ...t,
      id: generateId(),
      profileId: activeProfileId,
      createdAt: new Date().toISOString(),
    };
    setTransactions(prev => [newT, ...prev]);
    // Update account balance
    setAccounts(prev => prev.map(a => {
      if (a.id === t.accountId) {
        const delta = t.type === "income" ? t.amount : -t.amount;
        return { ...a, balance: a.balance + delta };
      }
      return a;
    }));
  }, [activeProfileId]);

  const editTransaction = useCallback((id: string, t: Partial<Transaction>) => {
    setTransactions(prev => {
      const old = prev.find(x => x.id === id);
      if (!old) return prev;
      // Reverse old balance effect
      setAccounts(accs => accs.map(a => {
        if (a.id === old.accountId) {
          const reverseDelta = old.type === "income" ? -old.amount : old.amount;
          return { ...a, balance: a.balance + reverseDelta };
        }
        return a;
      }));
      // Apply new balance effect
      const updated = { ...old, ...t };
      setAccounts(accs => accs.map(a => {
        if (a.id === updated.accountId) {
          const delta = updated.type === "income" ? updated.amount : -updated.amount;
          return { ...a, balance: a.balance + delta };
        }
        return a;
      }));
      return prev.map(x => x.id === id ? updated : x);
    });
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions(prev => {
      const t = prev.find(x => x.id === id);
      if (t) {
        setAccounts(accs => accs.map(a => {
          if (a.id === t.accountId) {
            const reverseDelta = t.type === "income" ? -t.amount : t.amount;
            return { ...a, balance: a.balance + reverseDelta };
          }
          return a;
        }));
        setDeletedTransactions(prevDeleted => [{ ...t, deletedAt: new Date().toISOString() }, ...prevDeleted]);
      }
      return prev.filter(x => x.id !== id);
    });
  }, []);

  const restoreTransaction = useCallback((id: string) => {
    setDeletedTransactions(prev => {
      const found = prev.find(x => x.id === id);
      if (!found) return prev;
      setTransactions(txPrev => [found, ...txPrev]);
      setAccounts(accs => accs.map(a => {
        if (a.id === found.accountId) {
          const delta = found.type === "income" ? found.amount : -found.amount;
          return { ...a, balance: a.balance + delta };
        }
        return a;
      }));
      return prev.filter(x => x.id !== id);
    });
  }, []);

  const permanentDeleteTransaction = useCallback((id: string) => {
    setDeletedTransactions(prev => prev.filter(x => x.id !== id));
  }, []);

  // Party CRUD
  const addParty = useCallback((p: Omit<Party, "id" | "createdAt" | "profileId">) => {
    const newP: Party = {
      ...p,
      id: generateId(),
      profileId: activeProfileId,
      createdAt: new Date().toISOString(),
    };
    setParties(prev => [...prev, newP]);
  }, [activeProfileId]);

  const editParty = useCallback((id: string, p: Partial<Party>) => {
    setParties(prev => prev.map(x => x.id === id ? { ...x, ...p } : x));
  }, []);

  const deleteParty = useCallback((id: string) => {
    setParties(prev => prev.filter(x => x.id !== id));
    setPartyEntries(prev => prev.filter(e => e.partyId !== id));
  }, []);

  // Party Entry CRUD
  const addPartyEntry = useCallback((e: Omit<PartyEntry, "id" | "createdAt" | "profileId">) => {
    const newE: PartyEntry = {
      ...e,
      id: generateId(),
      profileId: activeProfileId,
      createdAt: new Date().toISOString(),
    };
    setPartyEntries(prev => [newE, ...prev]);
  }, [activeProfileId]);

  const editPartyEntry = useCallback((id: string, e: Partial<PartyEntry>) => {
    setPartyEntries(prev => prev.map(x => x.id === id ? { ...x, ...e } : x));
  }, []);

  const deletePartyEntry = useCallback((id: string) => {
    setPartyEntries(prev => {
      const found = prev.find(x => x.id === id);
      if (found) {
        setDeletedPartyEntries(prevDeleted => [{ ...found, deletedAt: new Date().toISOString() }, ...prevDeleted]);
      }
      return prev.filter(x => x.id !== id);
    });
  }, []);

  const restorePartyEntry = useCallback((id: string) => {
    setDeletedPartyEntries(prev => {
      const found = prev.find(x => x.id === id);
      if (!found) return prev;
      setPartyEntries(entries => [found, ...entries]);
      return prev.filter(x => x.id !== id);
    });
  }, []);

  const permanentDeletePartyEntry = useCallback((id: string) => {
    setDeletedPartyEntries(prev => prev.filter(x => x.id !== id));
  }, []);

  const settlePartyEntry = useCallback((id: string) => {
    setPartyEntries(prev => {
      const entry = prev.find(e => e.id === id);
      if (!entry || entry.settled) return prev;
      // If not already settled, settle and create a corresponding transaction
      if (entry.entryType === "to_receive") {
        const partyLabel = entry.description || "Received from party";
        const newTx = {
          id: generateId(),
          profileId: entry.profileId,
          accountId: entry.accountId,
          type: "income" as const,
          amount: entry.amount,
          categoryId: "business",
          description: `Payment In · ${partyLabel}`,
          partyId: entry.partyId,
          date: entry.date,
          createdAt: new Date().toISOString(),
        };
        setTransactions(t => [newTx, ...t]);
        setAccounts(accs => accs.map(a =>
          a.id === entry.accountId ? { ...a, balance: a.balance + entry.amount } : a
        ));
      } else {
        const partyLabel = entry.description || "Paid to party";
        const newTx = {
          id: generateId(),
          profileId: entry.profileId,
          accountId: entry.accountId,
          type: "expense" as const,
          amount: entry.amount,
          categoryId: "other",
          description: `Payment Out · ${partyLabel}`,
          partyId: entry.partyId,
          date: entry.date,
          createdAt: new Date().toISOString(),
        };
        setTransactions(t => [newTx, ...t]);
        setAccounts(accs => accs.map(a =>
          a.id === entry.accountId ? { ...a, balance: a.balance - entry.amount } : a
        ));
      }
      return prev.map(x => x.id === id ? { ...x, settled: true } : x);
    });
  }, []);

  const updateSettings = useCallback((s: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...s }));
  }, []);

  // Derived values
  const totalBalance = useMemo(
    () => profileAccounts.reduce((sum, a) => sum + a.balance, 0),
    [profileAccounts]
  );

  const getPeriodStart = useCallback((period: Period): Date => {
    const now = new Date();
    if (period === "weekly") {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      return new Date(now.setDate(diff));
    }
    if (period === "monthly") {
      return new Date(now.getFullYear(), now.getMonth(), 1);
    }
    if (period === "yearly") {
      return new Date(now.getFullYear(), 0, 1);
    }
    return new Date(0);
  }, []);

  const totalIncome = useCallback((period: Period) => {
    const start = getPeriodStart(period);
    return profileTransactions
      .filter(t => t.type === "income" && new Date(t.date) >= start)
      .reduce((sum, t) => sum + t.amount, 0);
  }, [profileTransactions, getPeriodStart]);

  const totalExpense = useCallback((period: Period) => {
    const start = getPeriodStart(period);
    return profileTransactions
      .filter(t => t.type === "expense" && new Date(t.date) >= start)
      .reduce((sum, t) => sum + t.amount, 0);
  }, [profileTransactions, getPeriodStart]);

  const totalToGive = useMemo(
    () => profilePartyEntries
      .filter(e => e.entryType === "to_give" && !e.settled)
      .reduce((sum, e) => sum + e.amount, 0),
    [profilePartyEntries]
  );

  const totalToReceive = useMemo(
    () => profilePartyEntries
      .filter(e => e.entryType === "to_receive" && !e.settled)
      .reduce((sum, e) => sum + e.amount, 0),
    [profilePartyEntries]
  );

  const value = useMemo<AppContextValue>(() => ({
    profiles,
    activeProfileId,
    activeProfile,
    addProfile,
    editProfile,
    deleteProfile,
    setActiveProfile,
    accounts: profileAccounts,
    addAccount,
    editAccount,
    deleteAccount,
    transactions: profileTransactions,
    deletedTransactions,
    addTransaction,
    editTransaction,
    deleteTransaction,
    restoreTransaction,
    permanentDeleteTransaction,
    parties: profileParties,
    addParty,
    editParty,
    deleteParty,
    partyEntries: profilePartyEntries,
    deletedPartyEntries,
    addPartyEntry,
    editPartyEntry,
    deletePartyEntry,
    restorePartyEntry,
    permanentDeletePartyEntry,
    settlePartyEntry,
    settings,
    updateSettings,
    categories,
    addCategory,
    totalBalance,
    totalIncome,
    totalExpense,
    totalToGive,
    totalToReceive,
    isLoaded,
  }), [
    profiles, activeProfileId, activeProfile,
    addProfile, editProfile, deleteProfile, setActiveProfile,
    profileAccounts, addAccount, editAccount, deleteAccount,
    profileTransactions, deletedTransactions, addTransaction, editTransaction, deleteTransaction, restoreTransaction, permanentDeleteTransaction,
    profileParties, addParty, editParty, deleteParty,
    profilePartyEntries, deletedPartyEntries, addPartyEntry, editPartyEntry, deletePartyEntry, restorePartyEntry, permanentDeletePartyEntry, settlePartyEntry,
    settings, updateSettings,
    totalBalance, totalIncome, totalExpense, totalToGive, totalToReceive,
    isLoaded,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
