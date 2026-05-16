/**
 * Comprehensive CRUD operations for all app entities
 * Includes validation and error handling
 */

import { Transaction, Account, Party, PartyEntry } from "@/context/AppContext";
import { STORAGE_KEYS } from "./storage";

// Validation schemas
export const ValidationRules = {
  transaction: {
    validateAmount: (amount: number) => {
      if (!amount || amount <= 0) return { valid: false, error: "Amount must be positive" };
      if (amount > 1000000000) return { valid: false, error: "Amount too large" };
      return { valid: true };
    },
    validateDescription: (desc: string) => {
      if (!desc || desc.trim().length === 0) return { valid: false, error: "Description required" };
      if (desc.length > 500) return { valid: false, error: "Description too long (max 500 chars)" };
      return { valid: true };
    },
  },

  account: {
    validateName: (name: string) => {
      if (!name || name.trim().length === 0) return { valid: false, error: "Account name required" };
      if (name.length > 50) return { valid: false, error: "Account name too long (max 50 chars)" };
      return { valid: true };
    },
    validateBalance: (balance: number) => {
      if (typeof balance !== "number" || isNaN(balance)) return { valid: false, error: "Invalid balance" };
      if (balance < -1000000000) return { valid: false, error: "Balance too negative" };
      return { valid: true };
    },
  },

  party: {
    validateName: (name: string) => {
      if (!name || name.trim().length === 0) return { valid: false, error: "Party name required" };
      if (name.length > 100) return { valid: false, error: "Party name too long (max 100 chars)" };
      return { valid: true };
    },
    validatePhone: (phone?: string) => {
      if (!phone) return { valid: true }; // Optional field
      if (phone.length < 5 || phone.length > 20) return { valid: false, error: "Invalid phone number" };
      return { valid: true };
    },
  },

  partyEntry: {
    validateAmount: (amount: number) => {
      if (!amount || amount <= 0) return { valid: false, error: "Amount must be positive" };
      if (amount > 1000000000) return { valid: false, error: "Amount too large" };
      return { valid: true };
    },
    validateDescription: (desc: string) => {
      if (!desc || desc.trim().length === 0) return { valid: false, error: "Description required" };
      if (desc.length > 500) return { valid: false, error: "Description too long (max 500 chars)" };
      return { valid: true };
    },
  },
};

// CRUD Result types
export interface CRUDResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

// Transaction CRUD
export const TransactionCRUD = {
  validate: (tx: Partial<Transaction>) => {
    const errors: string[] = [];
    
    if (tx.amount !== undefined) {
      const amtCheck = ValidationRules.transaction.validateAmount(tx.amount);
      if (!amtCheck.valid) errors.push(amtCheck.error || "Invalid amount");
    }
    
    if (tx.description !== undefined) {
      const descCheck = ValidationRules.transaction.validateDescription(tx.description);
      if (!descCheck.valid) errors.push(descCheck.error || "Invalid description");
    }
    
    if (!tx.type || !["income", "expense"].includes(tx.type)) {
      errors.push("Invalid transaction type");
    }
    
    if (!tx.categoryId) errors.push("Category required");
    if (!tx.accountId) errors.push("Account required");
    if (!tx.date) errors.push("Date required");
    
    return { valid: errors.length === 0, errors };
  },

  validateForUpdate: (tx: Partial<Transaction>) => {
    const errors: string[] = [];
    
    if (tx.amount !== undefined) {
      const amtCheck = ValidationRules.transaction.validateAmount(tx.amount);
      if (!amtCheck.valid) errors.push(amtCheck.error || "Invalid amount");
    }
    
    if (tx.description !== undefined) {
      const descCheck = ValidationRules.transaction.validateDescription(tx.description);
      if (!descCheck.valid) errors.push(descCheck.error || "Invalid description");
    }
    
    if (tx.type && !["income", "expense"].includes(tx.type)) {
      errors.push("Invalid transaction type");
    }
    
    return { valid: errors.length === 0, errors };
  },
};

// Account CRUD
export const AccountCRUD = {
  validate: (acc: Partial<Account>) => {
    const errors: string[] = [];
    
    if (!acc.name) {
      const nameCheck = ValidationRules.account.validateName(acc.name || "");
      if (!nameCheck.valid) errors.push(nameCheck.error || "Account name required");
    }
    
    if (acc.balance !== undefined) {
      const balCheck = ValidationRules.account.validateBalance(acc.balance);
      if (!balCheck.valid) errors.push(balCheck.error || "Invalid balance");
    }
    
    if (!acc.type || !["cash", "bank", "wallet"].includes(acc.type)) {
      errors.push("Invalid account type");
    }
    
    return { valid: errors.length === 0, errors };
  },
};

// Party CRUD
export const PartyCRUD = {
  validate: (party: Partial<Party>) => {
    const errors: string[] = [];
    
    if (!party.name) {
      const nameCheck = ValidationRules.party.validateName(party.name || "");
      if (!nameCheck.valid) errors.push(nameCheck.error || "Party name required");
    }
    
    if (party.phone !== undefined) {
      const phoneCheck = ValidationRules.party.validatePhone(party.phone);
      if (!phoneCheck.valid) errors.push(phoneCheck.error || "Invalid phone number");
    }
    
    if (!party.type || !["person", "business"].includes(party.type)) {
      errors.push("Invalid party type");
    }
    
    return { valid: errors.length === 0, errors };
  },
};

// PartyEntry CRUD
export const PartyEntryCRUD = {
  validate: (entry: Partial<PartyEntry>) => {
    const errors: string[] = [];
    
    if (entry.amount !== undefined) {
      const amtCheck = ValidationRules.partyEntry.validateAmount(entry.amount);
      if (!amtCheck.valid) errors.push(amtCheck.error || "Invalid amount");
    }
    
    if (entry.description !== undefined) {
      const descCheck = ValidationRules.partyEntry.validateDescription(entry.description);
      if (!descCheck.valid) errors.push(descCheck.error || "Invalid description");
    }
    
    if (!entry.partyId) errors.push("Party required");
    if (!entry.accountId) errors.push("Account required");
    if (!entry.entryType || !["to_give", "to_receive"].includes(entry.entryType)) {
      errors.push("Invalid entry type");
    }
    if (!entry.date) errors.push("Date required");
    
    return { valid: errors.length === 0, errors };
  },

  validateForUpdate: (entry: Partial<PartyEntry>) => {
    const errors: string[] = [];
    
    if (entry.amount !== undefined) {
      const amtCheck = ValidationRules.partyEntry.validateAmount(entry.amount);
      if (!amtCheck.valid) errors.push(amtCheck.error || "Invalid amount");
    }
    
    if (entry.description !== undefined) {
      const descCheck = ValidationRules.partyEntry.validateDescription(entry.description);
      if (!descCheck.valid) errors.push(descCheck.error || "Invalid description");
    }
    
    return { valid: errors.length === 0, errors };
  },
};

// Export all validation modules
export default {
  Transaction: TransactionCRUD,
  Account: AccountCRUD,
  Party: PartyCRUD,
  PartyEntry: PartyEntryCRUD,
};
