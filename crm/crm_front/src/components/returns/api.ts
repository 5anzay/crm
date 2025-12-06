// src/components/returns/api.ts
import type { Return, } from "./types";
import { getCsrfToken } from "../customers/csrf";

const API_URL = "/api/returns/";

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

// CRUD functions
export const fetchReturns = async (): Promise<Return[]> => {
  const res = await fetch(API_URL, fetchOptions("GET"));
  return handleResponse(res);
};

export const createReturn = async (data: Omit<Return, "id" | "total_refund">): Promise<Return> => {
  const res = await fetch(API_URL, fetchOptions("POST", data));
  return handleResponse(res);
};

export const updateReturn = async (id: number, data: Omit<Return, "id" | "total_refund">): Promise<Return> => {
  const res = await fetch(`${API_URL}${id}/`, fetchOptions("PUT", data));
  return handleResponse(res);
};

export const deleteReturn = async (id: number): Promise<void> => {
  const res = await fetch(`${API_URL}${id}/`, fetchOptions("DELETE"));
  if (!res.ok) throw new Error("Failed to delete return");
};
