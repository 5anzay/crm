// src/components/customers/CustomerDetail.tsx
import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Paper,
  Stack,
  Typography,
  Button,
  TextField,
  IconButton,
  Tabs,
  Tab,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Modal,
} from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import { FaEye, FaTimes } from "react-icons/fa";
import { Mail, Phone, MapPin, ShoppingCart, CreditCard, DollarSign, Printer } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import type { Customer } from "./types";
import type { Sale } from "../sales/types";
import type { Return } from "../returns/types";
import type { CustomerPayment } from "../customerPayments/types";
import { fetchCustomers } from "./api";
import { fetchSales } from "../sales/api";
import { fetchPayments } from "../customerPayments/api";
import { fetchReturns } from "../returns/api";
import { motion, AnimatePresence } from "framer-motion";

const PRIMARY_COLOR = "#1e3c72";
const LIGHT_BG = "#e3f2fd";
//const ACCENT_COLOR = "#0077c2";
const PRIMARY_ACCENT = "#1e3c72";
const ACTION_DEFAULT_COLOR = "#475569";
const ACTION_VIEW_COLOR = "#4a78a9";
const ROW_ODD_BG = "#f9fafb";

const UnifiedContactItem: React.FC<{ icon: React.ElementType; value: string }> = ({ icon: Icon, value }) => (
  <Stack direction="row" spacing={1} alignItems="center" sx={{ color: "#334155" }}>
    <Box component={Icon} sx={{ width: 16, height: 16, color: PRIMARY_COLOR }} />
    <Typography variant="body2" color="text.secondary">
      {value}
    </Typography>
  </Stack>
);

interface InnerMetricCardProps {
  icon: React.ElementType;
  title: string;
  value: string;
  color?: string;
  bgcolor?: string;
  sx?: SxProps<Theme>;
}

const InnerMetricCard: React.FC<InnerMetricCardProps> = ({
  icon: Icon,
  title,
  value,
  color = PRIMARY_COLOR,
  bgcolor = LIGHT_BG,
  sx,
}) => (
  <Paper
    elevation={0}
    sx={{
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      gap: 2,
      padding: { xs: 2, sm: 2.5 },
      borderRadius: 2,
      bgcolor,
      border: "1px solid rgba(0,0,0,0.04)",
      minHeight: 72,
      ...sx,
    }}
  >
    <Box
      sx={{
        width: 44,
        height: 44,
        borderRadius: 1,
        display: "grid",
        placeItems: "center",
        bgcolor: "rgba(0,0,0,0.03)",
      }}
    >
      <Box component={Icon} sx={{ width: 20, height: 20, color }} />
    </Box>
    <Box>
      <Typography variant="caption" sx={{ color: "#556" }}>
        {title}
      </Typography>
      <Typography variant="h6" sx={{ fontWeight: 700, color }}>
        {value}
      </Typography>
    </Box>
  </Paper>
);

interface PaymentView {
  open: boolean;
  payment: CustomerPayment | null;
}

const CustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [payments, setPayments] = useState<CustomerPayment[]>([]);
  const [searchSale, setSearchSale] = useState("");
  const [searchPayment, setSearchPayment] = useState("");
  const [tab, setTab] = useState<0 | 1 | 2>(0);


  const [viewPayment, setViewPayment] = useState<PaymentView>({ open: false, payment: null });
  const [viewSale, setViewSale] = useState<Sale | null>(null);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const [returns, setReturns] = useState<Return[]>([]);
  const [searchReturn, setSearchReturn] = useState("");
  const [viewReturn, setViewReturn] = useState<Return | null>(null);

  useEffect(() => {
    if (!id) return;
    const loadCustomer = async () => {
      try {
        const allCustomers = await fetchCustomers();
        const data = allCustomers.find((c) => c.id === Number(id)) || null;
        if (!data) {
          navigate("/customers");
          return;
        }
        setCustomer(data);
      } catch {
        navigate("/customers");
      }
    };
    loadCustomer();
  }, [id, navigate]);

  useEffect(() => {
    const loadSales = async () => {
      try {
        const data = await fetchSales();
        setSales(
          data
            .filter((s) => s.customer === Number(id))
            .map((s) => ({ ...s, total_amount: Number(s.total_amount ?? 0), date: s.date || "" }))
        );
      } catch {
        console.error("Failed to load sales");
      }
    };
    if (id) loadSales();
  }, [id]);

  useEffect(() => {
    const loadPayments = async () => {
      try {
        const data = await fetchPayments();
        setPayments(
          data
            .filter((p) => p.customer === Number(id))
            .map((p) => ({ ...p, amount: Number(p.amount ?? 0), date: p.date || "" }))
        );
      } catch {
        console.error("Failed to load customer payments");
      }
    };
    if (id) loadPayments();
  }, [id]);

  useEffect(() => {
    const loadReturns = async () => {
      try {
        const data = await fetchReturns();
        setReturns(
          data
            .filter((r) => r.customer === Number(id))
            .map((r) => ({ ...r, total_refund: Number(r.total_refund ?? 0), date: r.date || "" }))
        );
      } catch {
        console.error("Failed to load returns");
      }
    };
    if (id) loadReturns();
  }, [id]);

  const filteredSales = useMemo(
    () => sales.filter((s) => (s.invoice_number ?? "").toLowerCase().includes(searchSale.toLowerCase())),
    [sales, searchSale]
  );

  const filteredPayments = useMemo(
    () => payments.filter((p) => p.id?.toString().includes(searchPayment)),
    [payments, searchPayment]
  );

  const filteredReturns = useMemo(
      () => returns.filter((r) => (r.invoice_number ?? "").toLowerCase().includes(searchReturn.toLowerCase())),
      [returns, searchReturn]
    );

  const totalSales = useMemo(() => sales.reduce((sum, s) => sum + Number(s.total_amount ?? 0), 0), [sales]);
  const totalPayments = useMemo(() => {
    const paymentSum = payments.reduce((sum, p) => sum + Number(p.amount ?? 0), 0);
    const salePaidSum = sales.reduce((sum, s) => sum + Number(s.paid_amount ?? 0), 0);
    return paymentSum + salePaidSum;
  }, [payments, sales]);


  const totalReturns = useMemo(() => returns.reduce((sum, r) => sum + Number(r.total_refund ?? 0), 0), [returns]);

  const totalDue = Number(customer?.balance ?? 0);

  const openPrintModal = (sale: Sale) => {
    setSelectedSale(sale);
    setPrintModalOpen(true);
  };

  const handlePrint = (format: "normal" | "pos") => {
    if (!selectedSale) return;

    const total = Number(selectedSale.total_amount ?? 0);
    const paid = Number(selectedSale.paid_amount ?? 0);
    const remaining = Number(selectedSale.remaining_amount ?? 0);

    const formattedTotal = total.toFixed(2);
    const formattedPaid = paid.toFixed(2);
    const formattedRemaining = remaining.toFixed(2);

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

  if (!customer) return <Typography>Loading customer...</Typography>;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f5f7fa", p: { xs: 2, sm: 3, md: 5 } }}>
      <Box sx={{ mb: 2, textAlign: "right" }}>
        <Button variant="outlined" onClick={() => navigate("/customers")}>
          ← Back
        </Button>
      </Box>

      <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, bgcolor: "#fff", border: "1px solid #e0e0e0", mb: 5 }}>
        <Stack spacing={2}>
          <Stack spacing={1}>
            <Typography variant="h4" fontWeight={700} color={PRIMARY_COLOR}>{customer.name}</Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={5} flexWrap="nowrap">
              {customer.email && <UnifiedContactItem icon={Mail} value={customer.email} />}
              {customer.phone && <UnifiedContactItem icon={Phone} value={customer.phone} />}
              {customer.address && <UnifiedContactItem icon={MapPin} value={customer.address} />}
            </Stack>
          </Stack>
          <Divider sx={{ my: 2 }} />
          <Stack direction={{ xs: "column", sm: "row" }} gap={2} sx={{ width: "100%" }}>
            <InnerMetricCard icon={ShoppingCart} title="Total Sales" value={`$${totalSales.toFixed(2)}`} color={PRIMARY_COLOR} bgcolor={LIGHT_BG} sx={{ flex: 1 }}/>
            <InnerMetricCard icon={CreditCard} title="Total Payments" value={`$${totalPayments.toFixed(2)}`} color={PRIMARY_COLOR} bgcolor={LIGHT_BG} sx={{ flex: 1 }}/>

            <InnerMetricCard icon={DollarSign} title="Total Returns" value={`$${totalReturns.toFixed(2)}`} color={PRIMARY_COLOR} bgcolor={LIGHT_BG} sx={{ flex: 1 }}/>
            <InnerMetricCard icon={DollarSign} title="Outstanding Due" value={`$${totalDue.toFixed(2)}`} color={PRIMARY_COLOR} bgcolor={LIGHT_BG} sx={{ flex: 1 }}/>
          </Stack>
          </Stack>

      </Paper>

      <Tabs value={tab} onChange={(_, val) => setTab(val)} sx={{ mb: 3 }}>
  <Tab label="Sales" />
  <Tab label="Payments" />
  <Tab label="Returns" />
