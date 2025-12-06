export interface SupplierPayment {
  id: number;
  supplier: number;
  supplier_display?:string;
  amount: number;
  date?: string;
  comment?: string;
  nepal_date?: string;
  receipt_number?: string; // add this line
}
