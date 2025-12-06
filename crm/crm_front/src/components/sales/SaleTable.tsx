// src/components/sales/SaleTable.tsx
import React, { useState, useMemo } from "react";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  IconButton,
  TextField,
  Stack,
  Box,
  Modal,
  Typography,
  Divider,
  Button,
} from "@mui/material";
import {
  Pencil,
  Trash2,
  Eye,
  ChevronUp,
  ChevronDown,
  Search,
  Printer,
} from "lucide-react";
import type { Sale } from "./types";

// --- COLORS ---
const PRIMARY_ACCENT = "#1e3c72";
const ACCENT_LIGHT = "#4a78a9";
const HEADER_TEXT_COLOR = "#fff";
const ACTION_DEFAULT_COLOR = "#475569";
const ACTION_EDIT_COLOR = ACCENT_LIGHT;
const ACTION_DELETE_COLOR = "#ef4444";
const ACTION_VIEW_COLOR = ACCENT_LIGHT;
const ROW_ODD_BG = "#f9fafb";

interface Props {
  sales: Sale[];
  onEdit: (sale: Sale) => void;
  onDelete: (sale: Sale) => void;
}

const SaleTable: React.FC<Props> = ({ sales, onEdit, onDelete }) => {
  const [searchText, setSearchText] = useState("");
  const [sortField, setSortField] = useState<"id" | "invoice_number">("invoice_number");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [viewSale, setViewSale] = useState<Sale | null>(null);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const filteredSales = useMemo(() => {
    return sales
      .filter((s) =>
        (s.invoice_number ? String(s.invoice_number).toLowerCase() : "").includes(
          searchText.toLowerCase()
        ) ||
        String(s.id).includes(searchText) ||
        String(s.customer_display ?? s.customer ?? "")
          .toLowerCase()
          .includes(searchText.toLowerCase())
      )
      .sort((a, b) => {
        const aVal: any = a[sortField];
        const bVal: any = b[sortField];

        if (typeof aVal === "string" && typeof bVal === "string")
          return sortOrder === "asc"
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);

        if (typeof aVal === "number" && typeof bVal === "number")
          return sortOrder === "asc" ? aVal - bVal : bVal - aVal;

        return 0;
      });
  }, [sales, searchText, sortField, sortOrder]);

  const toggleSort = (field: "id" | "invoice_number") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const SortIcon = ({ field }: { field: "id" | "invoice_number" }) => {
    if (sortField !== field) return null;
    return sortOrder === "asc" ? (
      <ChevronUp size={16} style={{ marginLeft: 4 }} />
    ) : (
      <ChevronDown size={16} style={{ marginLeft: 4 }} />
    );
  };

  const openPrintModal = (sale: Sale) => {
    setSelectedSale(sale);
    setPrintModalOpen(true);
  };

  const handlePrint = (format: "normal" | "pos") => {
    if (!selectedSale) return;

    // Get total, paid and remaining from sale
    const total = Number(selectedSale.total_amount ?? 0);
    const paid = Number(selectedSale.paid_amount ?? 0);
    const remaining = Number(selectedSale.remaining_amount ?? 0);

    const formattedTotal = total.toFixed(2);
    const formattedPaid = paid.toFixed(2);
    const formattedRemaining = remaining.toFixed(2);

    // For POS format items
    const itemsHtmlPos = selectedSale.items
      ?.map((item: any) => {
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
        <title>Sale Invoice</title>
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
          <h2>SALES INVOICE</h2>
          <hr>
          <div class="section"><span class="label">Invoice:</span> ${selectedSale.invoice_number}</div>
          <div class="section"><span class="label">Customer:</span> ${selectedSale.customer_display ?? selectedSale.customer ?? "-"}</div>
          <div class="section"><span class="label">Date:</span> ${selectedSale.date ?? "-"}</div>
          <div class="section"><span class="label">Nepali Date:</span> ${selectedSale.nepal_date ?? "-"}</div>
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
          <div class="total"><span class="label">Total:</span> $${formattedTotal}</div>
          <div class="total"><span class="label">Paid:</span> $${formattedPaid}</div>
          <div class="total"><span class="label">Remaining:</span> $${formattedRemaining}</div>
          <hr>
        `
            : `
          <h2>Sales Invoice: ${selectedSale.invoice_number}</h2>
          <hr>

          <div class="info-section">
            <div class="info-row"><strong>Customer:</strong> ${selectedSale.customer_display ?? selectedSale.customer ?? "-"}</div>
            <div class="info-row"><strong>Date:</strong> ${selectedSale.date ?? "-"}</div>
            <div class="info-row"><strong>Nepali Date:</strong> ${selectedSale.nepal_date ?? "-"}</div>
            <div class="info-row"><strong>Total:</strong> $${formattedTotal}</div>
            <div class="info-row"><strong>Paid:</strong> $${formattedPaid}</div>
            <div class="info-row"><strong>Remaining:</strong> $${formattedRemaining}</div>
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
              ${selectedSale.items?.map((item: any, idx: number) => {
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

  const format = (amount: number | undefined) => {
    const num = Number(amount ?? 0);
    return num.toFixed(2);
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
        {/* Search Bar */}
        <Box sx={{ p: 2, borderBottom: "1px solid #eee", backgroundColor: "#fff" }}>
          <TextField
            placeholder="Search Sales by Invoice, ID, or Customer..."
            variant="outlined"
            size="small"
            fullWidth
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
              "& .MuiOutlinedInput-root": {
                borderRadius: 3,
                transition: "all 0.2s ease",
              },
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
              <TableCell
                sx={{ color: HEADER_TEXT_COLOR, fontWeight: 700, cursor: "pointer" }}
                onClick={() => toggleSort("id")}
              >
                ID <SortIcon field="id" />
              </TableCell>
              <TableCell sx={{ color: HEADER_TEXT_COLOR, fontWeight: 700 }}>Nepal Date</TableCell>
              <TableCell
                sx={{ color: HEADER_TEXT_COLOR, fontWeight: 700, cursor: "pointer" }}
                onClick={() => toggleSort("invoice_number")}
              >
                Invoice <SortIcon field="invoice_number" />
              </TableCell>
              <TableCell sx={{ color: HEADER_TEXT_COLOR, fontWeight: 700 }}>Customer</TableCell>

              <TableCell sx={{ color: HEADER_TEXT_COLOR, fontWeight: 700 }}>Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredSales.length > 0 ? (
              filteredSales.map((s, idx) => (
                <TableRow
                  key={s.id}
                  hover
                  sx={{
                    transition: "background-color 0.15s ease-in",
                    "&:hover": { backgroundColor: "#f0f4f8 !important" },
                    backgroundColor: idx % 2 === 0 ? ROW_ODD_BG : "#ffffff",
                  }}
                >
                  <TableCell sx={{ color: ACTION_DEFAULT_COLOR }}>{s.id}</TableCell>
                  <TableCell sx={{ color: ACTION_DEFAULT_COLOR }}>
                    {s.nepal_date ?? "-"}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: PRIMARY_ACCENT }}>
                    {s.invoice_number}
                  </TableCell>
                  <TableCell sx={{ color: ACTION_DEFAULT_COLOR }}>
                    {s.customer_display ?? s.customer ?? "-"}
                  </TableCell>

                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <IconButton
                        size="medium"
                        sx={{ color: ACTION_DEFAULT_COLOR, "&:hover": { color: ACTION_EDIT_COLOR, transform: "scale(1.1)" } }}
                        onClick={() => onEdit(s)}
                      >
                        <Pencil size={16} />
                      </IconButton>
                      <IconButton
                        size="medium"
                        sx={{ color: ACTION_DEFAULT_COLOR, "&:hover": { color: ACTION_DELETE_COLOR, transform: "scale(1.1)" } }}
                        onClick={() => onDelete(s)}
                      >
                        <Trash2 size={16} />
                      </IconButton>
                      <IconButton
                        size="medium"
                        sx={{ color: ACTION_DEFAULT_COLOR, "&:hover": { color: ACTION_VIEW_COLOR, transform: "scale(1.1)" } }}
                        onClick={() => setViewSale(s)}
                      >
                        <Eye size={16} />
                      </IconButton>
                      <IconButton
                        size="medium"
                        sx={{ color: ACTION_DEFAULT_COLOR, "&:hover": { color: PRIMARY_ACCENT, transform: "scale(1.1)" } }}
                        onClick={() => openPrintModal(s)}
                      >
                        <Printer size={16} />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} sx={{ textAlign: "center", py: 3, color: ACTION_DEFAULT_COLOR }}>
                  😕 No sales found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* View Modal */}
      <Modal
        open={!!viewSale}
        onClose={() => setViewSale(null)}
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
          {viewSale && (
            <>
              <Typography variant="h6" mb={2}>
                Sales Invoice: {viewSale.invoice_number}
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {/* Summary */}
              <Stack spacing={1} mb={2}>
                <Typography variant="body2">
                  <strong>Customer:</strong> {viewSale.customer_display ?? viewSale.customer ?? "-"}
                </Typography>
                <Typography variant="body2">
                  <strong>Date:</strong> {viewSale.date ?? "-"}
                </Typography>
                <Typography variant="body2">
                  <strong>Nepali Date:</strong> {viewSale.nepal_date ?? "-"}
                </Typography>
                <Typography variant="body2">
                  <strong>Total:</strong> ${format(viewSale.total_amount)}
                </Typography>
                <Typography variant="body2">
                  <strong>Paid:</strong> ${format(viewSale.paid_amount)}
                </Typography>
                <Typography variant="body2">
                  <strong>Remaining:</strong> ${format(viewSale.remaining_amount)}
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
                    {viewSale.items?.map((item: any, idx: number) => (
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

export default SaleTable;
