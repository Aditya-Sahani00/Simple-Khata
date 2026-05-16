# Quick Start Guide - New Features

## 🔐 PIN Security

### Setting Up App Lock with PIN
```typescript
import { hashPin, validatePinStrength } from "@/utils/pin-security";

// Validate user's PIN first
const validation = validatePinStrength("1234");
if (!validation.isValid) {
  Alert.alert("Invalid PIN", validation.error);
  return;
}

// Hash the PIN before storing
const hashedPin = await hashPin("1234");
updateSettings({ appLockEnabled: true });
saveData(STORAGE_KEYS.APP_LOCK, { pin: hashedPin, enabled: true });
```

### Verifying PIN on App Open
```typescript
import { verifyPin } from "@/utils/pin-security";

const lockData = await loadData(STORAGE_KEYS.APP_LOCK, null);
const userPin = /* get from user input */;

if (lockData && lockData.enabled) {
  const isCorrect = await verifyPin(userPin, lockData.pin);
  if (!isCorrect) {
    Alert.alert("Incorrect PIN");
    return;
  }
}
```

---

## 📊 Data Export & Import

### Export All Data to JSON
```typescript
import { exportAppData } from "@/utils/data-management";

const { profiles, accounts, transactions, ... } = useApp();

// Export function handles file picker and sharing
await exportAppData(
  profiles, 
  accounts, 
  transactions, 
  deletedTransactions,
  parties,
  partyEntries,
  deletedPartyEntries
);
```

### Import Data from File
```typescript
import { importAppData, mergeImportedData } from "@/utils/data-management";

// User picks file
const backup = await importAppData();

if (backup) {
  // Merge with existing data (preserves current + adds new)
  const merged = await mergeImportedData(backup, currentData, "merge");
  
  // Or replace all data
  const replaced = await mergeImportedData(backup, currentData, "replace");
  
  // Update app state with merged data
  setProfiles(merged.profiles);
  setAccounts(merged.accounts);
  // ... etc
}
```

---

## 🔄 Data Sync System

### Initialize Sync on App Start
```typescript
import { 
  initializeSyncState, 
  forceSyncNow, 
  SyncConfig 
} from "@/utils/data-sync";

useEffect(() => {
  const setupSync = async () => {
    const syncState = await initializeSyncState();
    
    const syncConfig: SyncConfig = {
      autoSyncOnOpen: true,
      autoSyncOnClose: true,
      syncInterval: 300000,  // 5 minutes
      enableCloudSync: false, // Enable later
    };

    // Force sync on app open
    await forceSyncNow(currentData, syncConfig, {
      onSyncStart: () => console.log("Starting sync..."),
      onSyncComplete: () => console.log("Sync complete!"),
      onSyncError: (error) => console.error(error),
    });
  };

  setupSync();
}, []);
```

### Display Sync Status
```typescript
import { getSyncStatus } from "@/utils/data-sync";

const SyncStatusBadge = () => {
  const [syncInfo, setSyncInfo] = useState(null);

  useEffect(() => {
    const checkStatus = async () => {
      const status = await getSyncStatus();
      setSyncInfo(status);
    };

    checkStatus();
    const interval = setInterval(checkStatus, 10000); // Check every 10s
    return () => clearInterval(interval);
  }, []);

  return (
    <View>
      <Text>
        Last Sync: {syncInfo?.lastSyncTime?.toLocaleString() || "Never"}
      </Text>
      {syncInfo?.hasPendingChanges && (
        <Text style={{ color: "orange" }}>Unsaved changes</Text>
      )}
    </View>
  );
};
```

---

## ✅ CRUD Operations with Validation

### Creating a Transaction Safely
```typescript
import { TransactionCRUD } from "@/utils/crud-operations";

const newTransaction: Partial<Transaction> = {
  amount: 500,
  description: "Salary payment",
  type: "income",
  categoryId: "salary",
  accountId: "cash_default",
  date: new Date().toISOString(),
};

// Validate before creating
const validation = TransactionCRUD.validate(newTransaction);

if (validation.valid) {
  addTransaction(newTransaction);
} else {
  // Show validation errors to user
  const errorMsg = validation.errors.join("\n");
  Alert.alert("Validation Error", errorMsg);
}
```

### Updating a Transaction
```typescript
const updates: Partial<Transaction> = {
  amount: 600,
  description: "Updated salary",
};

// Use updateFor validation (allows partial updates)
const validation = TransactionCRUD.validateForUpdate(updates);

if (validation.valid) {
  editTransaction(transactionId, updates);
} else {
  Alert.alert("Update Error", validation.errors.join("\n"));
}
```

