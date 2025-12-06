// src/components/products/types.ts

export interface Product {
  id: number;
  name: string;
  category?: string;
  price: number;
  cost_price: number; // new field
  stock: number;
  description?: string;
}
