import React, { useMemo, useState } from "react";
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
  Modal,
  Typography,
  Divider,

} from "@mui/material";
import {
  Pencil,
  Trash2,
  Eye,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import type { PurchaseOrder } from "./types";

const PRIMARY_ACCENT = "#1e3c72";
const ACCENT_LIGHT = "#4a78a9";
const HEADER_TEXT_COLOR = "#fff";
const ACTION_DEFAULT_COLOR = "#475569";
const ACTION_EDIT_COLOR = ACCENT_LIGHT;
const ACTION_DELETE_COLOR = "#ef4444";
const ACTION_VIEW_COLOR = ACCENT_LIGHT;
const ROW_ODD_BG = "#f9fafb";

interface Props {
  purchaseOrders: PurchaseOrder[];
  onEdit: (po: PurchaseOrder) => void;
  onDelete: (po: PurchaseOrder) => void;
}

const POTable: React.FC<Props> = ({ purchaseOrders, onEdit, onDelete }) => {
  const [searchText, setSearchText] = useState("");
  const [sortField, setSortField] = useState<keyof PurchaseOrder>("invoice_number");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [viewPO, setViewPO] = useState<PurchaseOrder | null>(null);

  const filteredPOs = useMemo(() => {
    return purchaseOrders
      .filter(
        (p) =>
          p.invoice_number.toLowerCase().includes(searchText.toLowerCase()) ||
          (p.date?.toLowerCase().includes(searchText.toLowerCase()) ?? false)
      )
      .sort((a, b) => {
        const aVal = a[sortField] || "";
        const bVal = b[sortField] || "";
        if (typeof aVal === "string" && typeof bVal === "string")
          return sortOrder === "asc"
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        if (typeof aVal === "number" && typeof bVal === "number")
          return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
        return 0;
      });
  }, [purchaseOrders, searchText, sortField, sortOrder]);

  const toggleSort = (field: keyof PurchaseOrder) => {
    if (sortField === field) setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const SortIcon = ({ field }: { field: keyof PurchaseOrder }) => {
    if (sortField !== field) return null;
    return sortOrder === "asc" ? (
      <ChevronUp size={16} style={{ marginLeft: 4 }} />
    ) : (
      <ChevronDown size={16} style={{ marginLeft: 4 }} />
    );
  };

  const headers = [
    { label: "Invoice No", field: "invoice_number", sortable: true },
    { label: "Supplier", field: "supplier_display", sortable: true },
    { label: "Date", field: "date", sortable: true },
    { label: "Total", field: "total_amount", sortable: true },
    { label: "Paid", field: "paid_amount", sortable: true },
    { label: "Due", field: "remaining_amount", sortable: true },
    { label: "Items", field: null, sortable: false },
    { label: "Actions", field: null, sortable: false },
  ];



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
            placeholder="Search by Invoice or Supplier..."
            variant="outlined"
            size="small"
            fullWidth
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

        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: PRIMARY_ACCENT }}>
              {headers.map((h) => (
                <TableCell
                  key={h.label}
                  onClick={() => h.sortable && toggleSort(h.field as keyof PurchaseOrder)}
                  sx={{
                    color: HEADER_TEXT_COLOR,
                    fontWeight: 700,
                    cursor: h.sortable ? "pointer" : "default",
                    py: 1.5,
                    fontSize: "0.9rem",
                    "&:hover": h.sortable
                      ? { backgroundColor: "rgba(255,255,255,0.15)" }
                      : {},
                  }}
                >
                  <Stack direction="row" alignItems="center">
                    {h.label}
                    {h.sortable && <SortIcon field={h.field as keyof PurchaseOrder} />}
                  </Stack>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredPOs.length > 0 ? (
              filteredPOs.map((po, idx) => (
                <TableRow
                  key={po.id}
                  hover
                  sx={{
                    backgroundColor: idx % 2 === 0 ? ROW_ODD_BG : "#ffffff",
                    "&:hover": { backgroundColor: "#f0f4f8 !important" },
                  }}
                >
                  <TableCell>{po.invoice_number}</TableCell>
                  <TableCell>{po.supplier_display ?? po.supplier}</TableCell>
                  <TableCell>{po.date || "-"}</TableCell>
                  <TableCell>${po.total_amount?.toFixed(2)}</TableCell>
                  <TableCell>${po.paid_amount?.toFixed(2)}</TableCell>
                  <TableCell>${po.remaining_amount?.toFixed(2)}</TableCell>
                  <TableCell>{po.items?.length ?? 0}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <IconButton
                        size="small"
                        sx={{
                          color: ACTION_DEFAULT_COLOR,
                          "&:hover": { color: ACTION_EDIT_COLOR, transform: "scale(1.1)" },
                        }}
                        onClick={() => onEdit(po)}
                      >
                        <Pencil size={16} />
                      </IconButton>
                      <IconButton
                        size="small"
                        sx={{
                          color: ACTION_DEFAULT_COLOR,
                          "&:hover": { color: ACTION_VIEW_COLOR, transform: "scale(1.1)" },
                        }}
                        onClick={() => setViewPO(po)}
                      >
                        <Eye size={16} />
                      </IconButton>
                      <IconButton
                        size="small"
                        sx={{
                          color: ACTION_DEFAULT_COLOR,
                          "&:hover": { color: ACTION_DELETE_COLOR, transform: "scale(1.1)" },
                        }}
                        onClick={() => onDelete(po)}
                      >
                        <Trash2 size={16} />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} sx={{ textAlign: "center", py: 3, color: ACTION_DEFAULT_COLOR }}>
                  😕 No Purchase Orders found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* View Modal */}
      {/* View Modal */}
      <Modal open={!!viewPO} onClose={() => setViewPO(null)} BackdropProps={{
        sx: {
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          backgroundColor: "rgba(0,0,0,0.25)",
        },
      }}>
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
          {viewPO && (
            <>
              <Typography variant="h6" mb={2}>
                Invoice: {viewPO.invoice_number}
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {/* Summary */}
              <Stack spacing={1} mb={2} direction="row">
                <Typography variant="body2"><strong>Supplier:</strong> {viewPO.supplier_display ?? viewPO.supplier}</Typography>
                <Typography variant="body2"><strong>Date:</strong> {viewPO.date}</Typography>
                <Typography variant="body2"><strong>Total:</strong> ${viewPO.total_amount?.toFixed(2)}</Typography>
                <Typography variant="body2"><strong>Paid:</strong> ${viewPO.paid_amount?.toFixed(2)}</Typography>
                <Typography variant="body2"><strong>Due:</strong> ${viewPO.remaining_amount?.toFixed(2)}</Typography>
              </Stack>

              {/* Items Table */}
              <Typography variant="body1" mb={1}><strong>Items</strong></Typography>
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
                    {viewPO.items.map((item, idx) => (
                      <TableRow
                        key={idx}
                        sx={{
                          "&:nth-of-type(odd)": { backgroundColor: "#f9fafb" },
                        }}
                      >
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>{item.product_name}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>${item.cost_price.toFixed(2)}</TableCell>
                        <TableCell>${(item.quantity * item.cost_price).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {viewPO.comment && (
                <Typography variant="body2" mt={1}>
                  <strong>Comment:</strong> {viewPO.comment}
                </Typography>
              )}
            </>
          )}
        </Box>
      </Modal>


    </>
  );
};

export default POTable;
