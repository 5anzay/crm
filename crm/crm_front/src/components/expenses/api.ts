// src/components/expenses/api.ts
import type { Expense } from "./types";
import { getCsrfToken } from "../customers/csrf"; // reuse your csrf function

const API_URL = "http://localhost:8000/api/expenses/";

// Handle fetch response
const handleResponse = async (res: Response) => {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Request failed");
  }
  return res.json();
};

// Build fetch options
const fetchOptions = (method: string, body?: any): RequestInit => {
  const options: RequestInit = {
    method,
    headers: { "Content-Type": "application/json", "X-CSRFToken": getCsrfToken() },
    credentials: "include",
  };
  if (body && method !== "GET") options.body = JSON.stringify(body);
  return options;
};

// Get all expenses
export const fetchExpenses = async (): Promise<Expense[]> => {
  const res = await fetch(API_URL, fetchOptions("GET"));
  return handleResponse(res);
};

// Create a new expense
export const createExpense = async (data: Omit<Expense, "id">) => {
  // Ensure amount is a number and date is valid
  const payload = {
    ...data,
    amount: Number(data.amount),
    date: data.date || new Date().toISOString().split("T")[0], // default to today
  };
  const res = await fetch(API_URL, fetchOptions("POST", payload));
  return handleResponse(res);
};

// Update an existing expense
export const updateExpense = async (id: number, data: Omit<Expense, "id">) => {
  const payload = {
    ...data,
    amount: Number(data.amount),
    date: data.date || new Date().toISOString().split("T")[0],
  };
  const res = await fetch(`${API_URL}${id}/`, fetchOptions("PUT", payload));
  return handleResponse(res);
};

// Delete an expense
export const deleteExpense = async (id: number) => {
  const res = await fetch(`${API_URL}${id}/`, fetchOptions("DELETE"));
  if (!res.ok) throw new Error("Failed to delete expense");
};
