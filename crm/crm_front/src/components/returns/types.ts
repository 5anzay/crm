export interface ReturnItem {
  id?: number;          // optional, assigned by backend
  sale_item?: number;   // optional, reference to sale item if needed
  product?: number;     // product ID only, optional when not selected
  product_name?: string; // always string, used for display
  quantity: number;     // must be number
  unit_price: number;   // must be number
}


export interface Return {
  id?: number;                 // optional, assigned by backend
  sale: number | null;         // sale ID, required in form
  customer?: number | null;    // optional
  date?: string;               // optional
  nepal_date?: string;         // optional
  comment?: string;            // optional
  items: ReturnItem[];         // array of items, required
  total_refund?: number;       // optional, calculated on backend
  invoice_number?: string;     // optional, used for display in table
  customer_name?: string;      // optional, used for display in table
}
