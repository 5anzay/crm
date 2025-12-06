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
} from "@mui/material";
import { Pencil, Trash2, Eye, Search, ChevronUp, ChevronDown } from "lucide-react";
import type { SupplierPayment } from "./types";

// --- COLORS ---
const PRIMARY_ACCENT = "#1e3c72";
const ACCENT_LIGHT = "#4a78a9";
const ACTION_DEFAULT_COLOR = "#475569";
const ACTION_EDIT_COLOR = ACCENT_LIGHT;
const ACTION_DELETE_COLOR = "#ef4444";
const ACTION_VIEW_COLOR = ACCENT_LIGHT;
const ROW_ODD_BG = "#f9fafb";

// --- COMPONENT PROPS ---
interface Props {
  payments: SupplierPayment[];
  onEdit: (p: SupplierPayment) => void;
  onDelete: (p: SupplierPayment) => void;
  formatAmount: (amount: number | string) => string;
}

// --- SORT TYPES ---
type SortKey = "supplier_display" | "receipt_number" | "date" | "nepal_date" | "amount" | "comment";
type SortOrder = "asc" | "desc";

// --- SUPPLIER PAYMENT TABLE ---
const SupplierPaymentTable: React.FC<Props> = ({ payments, onEdit, onDelete, formatAmount }) => {
  const [searchText, setSearchText] = useState("");
  const [viewPayment, setViewPayment] = useState<SupplierPayment | null>(null);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  // --- HANDLE SORT ---
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  // --- FILTER & SORT PAYMENTS ---
  const filteredPayments = useMemo(() => {
    const term = searchText.toLowerCase();
    let data = payments.filter(
      (p) =>
        (p.supplier_display?.toLowerCase().includes(term) ?? false) ||
        (p.receipt_number?.toLowerCase().includes(term) ?? false) ||
        (p.date?.toLowerCase().includes(term) ?? false) ||
        (p.nepal_date?.toLowerCase().includes(term) ?? false) ||
        (p.comment?.toLowerCase().includes(term) ?? false)
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
      {/* SEARCH BAR */}


      {/* TABLE */}
      <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
      <Box sx={{ p: 2, borderBottom: "1px solid #eee", backgroundColor: "#fff", borderRadius: 2, mb: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search by Supplier, Receipt, or Date..."
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
                { label: "Supplier", key: "supplier_display" as SortKey },
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
                  <TableCell>{p.supplier_display ?? "-"}</TableCell>
                  <TableCell>{p.receipt_number ?? "-"}</TableCell>
                  <TableCell>{p.date ?? "-"}</TableCell>
                  <TableCell>{p.nepal_date ?? "-"}</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: PRIMARY_ACCENT }}>
                    ${formatAmount(p.amount)}
                  </TableCell>
                  <TableCell>
                    {p.comment ? (p.comment.length > 30 ? `${p.comment.substring(0, 30)}...` : p.comment) : "-"}
                  </TableCell>
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
      fontFamily: "monospace",
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
            <span>Supplier</span>
            <strong>{viewPayment.supplier_display}</strong>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <span>Receipt No.</span>
            <strong>{viewPayment.receipt_number}</strong> {/* AUTO ID */}
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
    </Box>
  );
};

export default SupplierPaymentTable;
