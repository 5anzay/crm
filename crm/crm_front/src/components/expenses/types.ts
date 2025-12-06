// src/components/expenses/types.ts
export interface Expense {
  id: number;
  category: string;
  amount: number;
  date?: string;
  nepal_date?: string;
  notes?: string;
}
