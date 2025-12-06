import type { Customer } from "./types";
import { getCsrfToken } from "./csrf";

const API_URL = "/api/customers/";

const handleResponse = async (res: Response) => {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Request failed");
  }
  return res.json();
};

const fetchOptions = (method: string, body?: any) => ({
  method,
  headers: { "Content-Type": "application/json", "X-CSRFToken": getCsrfToken() },
  credentials: "include" as RequestCredentials,
  body: body ? JSON.stringify(body) : undefined,
});

export const fetchCustomers = async (): Promise<Customer[]> => {
  const res = await fetch(API_URL, fetchOptions("GET"));
  return handleResponse(res);
};

export const createCustomer = async (data: Omit<Customer, "id">) => {
  const res = await fetch(API_URL, fetchOptions("POST", data));
  return handleResponse(res);
};

export const updateCustomer = async (id: number, data: Omit<Customer, "id">) => {
  const res = await fetch(`${API_URL}${id}/`, fetchOptions("PUT", data));
  return handleResponse(res);
};

export const deleteCustomer = async (id: number) => {
  const res = await fetch(`${API_URL}${id}/`, fetchOptions("DELETE"));
  if (!res.ok) throw new Error("Failed to delete customer");
};
