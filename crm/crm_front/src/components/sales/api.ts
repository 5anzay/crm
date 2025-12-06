// src/components/sales/api.ts
import axios from "axios";
import type { Sale } from "./types";

const API_URL = "/api/sales/";

export const fetchSales = async (): Promise<Sale[]> => {
  const res = await axios.get(API_URL);
  return res.data;
};

export const createSale = async (data: Sale): Promise<Sale> => {
  const res = await axios.post(API_URL, data);
  return res.data;
};

export const updateSale = async (id: number, data: Sale): Promise<Sale> => {
  const res = await axios.put(`${API_URL}${id}/`, data);
  return res.data;
};

export const deleteSale = async (id: number): Promise<void> => {
  await axios.delete(`${API_URL}${id}/`);
};
