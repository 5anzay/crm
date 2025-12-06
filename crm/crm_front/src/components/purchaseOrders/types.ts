export interface POItem {
  id?: number;
  product?: number;
  product_name?: string; // for new products
  quantity: number;
  cost_price: number;
}

export interface PurchaseOrder {
  id?: number;
  invoice_number: string;
  supplier: number;
  supplier_name?: string;
  supplier_display:string;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  date?: string;  // text field
  nepal_date?:string;
  comment?: string; // new field
  items: POItem[];
}