### Validating Account Creation
```typescript
import { AccountCRUD } from "@/utils/crud-operations";

const newAccount: Partial<Account> = {
  name: "Primary Bank Account",
  type: "bank",
  balance: 10000,
};

const validation = AccountCRUD.validate(newAccount);
if (validation.valid) {
  addAccount(newAccount);
}
```

---

## 📈 Data Statistics & Analytics

### Get App Overview
```typescript
import { getDataStatistics } from "@/utils/data-management";

const StatsScreen = () => {
  const { transactions, accounts, parties, partyEntries } = useApp();

  const stats = useMemo(() => 
    getDataStatistics(transactions, accounts, parties, partyEntries),
    [transactions, accounts, parties, partyEntries]
  );

  return (
    <View>
      <Text>Total Balance: Rs.{stats.totalBalance}</Text>
      <Text>Total Income: Rs.{stats.totalIncome}</Text>
      <Text>Total Expense: Rs.{stats.totalExpense}</Text>
      <Text>Accounts: {stats.totalAccounts}</Text>
      <Text>Transactions: {stats.totalTransactions}</Text>
      <Text>Pending Settlements: {stats.settlableEntries}</Text>
    </View>
  );
};
```

### Validate Data Integrity
```typescript
import { validateDataIntegrity } from "@/utils/data-management";

const { transactions, accounts, partyEntries } = useApp();

const { valid, issues } = validateDataIntegrity(
  accounts,
  transactions,
  partyEntries
);

if (!valid) {
  console.warn("Data issues found:", issues);
  // Handle corrupted data
}
```

---

## 🧹 Data Cleanup

### Archive Old Transactions
```typescript
import { pruneOldTransactions } from "@/utils/data-management";

const oneYearAgo = 365;
const { kept, removed } = pruneOldTransactions(
  transactions, 
  oneYearAgo
);

Alert.alert(
  "Archive Complete",
  `Archived ${removed.length} transactions from ${oneYearAgo} days ago`
);

// Update app state with kept transactions
setTransactions(kept);
```

---

## 🛠️ Debouncing Operations

### Debounce Search Input
```typescript
import { debounce } from "@/utils/debounce";

const SearchParties = () => {
  const [search, setSearch] = useState("");
  const { parties } = useApp();

  const debouncedSearch = useMemo(
    () => debounce((query: string) => {
      if (query.length > 0) {
        setFilteredParties(
          parties.filter(p => 
            p.name.toLowerCase().includes(query.toLowerCase())
          )
        );
      } else {
        setFilteredParties(parties);
      }
    }, 500),  // Wait 500ms after user stops typing
    []
  );

  const handleSearchChange = (text: string) => {
    setSearch(text);
    debouncedSearch(text);
  };

  return (
    <TextInput
      placeholder="Search parties..."
      value={search}
      onChangeText={handleSearchChange}
    />
  );
};
```

---

## 📦 Using Consolidated Storage Keys

### Before (Error-prone)
```typescript
// Scattered hardcoded keys
await saveData("sk_deleted_transactions", deleted);
await saveData("sk_party_entries", entries);
await saveData("sk_deleted_party_entries", deletedPE);
```

### After (Type-safe)
```typescript
import { STORAGE_KEYS } from "@/utils/storage";

// Centralized keys with autocomplete
await saveData(STORAGE_KEYS.DELETED_TRANSACTIONS, deleted);
await saveData(STORAGE_KEYS.PARTY_ENTRIES, entries);
await saveData(STORAGE_KEYS.DELETED_PARTY_ENTRIES, deletedPE);
```

---

## 🚀 Implementation Checklist

### For Developers
- [ ] Review `OPTIMIZATION_GUIDE.md` for full details
- [ ] Test all CRUD validation functions
- [ ] Set up PIN hashing in app lock screen
- [ ] Add export/import UI buttons
- [ ] Display sync status in app header
- [ ] Test pagination on large datasets
- [ ] Verify error handling works

### For Users
- [ ] Set up app lock PIN (4-6 digits)
- [ ] Export data regularly for backup
- [ ] Check data statistics in analytics
- [ ] Monitor sync status
- [ ] Archive old transactions annually

---

## 🐛 Common Issues & Solutions

### Q: Why is my exported file so large?
**A:** The export includes all data including deleted items. You can prune old data first using `pruneOldTransactions()`.

### Q: Can I sync to my own server?
**A:** Yes! Set `enableCloudSync: true` and provide `cloudEndpoint` in `SyncConfig`. Then implement the actual API call in `utils/data-sync.ts`.

### Q: How do I recover from a corrupted backup?
**A:** Use `getLocalBackups()` to restore from a previous backup, or import a manually saved export file.

### Q: Is the PIN secure?
**A:** PINs are hashed with SHA-256 before storing. For production, consider using bcrypt or a dedicated security library.

---

**Happy coding! 🎉**
