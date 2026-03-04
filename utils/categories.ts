export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: "income" | "expense" | "both";
}

export const CATEGORIES: Category[] = [
  // Income
  { id: "salary", name: "Salary", icon: "briefcase", color: "#1565C0", type: "income" },
  { id: "business", name: "Business", icon: "storefront", color: "#00897B", type: "income" },
  { id: "freelance", name: "Freelance", icon: "laptop", color: "#7B1FA2", type: "income" },
  { id: "investment", name: "Investment", icon: "trending-up", color: "#2E7D32", type: "income" },
  { id: "rent_in", name: "Rent Received", icon: "home", color: "#0097A7", type: "income" },
  { id: "gift_in", name: "Gift Received", icon: "gift", color: "#C2185B", type: "income" },
  // Expense
  { id: "food", name: "Food", icon: "restaurant", color: "#E64A19", type: "expense" },
  { id: "transport", name: "Transport", icon: "car", color: "#1976D2", type: "expense" },
  { id: "shopping", name: "Shopping", icon: "bag", color: "#8E24AA", type: "expense" },
  { id: "health", name: "Health", icon: "medical", color: "#D32F2F", type: "expense" },
  { id: "education", name: "Education", icon: "school", color: "#0288D1", type: "expense" },
  { id: "rent_out", name: "Rent", icon: "home", color: "#F57C00", type: "expense" },
  { id: "utilities", name: "Utilities", icon: "flash", color: "#FFC107", type: "expense" },
  { id: "entertainment", name: "Entertainment", icon: "film", color: "#7C4DFF", type: "expense" },
  { id: "clothing", name: "Clothing", icon: "shirt", color: "#00BCD4", type: "expense" },
  { id: "personal", name: "Personal", icon: "person", color: "#607D8B", type: "expense" },
  // Both
  { id: "loan", name: "Loan", icon: "swap-horizontal", color: "#FF6F00", type: "both" },
  { id: "other", name: "Other", icon: "ellipsis-horizontal", color: "#78909C", type: "both" },
];

export function getCategoryById(id: string): Category {
  return CATEGORIES.find(c => c.id === id) || CATEGORIES[CATEGORIES.length - 1];
}

export function getCategoriesByType(type: "income" | "expense"): Category[] {
  return CATEGORIES.filter(c => c.type === type || c.type === "both");
}
