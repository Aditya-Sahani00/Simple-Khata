# Simple Khata - Offline Financial Ledger App

## Overview
A complete Nepali offline financial app inspired by the Karobar app, built with Expo React Native. All data is stored locally on-device using AsyncStorage — no internet required.

## Tech Stack
- **Frontend**: Expo Router (file-based routing), React Native
- **State Management**: React Context + AsyncStorage (fully offline)
- **UI**: Inter fonts, LinearGradient, expo-haptics, react-native-svg for charts
- **Backend**: Express.js (minimal, serves landing page only)
- **Platform**: iOS, Android, Web

## App Features
1. **Home Screen**: Total balance, Income/Expense/To Give/To Receive summary cards, Quick Actions (Cash In/Out/To Give/To Receive), Bar chart for cash flow, Recent transactions
2. **Transactions**: List with search/filter (income/expense), Add/Edit/Delete, Categories, Account tracking
3. **Parties/Ledger**: Person/Business parties, To Give/To Receive entries, Settle/Delete entries, Per-party history
4. **Accounts**: Cash (default), Bank, Wallet accounts with Add/Edit/Delete, Balance management, Gradient cards
5. **Profile**: Multiple profiles (Personal, Business, Shop, Other), Theme toggle (Light/Dark/System), Date format (BS/AD)

## Key Architecture Decisions
- **All data in AsyncStorage** - No server needed for app data
- **AppContext** provides unified state for profiles, accounts, transactions, parties, partyEntries, settings
- **Nepali Date (BS)** conversion built-in with lookup table for years 2075–2086
- **Profile-scoped data** - Each profile has its own accounts, transactions, parties
- **Balance tracking** - Account balances auto-update when transactions are added/edited/deleted

## File Structure
```
app/
  _layout.tsx              # Root layout with providers
  (tabs)/
    _layout.tsx            # Tab bar (NativeTabs on iOS 26+, Classic on Android/Web)
    index.tsx              # Home screen
    transactions.tsx       # Transactions list
    parties.tsx            # Parties/Ledger
    profile.tsx            # Profile & Settings
  accounts/
    index.tsx              # All accounts screen
  party/
    [id].tsx               # Party detail (entry history)
  modal/
    transaction.tsx        # Add/Edit transaction (formSheet)
    account.tsx            # Add/Edit account (formSheet)
    party.tsx              # Add/Edit party (formSheet)
    party-entry.tsx        # Add/Edit party entry (formSheet)
    profile.tsx            # Add profile (formSheet)
context/
  AppContext.tsx           # Main app state & CRUD operations
hooks/
  useTheme.ts              # Theme hook (respects light/dark/system setting)
utils/
  nepali-date.ts           # BS/AD date conversion
  categories.ts            # Transaction categories with icons/colors
  storage.ts               # AsyncStorage helpers
constants/
  colors.ts                # App color palette (Blue/Teal)
components/
  BarChart.tsx             # Custom SVG bar chart
  CurrencyText.tsx         # Currency formatter
  ErrorBoundary.tsx        # Error boundary
  ErrorFallback.tsx        # Error fallback UI
```

## Color Palette
- Primary: #1565C0 (Deep Blue)
- Teal: #00897B (Income/Success)
- Income: #00C853 (Green)
- Expense: #F44336 (Red)
- To Give: #FF6F00 (Orange)
- To Receive: #1565C0 (Blue)

## Running
- Backend: `npm run server:dev` (port 5000)
- Frontend: `npm run expo:dev` (port 8081)
