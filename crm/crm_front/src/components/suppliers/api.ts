import axios from "axios";
import type { Supplier } from "./types";

const API_URL = "/api/suppliers/";

export const fetchSuppliers = async (): Promise<Supplier[]> => {
  const response = await axios.get(API_URL);
  return response.data;
};

export const createSupplier = async (data: Omit<Supplier, "id">) => {
  const response = await axios.post(API_URL, data);
  return response.data;
};

export const updateSupplier = async (id: number, data: Omit<Supplier, "id">) => {
  const response = await axios.put(`${API_URL}${id}/`, data);
  return response.data;
};

export const deleteSupplier = async (id: number) => {
  await axios.delete(`${API_URL}${id}/`);
};
