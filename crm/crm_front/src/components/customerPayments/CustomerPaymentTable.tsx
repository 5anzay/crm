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
  Typography,
  Modal,
  Divider,
  Button,
} from "@mui/material";
import { Pencil, Trash2, Eye, Search, ChevronUp, ChevronDown, Printer } from "lucide-react";
import type { CustomerPayment } from "./types";

interface Props {
  payments: CustomerPayment[];
  onEdit: (p: CustomerPayment) => void;
  onDelete: (p: CustomerPayment) => void;
  formatAmount: (amount: number | string) => string;
}

const PRIMARY_ACCENT = "#1e3c72";
const ACCENT_LIGHT = "#4a78a9";
const ACTION_DEFAULT_COLOR = "#475569";
const ACTION_EDIT_COLOR = ACCENT_LIGHT;
const ACTION_DELETE_COLOR = "#ef4444";
const ACTION_VIEW_COLOR = ACCENT_LIGHT;
const ROW_ODD_BG = "#f9fafb";

type SortKey = "customer_display" | "receipt_number" | "date" | "nepal_date" | "amount" | "comment";
type SortOrder = "asc" | "desc";

const CustomerPaymentTable: React.FC<Props> = ({ payments, onEdit, onDelete, formatAmount }) => {
  const [searchText, setSearchText] = useState("");
  const [viewPayment, setViewPayment] = useState<CustomerPayment | null>(null);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<CustomerPayment | null>(null);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  const openPrintModal = (payment: CustomerPayment) => {
    setSelectedPayment(payment);
    setPrintModalOpen(true);
  };

  const handlePrint = (format: "normal" | "pos") => {
    if (!selectedPayment) return;

    const formattedAmount = formatAmount(selectedPayment.amount);

    const content = `
      <html>
      <head>
        <title>Payment Receipt</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            padding: 32px;
            max-width: 600px;
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
          .header-band {
            background: #1e3c72;
            padding: 12px;
            border-radius: 4px;
            text-align: center;
            margin-bottom: 16px;
          }
          .header-band h2 {
            color: white;
            font-weight: 700;
            letter-spacing: 1px;
            margin: 0;
          }
          .dashed-divider {
            border: none;
            border-top: 1px dashed #d1d5db;
            margin: 16px 0;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            font-size: 0.875rem;
            margin-bottom: 12px;
            color: #111;
          }
          .info-row strong {
            font-weight: 600;
          }
          .amount-row {
            display: flex;
            justify-content: space-between;
            font-weight: 700;
            font-size: 1rem;
            margin: 16px 0;
          }
          .amount-row .amount {
            color: #1e3c72;
          }
          .note-section {
            margin-top: 16px;
            font-size: 0.8125rem;
            color: #111;
            opacity: 0.9;
          }
          .footer {
            text-align: center;
            font-size: 0.75rem;
            opacity: 0.7;
            font-style: italic;
            margin-top: 16px;
          }
          ${
            format === "pos"
              ? `
            body { width: 300px; font-size: 12px; padding: 10px; }
            h2 { font-size: 16px; text-align: center; margin-bottom: 8px; }
            hr { border-top: 1px dashed #333; margin: 8px 0; }
            .section { margin-bottom: 6px; }
            .label { font-weight: bold; }
            .amount { font-weight: bold; font-size: 14px; margin-top: 8px; text-align: right; }
          `
              : ""
          }
        </style>
      </head>
      <body>
        ${
          format === "pos"
            ? `
          <h2>PAYMENT RECEIPT</h2>
          <hr>
          <div class="section"><span class="label">Receipt ID:</span> ${selectedPayment.id}</div>
          <div class="section"><span class="label">Customer:</span> ${selectedPayment.customer_display}</div>
          <div class="section"><span class="label">Date:</span> ${selectedPayment.date}</div>
          <div class="section"><span class="label">Nepali Date:</span> ${selectedPayment.nepal_date ?? "-"}</div>
          <hr>
          <div class="amount"><span class="label">Amount Paid:</span> $${formattedAmount}</div>
          <hr>
          ${selectedPayment.comment ? `<div class="section"><span class="label">Note:</span> ${selectedPayment.comment}</div><hr>` : ""}
          <div style="text-align: center; font-size: 11px; margin-top: 10px;">★ Thank you for your payment ★</div>
        `
            : `
          <div class="header-band">
            <h2>PAYMENT RECEIPT</h2>
          </div>
          <div class="dashed-divider"></div>

          <div class="info-row">
            <span>Customer</span>
            <strong>${selectedPayment.customer_display}</strong>
          </div>
          <div class="info-row">
            <span>Receipt No.</span>
            <strong>${selectedPayment.id}</strong>
          </div>
          <div class="info-row">
            <span>Date</span>
            <strong>${selectedPayment.date}</strong>
          </div>
          <div class="info-row">
            <span>Nepali Date</span>
            <strong>${selectedPayment.nepal_date ?? "-"}</strong>
          </div>

          <hr>

          <div class="amount-row">
            <strong>Total Paid</strong>
            <strong class="amount">$${formattedAmount}</strong>
          </div>

          ${selectedPayment.comment ? `
          <hr>
          <div class="note-section">
            <strong>Note:</strong> ${selectedPayment.comment}
          </div>
          ` : ""}

          <div class="dashed-divider"></div>

          <div class="footer">
            ★ Thank you for your payment ★
          </div>
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

  const filteredPayments = useMemo(() => {
    const term = searchText.toLowerCase();
    let data = payments.filter(
      (p) =>
        (p.customer_display?.toLowerCase() ?? "").includes(term) ||
        (p.receipt_number?.toLowerCase() ?? "").includes(term) ||
        (p.date?.toLowerCase() ?? "").includes(term) ||
        (p.nepal_date?.toLowerCase() ?? "").includes(term) ||
        (p.comment?.toLowerCase() ?? "").includes(term)
    );

    if (sortKey) {
      data.sort((a, b) => {
        const aValue = a[sortKey] ?? "";
        const bValue = b[sortKey] ?? "";
        if (sortKey === "amount") {
          const aNum = typeof aValue === "number" ? aValue : parseFloat(aValue as string) || 0;
          const bNum = typeof bValue === "number" ? bValue : parseFloat(bValue as string) || 0;
          return sortOrder === "asc" ? aNum - bNum : bNum - aNum;
        } else {
          const aStr = (aValue as string).toString().toLowerCase();
          const bStr = (bValue as string).toString().toLowerCase();
          if (aStr < bStr) return sortOrder === "asc" ? -1 : 1;
          if (aStr > bStr) return sortOrder === "asc" ? 1 : -1;
          return 0;
        }
      });
    }
    return data;
  }, [payments, searchText, sortKey, sortOrder]);

  const renderSortIcon = (key: SortKey) => {
    if (sortKey !== key) return null;
    return sortOrder === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* TABLE */}
      <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
        <Box mb={2} sx={{ p: 2, borderBottom: "1px solid #eee", backgroundColor: "#fff", borderRadius: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search by Customer, Receipt, Date, Comment..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            InputProps={{
              startAdornment: (
                <Box sx={{ mr: 1, color: ACTION_DEFAULT_COLOR }}>
                  <Search size={20} />
                </Box>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": { borderRadius: 2 },
              "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: PRIMARY_ACCENT,
                borderWidth: 2,
              },
            }}
          />
        </Box>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: PRIMARY_ACCENT }}>
              {[
                { label: "Customer", key: "customer_display" as SortKey },
                { label: "Receipt", key: "receipt_number" as SortKey },
                { label: "Date", key: "date" as SortKey },
                { label: "Nepali Date", key: "nepal_date" as SortKey },
                { label: "Amount", key: "amount" as SortKey },
                { label: "Comment", key: "comment" as SortKey },
                { label: "Actions", key: null },
              ].map((col) => (
                <TableCell
                  key={col.label}
                  sx={{ color: "#fff", fontWeight: 700, fontSize: "0.875rem", cursor: col.key ? "pointer" : "default" }}
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
            {filteredPayments.length > 0 ? (
              filteredPayments.map((p, idx) => (
                <TableRow
                  key={p.id}
                  hover
                  sx={{
                    backgroundColor: idx % 2 === 0 ? ROW_ODD_BG : "#fff",
                    "&:hover": { backgroundColor: "#f0f4f8 !important" },
                  }}
                >
                  <TableCell>{p.customer_display ?? "-"}</TableCell>
                  <TableCell>{p.id ?? "-"}</TableCell>
                  <TableCell>{p.date ?? "-"}</TableCell>
                  <TableCell>{p.nepal_date ?? "-"}</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: PRIMARY_ACCENT }}>
                    ${formatAmount(p.amount)}
                  </TableCell>
                  <TableCell>{p.comment ?? "-"}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <IconButton
                        size="small"
                        sx={{ color: ACTION_DEFAULT_COLOR, "&:hover": { color: ACTION_EDIT_COLOR, transform: "scale(1.1)" } }}
                        onClick={() => onEdit(p)}
                      >
                        <Pencil size={16} />
                      </IconButton>
                      <IconButton
                        size="small"
                        sx={{ color: ACTION_DEFAULT_COLOR, "&:hover": { color: ACTION_VIEW_COLOR, transform: "scale(1.1)" } }}
                        onClick={() => setViewPayment(p)}
                      >
                        <Eye size={16} />
                      </IconButton>
                      <IconButton
                        size="small"
                        sx={{ color: ACTION_DEFAULT_COLOR, "&:hover": { color: PRIMARY_ACCENT, transform: "scale(1.1)" } }}
                        onClick={() => openPrintModal(p)}
                      >
                        <Printer size={16} />
                      </IconButton>
                      <IconButton
                        size="small"
                        sx={{ color: ACTION_DEFAULT_COLOR, "&:hover": { color: ACTION_DELETE_COLOR, transform: "scale(1.1)" } }}
                        onClick={() => onDelete(p)}
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
                  😕 {searchText ? `No payments match "${searchText}"` : "No payments available."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* VIEW MODAL */}
      <Modal
        open={!!viewPayment}
        onClose={() => setViewPayment(null)}
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
            p: 3,
            minWidth: 380,
            maxWidth: 500,
            maxHeight: "90vh",
            overflowY: "auto",
            boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
            outline: "none",
            border: "1px solid #e5e7eb",
          }}
        >
          {viewPayment && (
            <>
              {/* Header Band */}
              <Box
                sx={{
                  background: PRIMARY_ACCENT,
                  p: 1.5,
                  borderRadius: 1,
                  mb: 2,
                  textAlign: "center",
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    color: "#fff",
                    fontWeight: 700,
                    letterSpacing: 1,
                  }}
                >
                  PAYMENT RECEIPT
                </Typography>
              </Box>
              {/* Dashed Divider */}
              <Divider
                sx={{
                  borderStyle: "dashed",
                  borderColor: "#d1d5db",
                  mb: 2,
                }}
              />
              {/* Receipt Body */}
              <Stack spacing={1.2} sx={{ fontSize: "14px", color: "#111" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Customer</span>
                  <strong>{viewPayment.customer_display}</strong>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Receipt No.</span>
                  <strong>{viewPayment.id}</strong>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Date</span>
                  <strong>{viewPayment.date}</strong>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Nepali Date</span>
                  <strong>{viewPayment.nepal_date}</strong>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <strong>Total Paid</strong>
                  <strong style={{ color: PRIMARY_ACCENT }}>
                    ${formatAmount(viewPayment.amount)}
                  </strong>
                </Box>
                {viewPayment.comment && (
                  <Box sx={{ mt: 1 }}>
                    <Divider sx={{ mb: 1 }} />
                    <Typography sx={{ fontSize: "13px", opacity: 0.9 }}>
                      <strong>Note:</strong> {viewPayment.comment}
                    </Typography>
                  </Box>
                )}
              </Stack>
              {/* Dashed Divider Bottom */}
              <Divider
                sx={{
                  my: 2,
                  borderStyle: "dashed",
                  borderColor: "#d1d5db",
                }}
              />
              {/* Footer */}
              <Typography
                variant="body2"
                sx={{
                  textAlign: "center",
                  fontSize: "12px",
                  opacity: 0.7,
                  color: "#000",
                  fontStyle: "italic",
                }}
              >
                ★ Thank you for your payment ★
              </Typography>
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
    </Box>
  );
};

export default CustomerPaymentTable;
