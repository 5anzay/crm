// src/components/returns/ReturnTable.tsx
import React, { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Stack,
  Box,
  TextField,
  Button,
  Modal,
  Typography,
  Divider,
} from "@mui/material";
import { Trash2, Calendar, DollarSign, ChevronUp, ChevronDown, Eye, Printer } from "lucide-react";
import type { Return, ReturnItem } from "./types";

interface Props {
  returns: Return[];
  onDelete: (ret: Return) => void;
  onView: (ret: Return) => void;
  formatAmount?: (amount: string | number) => string;
}

const PRIMARY_ACCENT = "#1e3c72";
const ACCENT_LIGHT = "#4a78a9";
const ACTION_DEFAULT_COLOR = "#475569";
const ACTION_DELETE_COLOR = "#ef4444";
const ROW_ODD_BG = "#f9fafb";

type SortKey = "invoice_number" | "customer_name" | "date" | "nepal_date" | "total_refund" | "comment";
type SortOrder = "asc" | "desc";

const ReturnTable: React.FC<Props> = ({ returns, onDelete, formatAmount }) => {
  const [searchText, setSearchText] = useState("");
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [viewReturn, setViewReturn] = useState<Return | null>(null);
  const [selectedReturn, setSelectedReturn] = useState<Return | null>(null);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  const openPrintModal = (ret: Return) => {
    setSelectedReturn(ret);
    setPrintModalOpen(true);
  };

  const handlePrint = (format: "normal" | "pos") => {
    if (!selectedReturn) return;

    // Format total refund
    const totalRefund = Number(selectedReturn.total_refund ?? 0);
    const formattedTotal = isNaN(totalRefund) ? "0.00" : totalRefund.toFixed(2);

    // For POS format items
    const itemsHtmlPos = selectedReturn.items
      ?.map((item: ReturnItem) => {
        const price = Number(item.unit_price) || 0;
        const qty = Number(item.quantity) || 0;
        const subtotal = price * qty;
        return `
          <tr>
            <td>${item.product_name}</td>
            <td style="text-align:center">${qty}</td>
            <td style="text-align:right">${price.toFixed(2)}</td>
            <td style="text-align:right">${subtotal.toFixed(2)}</td>
          </tr>
        `;
      })
      .join("") || "";

    const content = `
      <html>
      <head>
        <title>Return Details</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            padding: 32px;
            max-width: 800px;
            margin: 0 auto;
          }
          h2 {
            font-size: 1.25rem;
            font-weight: 500;
            margin-bottom: 16px;
            color: #1f2937;
          }
          hr {
            border: none;
            border-top: 1px solid #e5e7eb;
            margin: 16px 0;
          }
          .info-section {
            margin-bottom: 16px;
          }
          .info-row {
            font-size: 0.875rem;
            margin-bottom: 8px;
            color: #374151;
          }
          .info-row strong {
            font-weight: 600;
          }
          .items-header {
            font-size: 1rem;
            font-weight: 600;
            margin-top: 16px;
            margin-bottom: 8px;
            color: #1f2937;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            overflow: hidden;
          }
          thead {
            background-color: #1e3c72;
          }
          th {
            padding: 12px;
            text-align: left;
            font-size: 0.875rem;
            font-weight: 600;
            color: white;
          }
          td {
            padding: 12px;
            font-size: 0.875rem;
            border-top: 1px solid #e5e7eb;
            color: #374151;
          }
          tbody tr:nth-child(odd) {
            background-color: #f9fafb;
          }
          .comment-section {
            margin-top: 16px;
            font-size: 0.875rem;
            color: #374151;
          }
          .comment-section strong {
            font-weight: 600;
          }
          ${
            format === "pos"
              ? `
            body { width: 300px; font-size: 12px; padding: 10px; }
            h2 { font-size: 16px; text-align: center; margin-bottom: 8px; }
            hr { border: none; border-top: 1px dashed #333; margin: 8px 0; }
            .total { font-weight: bold; font-size: 14px; margin-top: 8px; text-align: right; }
            .section { margin-bottom: 6px; }
            .label { font-weight: bold; }
            table td { font-size: 12px; }
          `
              : ""
          }
        </style>
      </head>
      <body>
        ${
          format === "pos"
            ? `
          <h2>RETURN RECEIPT</h2>
          <hr>
          <div class="section"><span class="label">Return ID:</span> ${selectedReturn.id}</div>
          <div class="section"><span class="label">Invoice:</span> ${selectedReturn.invoice_number}</div>
          <div class="section"><span class="label">Customer:</span> ${selectedReturn.customer_name}</div>
          <div class="section"><span class="label">Date:</span> ${selectedReturn.date}</div>
          <div class="section"><span class="label">Nepali Date:</span> ${selectedReturn.nepal_date}</div>
          <hr>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th style="text-align:center">Qty</th>
                <th style="text-align:right">Price</th>
                <th style="text-align:right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtmlPos}
            </tbody>
          </table>
          <hr>
          <div class="total"><span class="label">Total Refund:</span> $${formattedTotal}</div>
          <hr>
          <div class="section"><span class="label">Comment:</span> ${selectedReturn.comment}</div>
        `
            : `
          <h2>Return Invoice: ${selectedReturn.invoice_number}</h2>
          <hr>

          <div class="info-section">
            <div class="info-row"><strong>Customer:</strong> ${selectedReturn.customer_name ?? "-"}</div>
            <div class="info-row"><strong>Date:</strong> ${selectedReturn.date}</div>
            <div class="info-row"><strong>Nepali Date:</strong> ${selectedReturn.nepal_date ?? "-"}</div>
            <div class="info-row"><strong>Total Refund:</strong> $${formattedTotal}</div>
          </div>

          <div class="items-header">Items</div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Product</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${selectedReturn.items?.map((item: ReturnItem, idx: number) => {
                const price = Number(item.unit_price) || 0;
                const qty = Number(item.quantity) || 0;
                const total = price * qty;
                return `
                  <tr>
                    <td>${idx + 1}</td>
                    <td>${item.product_name ?? "-"}</td>
                    <td>${qty}</td>
                    <td>$${price.toFixed(2)}</td>
                    <td>$${total.toFixed(2)}</td>
                  </tr>
                `;
              }).join("") || ""}
            </tbody>
          </table>

          ${selectedReturn.comment ? `
          <div class="comment-section">
            <strong>Comment:</strong> ${selectedReturn.comment}
          </div>
          ` : ""}
        `
        }
      </body>
      </html>
    `;
    const win = window.open("", "", "width=800,height=600");
    if (!win) return;
    win.document.write(content);
    win.document.close();
    win.print();
    setPrintModalOpen(false);
  };

  const filteredReturns = useMemo(() => {
    const term = searchText.toLowerCase();
    let data = returns.filter(
      (r) =>
        (r.invoice_number?.toLowerCase() ?? "").includes(term) ||
        (r.customer_name?.toLowerCase() ?? "").includes(term) ||
        (r.date ?? "").includes(term) ||
        (r.nepal_date ?? "").toLowerCase().includes(term) ||
        (r.comment ?? "").toLowerCase().includes(term)
    );
    if (sortKey) {
      data.sort((a, b) => {
        const aValue = a[sortKey] ?? "";
        const bValue = b[sortKey] ?? "";
        if (sortKey === "total_refund") {
          const aNum = Number(aValue) || 0;
          const bNum = Number(bValue) || 0;
          return sortOrder === "asc" ? aNum - bNum : bNum - aNum;
        }
        const aStr = (aValue as string).toLowerCase();
        const bStr = (bValue as string).toLowerCase();
        if (aStr < bStr) return sortOrder === "asc" ? -1 : 1;
        if (aStr > bStr) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
    }
    return data;
  }, [returns, searchText, sortKey, sortOrder]);

  const format = (amount: string | number) => {
    if (formatAmount) return formatAmount(amount);
    const num = Number(amount);
    return isNaN(num) ? "0.00" : num.toFixed(2);
  };

  const renderSortIcon = (key: SortKey) => {
    if (sortKey !== key) return null;
    return sortOrder === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  return (
    <>
      <TableContainer
        component={Paper}
        sx={{
          boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
          borderRadius: 4,
          overflow: "hidden",
          border: "1px solid #e2e8f0",
        }}
      >
        {/* Search */}
        <Box sx={{ p: 2, borderBottom: "1px solid #eee", backgroundColor: "#fff" }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search by Invoice, Customer, Date, Nepali Date, Comment..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            sx={{
              "& .MuiOutlinedInput-root": { borderRadius: 3 },
              "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: PRIMARY_ACCENT,
                borderWidth: 2,
              },
            }}
          />
        </Box>

        {/* Table */}
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: PRIMARY_ACCENT }}>
              {[
                { label: "Invoice", key: "invoice_number" as SortKey },
                { label: "Customer", key: "customer_name" as SortKey },
                { label: "Date", key: "date" as SortKey },
                { label: "Nepali Date", key: "nepal_date" as SortKey },
                { label: "Total Refund", key: "total_refund" as SortKey },
                { label: "Comment", key: "comment" as SortKey },
                { label: "Actions", key: null },
              ].map((col) => (
                <TableCell
                  key={col.label}
                  sx={{
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: "0.875rem",
                    cursor: col.key ? "pointer" : "default",
                    py: 1.5,
                    "&:hover": col.key
                      ? { backgroundColor: "rgba(255,255,255,0.15)" }
                      : {},
                  }}
                  onClick={() => col.key && handleSort(col.key)}
                >
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    {col.label}
                    {col.key && renderSortIcon(col.key)}
                  </Stack>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredReturns.length > 0 ? (
              filteredReturns.map((r, idx) => (
                <TableRow
                  key={r.id}
                  hover
                  sx={{
                    backgroundColor: idx % 2 === 0 ? ROW_ODD_BG : "#fff",
                    "&:hover": { backgroundColor: "#f0f4f8 !important" },
                  }}
                >
                  <TableCell>{r.invoice_number ?? "-"}</TableCell>
                  <TableCell>{r.customer_name ?? "-"}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Calendar size={16} /> {r.date ?? "-"}
                    </Stack>
                  </TableCell>
                  <TableCell>{r.nepal_date ?? "-"}</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: PRIMARY_ACCENT }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <DollarSign size={16} /> {format(r.total_refund ?? 0)}
                    </Stack>
                  </TableCell>
                  <TableCell>{r.comment ?? "-"}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <IconButton
                        size="small"
                        sx={{
                          color: ACTION_DEFAULT_COLOR,
                          "&:hover": { color: ACCENT_LIGHT, transform: "scale(1.1)" },
                        }}
                        onClick={() => setViewReturn(r)}
                      >
                        <Eye size={16} />
                      </IconButton>
                      <IconButton
                        size="small"
                        sx={{
                          color: ACTION_DEFAULT_COLOR,
                          "&:hover": { color: PRIMARY_ACCENT, transform: "scale(1.1)" },
                        }}
                        onClick={() => openPrintModal(r)}
                      >
                        <Printer size={16} />
                      </IconButton>
                      <IconButton
                        size="small"
                        sx={{
                          color: ACTION_DEFAULT_COLOR,
                          "&:hover": { color: ACTION_DELETE_COLOR, transform: "scale(1.1)" },
                        }}
                        onClick={() => onDelete(r)}
                      >
                        <Trash2 size={16} />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} sx={{ textAlign: "center", py: 4, color: ACTION_DEFAULT_COLOR }}>
                  😕 {searchText ? `No returns match "${searchText}"` : "No returns available."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* View Modal - Same style as PO Table */}
      <Modal
        open={!!viewReturn}
        onClose={() => setViewReturn(null)}
        BackdropProps={{
          sx: {
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            backgroundColor: "rgba(0,0,0,0.25)",
          },
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            bgcolor: "#fff",
            borderRadius: 2,
            p: 4,
            minWidth: 400,
            maxWidth: 800,
            maxHeight: "90vh",
            overflowY: "auto",
          }}
        >
          {viewReturn && (
            <>
              <Typography variant="h6" mb={2}>
                Return Invoice: {viewReturn.invoice_number}
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {/* Summary */}
              <Stack spacing={1} mb={2}>
                <Typography variant="body2">
                  <strong>Customer:</strong> {viewReturn.customer_name ?? "-"}
                </Typography>
                <Typography variant="body2">
                  <strong>Date:</strong> {viewReturn.date}
                </Typography>
                <Typography variant="body2">
                  <strong>Nepali Date:</strong> {viewReturn.nepal_date ?? "-"}
                </Typography>
                <Typography variant="body2">
                  <strong>Total Refund:</strong> ${format(viewReturn.total_refund ?? 0)}
                </Typography>
              </Stack>

              {/* Items Table */}
              <Typography variant="body1" mb={1}>
                <strong>Items</strong>
              </Typography>
              <TableContainer component={Paper} sx={{ mb: 2 }}>
                <Table size="small">
                  <TableHead sx={{ backgroundColor: PRIMARY_ACCENT }}>
                    <TableRow>
                      <TableCell sx={{ color: "#fff", fontWeight: 600 }}>#</TableCell>
                      <TableCell sx={{ color: "#fff", fontWeight: 600 }}>Product</TableCell>
                      <TableCell sx={{ color: "#fff", fontWeight: 600 }}>Quantity</TableCell>
                      <TableCell sx={{ color: "#fff", fontWeight: 600 }}>Price</TableCell>
                      <TableCell sx={{ color: "#fff", fontWeight: 600 }}>Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {viewReturn.items?.map((item, idx) => (
                      <TableRow
                        key={idx}
                        sx={{
                          "&:nth-of-type(odd)": { backgroundColor: "#f9fafb" },
                        }}
                      >
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>{item.product_name ?? "-"}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>${Number(item.unit_price).toFixed(2)}</TableCell>
                        <TableCell>
                          ${(item.quantity * Number(item.unit_price)).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {viewReturn.comment && (
                <Typography variant="body2" mt={1}>
                  <strong>Comment:</strong> {viewReturn.comment}
                </Typography>
              )}
            </>
          )}
        </Box>
      </Modal>

      {/* Print Modal */}
      <Modal
        open={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <Box sx={{ width: 300, bgcolor: "#fff", p: 3, borderRadius: 2, boxShadow: 24, textAlign: "center" }}>
          <h3>Select Print Format</h3>
          <Stack spacing={2} mt={2}>
            <Button variant="contained" onClick={() => handlePrint("normal")}>
              Normal Print
            </Button>
            <Button variant="contained" onClick={() => handlePrint("pos")}>
              POS Print
            </Button>
          </Stack>
        </Box>
      </Modal>
    </>
  );
};

export default ReturnTable;
