// src/components/reports/reportService.ts
import type {
  ReportType,
  ProductReportItem,
  SalesReport,
  PurchaseReport,
  CustomerReportItem,
  SupplierReportItem,
  ExpenseReport,
} from "./types";
import { getCsrfToken } from "../customers/csrf";

const API_URL = "/api/reports/";

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

// ----------------- JSON Reports -----------------
export const fetchReport = async (
  type: ReportType,
  month?: number,
  year?: number
): Promise<
  | ProductReportItem[]
  | SalesReport
  | PurchaseReport
  | CustomerReportItem[]
  | SupplierReportItem[]
  | ExpenseReport
> => {
  const params = new URLSearchParams();
  if (type) params.append("type", type);
  if (month) params.append("month", month.toString());
  if (year) params.append("year", year.toString());

  const res = await fetch(`${API_URL}?${params.toString()}`, fetchOptions("GET"));
  return handleResponse(res);
};

// ----------------- Download PDF -----------------
export const downloadReportPDF = async (
  type: ReportType,
  month?: number,
  year?: number
) => {
  const params = new URLSearchParams();
  if (type) params.append("type", type);
  if (month) params.append("month", month.toString());
  if (year) params.append("year", year.toString());

  const res = await fetch(`${API_URL}download/?${params.toString()}`, {
    method: "GET",
    headers: { "X-CSRFToken": getCsrfToken() },
    credentials: "include",
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "Failed to download PDF");
    throw new Error(errorText || "Failed to download PDF");
  }

  const blob = await res.blob();
  return blob;
};