</Tabs>

      {tab === 0 && (
        <Box>
          <TableContainer component={Paper} sx={{ borderRadius: 4, overflow: "hidden", border: "1px solid #e2e8f0", boxShadow: "0 8px 20px rgba(0,0,0,0.08)" }}>
            <Box sx={{ p: 2, borderBottom: "1px solid #eee", backgroundColor: "#fff" }}>
              <TextField label="Search Sales" value={searchSale} onChange={(e) => setSearchSale(e.target.value)} variant="outlined" size="small" fullWidth />
            </Box>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: PRIMARY_ACCENT }}>
                  <TableCell sx={{ color: "#fff", fontWeight: 700 }}>Invoice</TableCell>
                  <TableCell sx={{ color: "#fff", fontWeight: 700 }}>Date</TableCell>
                  <TableCell sx={{ color: "#fff", fontWeight: 700 }}>Total</TableCell>
                  <TableCell sx={{ color: "#fff", fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredSales.length ? (
                  filteredSales.map((s, idx) => (
                    <TableRow key={s.id} hover sx={{ backgroundColor: idx % 2 === 0 ? ROW_ODD_BG : "#fff", "&:hover": { backgroundColor: "#f0f4f8 !important" } }}>
                      <TableCell>{s.invoice_number}</TableCell>
                      <TableCell>{s.nepal_date || "N/A"}</TableCell>
                      <TableCell>${Number(s.total_amount || 0).toFixed(2)}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <Tooltip title="View Sale Details">
                            <IconButton onClick={() => setViewSale(s)} sx={{ color: ACTION_DEFAULT_COLOR, "&:hover": { color: ACTION_VIEW_COLOR, transform: "scale(1.1)" } }}>
                              <FaEye />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Print Invoice">
                            <IconButton onClick={() => openPrintModal(s)} sx={{ color: ACTION_DEFAULT_COLOR, "&:hover": { color: PRIMARY_ACCENT, transform: "scale(1.1)" } }}>
                              <Printer size={16} />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} sx={{ textAlign: "center", py: 4, color: ACTION_DEFAULT_COLOR }}>😕 No sales found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {tab === 1 && (
        <Box>
          <TableContainer component={Paper} sx={{ borderRadius: 4, overflow: "hidden", border: "1px solid #e2e8f0", boxShadow: "0 8px 20px rgba(0,0,0,0.08)" }}>
            <Box sx={{ p: 2, borderBottom: "1px solid #eee", backgroundColor: "#fff" }}>
              <TextField label="Search by receipt number" value={searchPayment} onChange={(e) => setSearchPayment(e.target.value)} variant="outlined" size="small" fullWidth />
            </Box>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: PRIMARY_ACCENT }}>
                  <TableCell sx={{ color: "#fff", fontWeight: 700 }}>Receipt #</TableCell>
                  <TableCell sx={{ color: "#fff", fontWeight: 700 }}>Date</TableCell>
                  <TableCell sx={{ color: "#fff", fontWeight: 700 }}>Amount</TableCell>
                  <TableCell sx={{ color: "#fff", fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredPayments.length ? (
                  filteredPayments.map((p, idx) => (
                    <TableRow key={p.id} hover sx={{ backgroundColor: idx % 2 === 0 ? ROW_ODD_BG : "#fff", "&:hover": { backgroundColor: "#f0f4f8 !important" } }}>
                      <TableCell>{p.id}</TableCell>
                      <TableCell>{p.nepal_date || "N/A"}</TableCell>
                      <TableCell>${Number(p.amount || 0).toFixed(2)}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <Tooltip title="View Payment Details">
                            <IconButton onClick={() => setViewPayment({ open: true, payment: p })} sx={{ color: ACTION_DEFAULT_COLOR, "&:hover": { color: ACTION_VIEW_COLOR, transform: "scale(1.1)" } }}>
                              <FaEye />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} sx={{ textAlign: "center", py: 4, color: ACTION_DEFAULT_COLOR }}>😕 No payments found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {tab === 2 && (
        <Box>
          <TableContainer component={Paper} sx={{ borderRadius: 4, overflow: "hidden", border: "1px solid #e2e8f0", boxShadow: "0 8px 20px rgba(0,0,0,0.08)" }}>
            <Box sx={{ p: 2, borderBottom: "1px solid #eee", backgroundColor: "#fff" }}>
              <TextField label="Search Returns" value={searchReturn} onChange={(e) => setSearchReturn(e.target.value)} variant="outlined" size="small" fullWidth />
            </Box>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: PRIMARY_ACCENT }}>
                  <TableCell sx={{ color: "#fff", fontWeight: 700 }}>Invoice</TableCell>
                  <TableCell sx={{ color: "#fff", fontWeight: 700 }}>Date</TableCell>
                  <TableCell sx={{ color: "#fff", fontWeight: 700 }}>Total Refund</TableCell>
                  <TableCell sx={{ color: "#fff", fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredReturns.length ? (
                  filteredReturns.map((r, idx) => (
                    <TableRow key={r.id} hover sx={{ backgroundColor: idx % 2 === 0 ? ROW_ODD_BG : "#fff", "&:hover": { backgroundColor: "#f0f4f8 !important" } }}>
                      <TableCell>{r.invoice_number || `RET-${r.id}`}</TableCell>
                      <TableCell>{r.nepal_date || "N/A"}</TableCell>
                      <TableCell>${Number(r.total_refund || 0).toFixed(2)}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <Tooltip title="View Return Details">
                            <IconButton onClick={() => setViewReturn(r)} sx={{ color: ACTION_DEFAULT_COLOR, "&:hover": { color: ACTION_VIEW_COLOR, transform: "scale(1.1)" } }}>
                              <FaEye />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} sx={{ textAlign: "center", py: 4, color: ACTION_DEFAULT_COLOR }}>😕 No returns found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Sale View Modal */}
      <Modal open={!!viewSale} onClose={() => setViewSale(null)} BackdropProps={{ sx: { backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", backgroundColor: "rgba(0,0,0,0.25)" } }}>
        <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", bgcolor: "#fff", borderRadius: 2, p: 4, minWidth: 400, maxWidth: 800, maxHeight: "90vh", overflowY: "auto" }}>
          {viewSale && (
            <>
              <Typography variant="h6" mb={2}>Sales Invoice: {viewSale.invoice_number}</Typography>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={1} mb={2}>
                <Typography variant="body2"><strong>Customer:</strong> {viewSale.customer_display ?? viewSale.customer ?? "-"}</Typography>
                <Typography variant="body2"><strong>Date:</strong> {viewSale.date ?? "-"}</Typography>
                <Typography variant="body2"><strong>Nepali Date:</strong> {viewSale.nepal_date ?? "-"}</Typography>
                <Typography variant="body2"><strong>Total:</strong> ${format(viewSale.total_amount)}</Typography>
                <Typography variant="body2"><strong>Paid:</strong> ${format(viewSale.paid_amount)}</Typography>
                <Typography variant="body2"><strong>Remaining:</strong> ${format(viewSale.remaining_amount)}</Typography>

              </Stack>
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
                    {viewSale.items?.map((item: any, idx: number) => (
                      <TableRow key={idx} sx={{ "&:nth-of-type(odd)": { backgroundColor: "#f9fafb" } }}>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>{item.product_name ?? "-"}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>${Number(item.unit_price).toFixed(2)}</TableCell>
                        <TableCell>${(item.quantity * Number(item.unit_price)).toFixed(2)}</TableCell>

                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </Box>
      </Modal>

      {/* View Return Modal */}
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
          Return Invoice: {viewReturn.invoice_number || `RET-${viewReturn.id}`}
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Stack spacing={1} mb={2}>
          <Typography variant="body2">
            <strong>Customer:</strong> {viewReturn.customer_name ?? viewReturn.customer ?? "-"}
          </Typography>
          <Typography variant="body2">
            <strong>Date:</strong> {viewReturn.date ?? "-"}
          </Typography>
          <Typography variant="body2">
            <strong>Nepali Date:</strong> {viewReturn.nepal_date ?? "-"}
          </Typography>
          <Typography variant="body2">
            <strong>Total Refund:</strong> ${Number(viewReturn.total_refund ?? 0).toFixed(2)}
          </Typography>
        </Stack>
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
              {viewReturn.items?.map((item: any, idx: number) => (
                <TableRow
                  key={idx}
                  sx={{ "&:nth-of-type(odd)": { backgroundColor: "#f9fafb" } }}
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
          <Typography variant="body2" sx={{ mt: 1, opacity: 0.85 }}>
            <strong>Comment:</strong> {viewReturn.comment}
          </Typography>
        )}
      </>
    )}
  </Box>
</Modal>


      {/* Print Modal */}
      <Modal open={printModalOpen} onClose={() => setPrintModalOpen(false)} sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Box sx={{ width: 300, bgcolor: "#fff", p: 3, borderRadius: 2, boxShadow: 24, textAlign: "center" }}>
          <h3>Select Print Format</h3>
          <Stack spacing={2} mt={2}>
            <Button variant="contained" onClick={() => handlePrint("normal")}>Normal Print</Button>
            <Button variant="contained" onClick={() => handlePrint("pos")}>POS Print</Button>
          </Stack>
        </Box>
      </Modal>

      {/* Payment Receipt Modal */}
      <AnimatePresence>
        {viewPayment.open && viewPayment.payment && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)", zIndex: 1390 }} onClick={() => setViewPayment({ open: false, payment: null })} />
            <motion.div initial={{ opacity: 0, scale: 0.85, x: "-50%", y: "-50%" }} animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }} exit={{ opacity: 0, scale: 0.9, x: "-50%", y: "-50%" }} style={{ position: "fixed", zIndex: 1400, width: "90%", maxWidth: 500, left: "50%", top: "50%", transformOrigin: "center center" }}>
              <Paper sx={{ p: 4, borderRadius: 3, bgcolor: "#fff", maxHeight: "90vh", overflowY: "auto" }}>
                <Box sx={{ background: PRIMARY_ACCENT, p: 1.5, borderRadius: 1, mb: 2, textAlign: "center", position: "relative" }}>
                  <Typography variant="h6" sx={{ color: "#fff", fontWeight: 700, letterSpacing: 1 }}>PAYMENT RECEIPT</Typography>
                  <IconButton sx={{ position: "absolute", top: 4, right: 4, color: "#fff", opacity: 0.85 }} onClick={() => setViewPayment({ open: false, payment: null })} size="small"><FaTimes /></IconButton>
                </Box>
                <Divider sx={{ borderStyle: "dashed", borderColor: "#d1d5db", mb: 2 }} />
                <Stack spacing={1.2} sx={{ fontSize: "14px", color: "#111" }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}><span>Receipt #</span><strong>{viewPayment.payment.id}</strong></Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}><span>Date</span><strong>{viewPayment.payment.date}</strong></Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}><span>Nepali Date</span><strong>{viewPayment.payment.nepal_date}</strong></Box>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}><strong>Total Paid</strong><strong style={{ color: PRIMARY_ACCENT }}>${Number(viewPayment.payment.amount).toFixed(2)}</strong></Box>
                  {viewPayment.payment.comment && (
                    <Box sx={{ mt: 1 }}>
                      <Divider sx={{ mb: 1 }} />
                      <Typography sx={{ fontSize: "13px", opacity: 0.9 }}><strong>Note:</strong> {viewPayment.payment.comment}</Typography>
                    </Box>
                  )}
                </Stack>
                <Divider sx={{ my: 2, borderStyle: "dashed", borderColor: "#d1d5db" }} />
                <Typography variant="body2" sx={{ textAlign: "center", fontSize: "12px", opacity: 0.7, color: "#000", fontStyle: "italic" }}>★ Thank you for your payment ★</Typography>
              </Paper>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </Box>
  );
};

export default CustomerDetail;
