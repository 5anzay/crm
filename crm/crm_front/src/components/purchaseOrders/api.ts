// src/components/purchaseOrders/api.ts
import axios from "axios";
import type { PurchaseOrder } from "./types";

const API_URL = "/api/purchase-orders/";

export const fetchPOs = async (): Promise<PurchaseOrder[]> => {
  const res = await axios.get(API_URL);
  return res.data;
};

export const createPO = async (data: Omit<PurchaseOrder, "id" | "remaining_amount" | "total_amount">) => {
  const res = await axios.post(API_URL, data);
  return res.data;
};

export const updatePO = async (id: number, data: any) => {
  const res = await axios.put(`${API_URL}${id}/`, data);
  return res.data;
};
export const deletePO = async (id: number) => {
  const res = await axios.delete(`${API_URL}${id}/`);
  return res.data;
};
