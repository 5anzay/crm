// src/components/report/types.ts

export type ReportType =
  | "product"
  | "sales"
  | "purchaseorder"
  | "customer"
  | "supplier"
  | "expense"
  |"return";

export interface ReportQuery {
  type: ReportType;
  month?: number;
  year?: number;
}

// Product Report
export interface ProductReportItem {
  product: string;
  sold_quantity: number;
  total_revenue: number;
  total_cost: number;
  profit: number;
  remaining_stock: number;
}

// Sales Report
export interface SalesReport {
  customer: string;
  nepal_date:String;
  invoice_number:number;
  total_sales: number;
  total_paid: number;
  total_due: number;
  sales_count: number;
}

// Purchase Order Report
export interface PurchaseReport {
  supplier:string;
  nepal_date:string;
  invoice_number:number;
  total_purchase: number;
  total_paid: number;
  total_due: number;
  purchase_count: number;
}

// Customer Report
export interface CustomerReportItem {
  customer: string;
  nepal_date:string;
  total_sales: number;
  total_paid: number;
  balance: number;
}

// Supplier Report
export interface SupplierReportItem {
  supplier: string;
  nepal_date:string;
  total_purchase: number;
  total_paid: number;
  balance: number;
}

// Expense Report
export interface ExpenseBreakdown {
  category: string;
  total: number;
  count:number;
  nepal_date:string;
}

export interface ExpenseReport {
  total_expense: number;
  breakdown: ExpenseBreakdown[];
  count:number;
}


export interface ReturnReportItem {
  date: string;
  invoice_number: string;
  customer: string;
  total_refund: number;
  comment: string;
}
