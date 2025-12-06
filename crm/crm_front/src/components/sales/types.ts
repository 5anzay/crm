


export interface SaleItem {
  id?: number;
  product?: number | null;       // FK to Product
  product_name?: string | null;  // optional name override
  quantity: number;              // required
  unit_price: number;            // required
}

export interface Sale {
  id?: number;
  invoice_number?: string;        // required
  customer?: number | null;      // FK to Customer
  customer_display?: string;     // read-only from serializer
  total_amount?: number;         // calculated
  paid_amount: number;           // required
  remaining_amount?: number;     // calculated
  date?: string;                 // "YYYY-MM-DD"
  items: SaleItem[];             // required array of SaleItem
  invoice_pdf?: string | null;   // optional
  comment?: string;              // optional, you updated backend
  nepal_date?: string;           // optional, you updated backend
}
