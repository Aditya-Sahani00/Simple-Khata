# Simple Khata — Codebase Map & Change Log

## What This App Is
An offline Nepali financial ledger app (inspired by Karobar). All data lives in AsyncStorage — no network needed.

---

## Tech Stack
| Layer | Tech |
|---|---|
| Framework | Expo 54, Expo Router 6 (file-based routing) |
| UI | React Native, LinearGradient, expo-haptics, react-native-svg |
| State | React Context (`AppContext`) + AsyncStorage |
| Fonts | Inter (400/500/600/700) via expo-google-fonts |
| Keyboard | react-native-keyboard-controller (`KeyboardAwareScrollView`) |
| Backend | Express.js (serves landing page only — no app data) |

---

## File Structure

```
app/
  _layout.tsx                   # Root layout: providers (QueryClient, SafeArea, AppProvider, Keyboard)
  (tabs)/
    _layout.tsx                 # Bottom tab bar: Home, Transactions, Parties, Accounts, More
    index.tsx                   # Home screen (Karobar-style dark UI)
    transactions.tsx            # All transactions list with search + filter
    parties.tsx                 # Parties list (to give / to receive summary)
    accounts.tsx                # Accounts tab: cash/bank/wallet gradient cards
    profile.tsx                 # Settings: theme, currency, date format, profiles
  modal/
    transaction.tsx             # Add/edit transaction (income or expense)
    account.tsx                 # Add/edit account (cash/bank/wallet)
    party.tsx                   # Add/edit party (person or business)
    party-entry.tsx             # Add/edit to-give / to-receive entry
    profile.tsx                 # Add/edit profile
    filter-history.tsx          # (NEW) Filtered history: income | expense | to_receive | to_give
    notifications.tsx           # (NEW) In-app notifications / activity log
  account/
    [id].tsx                    # (NEW) Account-specific transaction history
  party/
    [id].tsx                    # Party detail: entries, settle, add entry

context/
  AppContext.tsx                # Single source of truth for all data
    Types exported: Account, AccountType, Transaction, TransactionType,
                    Party, PartyType, PartyEntry, Profile, AppSettings,
                    Period, ThemeMode, DateFormat
    Context provides: accounts, transactions, parties, partyEntries, profiles,
                      settings, activeProfile, totalBalance, totalIncome(period),
                      totalExpense(period), totalToGive, totalToReceive
                      + all CRUD functions

components/
  BarChart.tsx                  # SVG bar chart (income vs expense per period)
  CurrencyText.tsx              # formatAmount() helper
  KeyboardAwareScrollViewCompat.tsx  # Wraps KeyboardAwareScrollView (native) or ScrollView (web)
  ErrorBoundary.tsx / ErrorFallback.tsx

hooks/
  useTheme.ts                   # Returns { isDark, colors, primary, income, expense, toGive, toReceive }

utils/
  categories.ts                 # getCategoryById(), getCategoriesByType()
  nepali-date.ts                # BS/AD conversion, formatDate(), formatDateShort(), todayString()
  storage.ts                    # AsyncStorage helpers

constants/
  colors.ts                     # AppColors.light/dark themes + semantic tokens
```

---

## Data Model (AppContext)

```ts
Account      { id, profileId, name, type(cash|bank|wallet), balance, isDefault, bankName?, holderName?, accountNumber? }
Transaction  { id, profileId, type(income|expense), amount, categoryId, accountId, description?, date, createdAt }
Party        { id, profileId, name, type(person|business), phone? }
PartyEntry   { id, profileId, partyId, accountId, entryType(to_give|to_receive), amount, description?, date, settled }
Profile      { id, name, type(personal|business|shop|other), icon }
AppSettings  { theme, currency, dateFormat(BS|AD), period(weekly|monthly|yearly) }
```

---

## Colors (constants/colors.ts)

| Token | Light | Dark |
|---|---|---|
| background | #F0F4F8 | #111111 |
| surface | #FFFFFF | #1A1A1A |
| card | #FFFFFF | #1E1E1E |
| inputBg | #F0F4F8 | #252525 |
| text | #0D1B2A | #EFEFEF |
| textSecondary | #546E7A | #AAAAAA |
| textMuted | #90A4AE | #666666 |
| Income green | #00C853 | same |
| Expense red | #F44336 | same |
| To Give orange | #FF6F00 | same |
| To Receive blue | #1565C0 | same |

---

## Change Log

### v1.0 — Initial Build
- Full CRUD: accounts, transactions, parties, party entries, profiles
- 5-tab layout, AppContext + AsyncStorage, Nepali date conversion

### v1.1 — Karobar UI Redesign
- Home: profile avatar top-left, privacy mode toggle, 2×3 summary card grid
- Shortcuts row with circular icons
- SVG Cashflow bar chart
- Dark theme updated to near-black (#111111)
- Dedicated Accounts tab (app/(tabs)/accounts.tsx)
- All summary cards made navigable (Income→add, Expense→add, ToReceive/ToGive→parties, Balance→accounts, Reports→transactions)
- Keyboard bug fix: all modals use KeyboardAwareScrollViewCompat

### v1.2 — History Screens, Account History, Input UX, Notifications (CURRENT)
- Income/Expense/ToReceive/ToGive cards open dedicated filtered history sheets
- Account cards in Accounts tab tap to show per-account transaction history
- Save button moved INSIDE scroll area (scrolls into view when keyboard opens)
- Notifications modal: in-app activity log (transaction added, account created, etc.)
- Notification badge on home header bell icon
- New routes: /modal/filter-history, /modal/notifications, /account/[id]

---

## Routing Notes
- All modals use `presentation: "formSheet"` with `sheetAllowedDetents`
- `sheetGrabberVisible: true` adds the drag handle at the top
- Deep link format for params: `router.push({ pathname: "/modal/transaction", params: { type: "income" } })`
- Account history: `router.push({ pathname: "/account/[id]", params: { id: account.id } })`

## Known Patterns
- useTheme() must be called inside AppProvider (it uses useApp internally)
- All data is profile-scoped — always filtered by activeProfileId in context
- Balance auto-adjusts when transactions are added/edited/deleted (see AppContext lines 295–345)
- KeyboardAwareScrollViewCompat: use `bottomOffset={20}` prop to add breathing room above keyboard
- Save buttons: place INSIDE the scroll area (not as a fixed footer) so keyboard doesn't hide them
