// src/components/dashboard/api.ts
import { getCsrfToken } from "../customers/csrf";

const API_URL = "http://localhost:8000/api/dashboard/";

const handleResponse = async (res: Response) => {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Request failed");
  }
  return res.json();
};

const fetchOptions = (method: string, body?: any) => ({
  method,
  headers: {
    "Content-Type": "application/json",
    "X-CSRFToken": getCsrfToken(),
  },
  credentials: "include" as RequestCredentials,
  body: body ? JSON.stringify(body) : undefined,
});

export const fetchDashboardData = async () => {
  const res = await fetch(API_URL, fetchOptions("GET"));
  return handleResponse(res);
};
