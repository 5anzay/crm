// src/components/supplierPayments/api.ts
import axios from "axios";
import type { SupplierPayment } from "./types";

const API_URL = "/api/supplier-payments/";

export const fetchPayments = async (): Promise<SupplierPayment[]> => {
  const res = await axios.get(API_URL);
  return res.data;
};

export const createPayment = async (data: Omit<SupplierPayment, "id" | "created_at">) => {
  const res = await axios.post(API_URL, data);
  return res.data;
};

export const updatePayment = async (id: number, data: any) => {
  const res = await axios.put(`${API_URL}${id}/`, data);
  return res.data;
};

export const deletePayment = async (id: number) => {
  const res = await axios.delete(`${API_URL}${id}/`);
  return res.data;
};
