export interface CustomerPayment {
  id: number;
  customer: number;
  customer_display?: string;
  amount: number;
  date?: string;
  comment?: string;
  nepal_date?: string;
  receipt_number?: string; // optional, like SupplierPayment
}
