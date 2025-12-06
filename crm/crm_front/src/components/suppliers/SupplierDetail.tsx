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
import type { SxProps, Theme } from "@mui/material";

import {
  FaEye,
  FaTimes,
  FaDollarSign,
  FaShoppingCart,
  FaMoneyCheckAlt,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
} from "react-icons/fa";
import { useParams, useNavigate } from "react-router-dom";
import type { Supplier } from "./types";
import type { PurchaseOrder } from "../purchaseOrders/types";
import type { SupplierPayment } from "../supplierPayments/types";
import { fetchSuppliers } from "./api";
import { fetchPOs } from "../purchaseOrders/api";
import { fetchPayments } from "../supplierPayments/api";
import { motion, AnimatePresence } from "framer-motion";

const PRIMARY_COLOR = "#1e3c72";
const LIGHT_BG = "#e3f2fd";
const ACCENT_COLOR = "#0077c2";
const PRIMARY_ACCENT = "#1e3c72";

const ACTION_DEFAULT_COLOR = "#475569";
const ACTION_VIEW_COLOR = "#4a78a9";
const ROW_ODD_BG = "#f9fafb";

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
      alignItems: "center",
      gap: 2,
      p: { xs: 2, sm: 2.5 },
      borderRadius: 2,
      bgcolor,
      border: "1px solid rgba(0,0,0,0.04)",
      minHeight: 72,
      flex: 1, // default expansion, overrideable by parent
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

const SupplierDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [pos, setPOs] = useState<PurchaseOrder[]>([]);
  const [payments, setPayments] = useState<SupplierPayment[]>([]);
  const [search, setSearch] = useState("");
  const [paymentSearch, setPaymentSearch] = useState("");
  const [viewPO, setViewPO] = useState<PurchaseOrder | null>(null);
  const [viewPayment, setViewPayment] = useState<SupplierPayment | null>(null);
  const [tab, setTab] = useState<0 | 1>(0);

  useEffect(() => {
    if (!id) return;
    const loadSupplier = async () => {
      try {
        const allSuppliers = await fetchSuppliers();
        const data = allSuppliers.find((s) => s.id === Number(id)) || null;
        if (!data) {
          navigate("/suppliers");
          return;
        }
        setSupplier(data);
      } catch {
        navigate("/suppliers");
      }
    };
    loadSupplier();
  }, [id, navigate]);

  useEffect(() => {
    const loadPOs = async () => {
      try {
        const data = await fetchPOs();
        setPOs(
          data.map((po) => ({
            ...po,
            total_amount: Number(po.total_amount ?? 0),
            paid_amount: Number(po.paid_amount ?? 0),
            remaining_amount: Number(po.remaining_amount ?? 0),
            items:
              po.items?.map((item) => ({
                ...item,
                quantity: Number(item.quantity ?? 0),
                cost_price: Number(item.cost_price ?? 0),
              })) ?? [],
          }))
        );
      } catch {
        console.error("Failed to load purchase orders");
      }
    };
    loadPOs();
  }, []);

  useEffect(() => {
    const loadPayments = async () => {
      try {
        const data = await fetchPayments();
        setPayments(
          data
            .filter((p) => p.supplier === Number(id))
            .map((p) => ({
              ...p,
              amount: Number(p.amount ?? 0),
              date: p.date || "",
            }))
        );
      } catch {
        console.error("Failed to load supplier payments");
      }
    };
    if (id) loadPayments();
  }, [id]);

  const supplierPOs = useMemo(() => {
    if (!supplier) return [];
    return pos
      .filter((po) => po.supplier === supplier.id)
      .filter((po) => po.invoice_number?.toLowerCase().includes(search.toLowerCase()));
  }, [pos, supplier, search]);

  const filteredPayments = useMemo(() => {
    return payments.filter((p) =>
      p.receipt_number?.toLowerCase().includes(paymentSearch.toLowerCase())
    );
  }, [payments, paymentSearch]);

  const totalPOAmount = supplierPOs.reduce((sum, po) => sum + po.total_amount, 0);
  const totalPayments = useMemo(() => {
    if (!supplier) return 0;
    const poPayments = pos
      .filter((po) => po.supplier === supplier.id)
      .reduce((sum, po) => sum + Number(po.paid_amount ?? 0), 0);
    const supplierPayments = payments
      .filter((p) => p.supplier === supplier.id)
      .reduce((sum, p) => sum + Number(p.amount ?? 0), 0);
    return poPayments + supplierPayments;
  }, [pos, payments, supplier]);
  const totalDue = Number(supplier?.balance ?? 0);

  if (!supplier) return <Typography>Loading supplier...</Typography>;

  // Modal style for centering PO modal similar to POTable
  const modalStyle = {
    position: "absolute" as const,
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
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f5f7fa", p: { xs: 2, sm: 3, md: 5 } }}>
      <Box sx={{ mb: 2, textAlign: "right" }}>
        <Button variant="outlined" onClick={() => navigate("/suppliers")}>
          ← Back
        </Button>
      </Box>

      {/* Supplier Info */}
      <Paper sx={{ p: 3, borderRadius: 2, bgcolor: "#fff", border: "1px solid #e0e0e0", mb: 5 }}>
        <Stack spacing={2}>
          <Stack spacing={1}>
            <Typography variant="h4" fontWeight={700} color={PRIMARY_COLOR}>
              {supplier.name}
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={5} flexWrap="nowrap">
              <Stack direction="row" spacing={1} alignItems="center" sx={{ color: PRIMARY_COLOR }}>
                <FaEnvelope />
                <Typography variant="body2">{supplier.email}</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ color: PRIMARY_COLOR }}>
                <FaPhone />
                <Typography variant="body2">{supplier.phone}</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ color: PRIMARY_COLOR }}>
                <FaMapMarkerAlt />
                <Typography variant="body2">{supplier.address || "N/A"}</Typography>
              </Stack>
            </Stack>
          </Stack>
          <Stack direction={{ xs: "column", sm: "row" }} gap={2} sx={{ width: "100%" }}>
            <InnerMetricCard icon={FaShoppingCart} title="Total PO" value={`$${totalPOAmount.toFixed(2)}`} color={PRIMARY_COLOR} bgcolor={LIGHT_BG} sx={{ flex: 1 }} />
            <InnerMetricCard icon={FaMoneyCheckAlt} title="Total Payments" value={`$${totalPayments.toFixed(2)}`} color={PRIMARY_COLOR} bgcolor={LIGHT_BG}  sx={{ flex: 1 }}/>
            <InnerMetricCard icon={FaDollarSign} title="Outstanding Due" value={`$${totalDue.toFixed(2)}`} color={ACCENT_COLOR} bgcolor={LIGHT_BG} sx={{ flex: 1 }}/>
          </Stack>
        </Stack>
      </Paper>

      {/* Tabs */}
      <Tabs value={tab} onChange={(_, val) => setTab(val)} sx={{ mb: 3 }}>
        <Tab label="Purchase Orders" />
        <Tab label="Payments" />
      </Tabs>

      {/* Purchase Orders Table */}
      {tab === 0 && (
        <Box>
          <TableContainer component={Paper} sx={{ boxShadow: "0 8px 20px rgba(0,0,0,0.08)", borderRadius: 4, overflow: "hidden", border: "1px solid #e2e8f0" }}>
            <Box sx={{ p: 2, borderBottom: "1px solid #eee", backgroundColor: "#fff" }}>
              <TextField label="Search Purchase Orders" value={search} onChange={(e) => setSearch(e.target.value)} variant="outlined" size="small" fullWidth />
            </Box>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: PRIMARY_ACCENT }}>
                  <TableCell sx={{ color: "#fff", fontWeight: 700, cursor: "pointer" }}>Invoice</TableCell>
                  <TableCell sx={{ color: "#fff", fontWeight: 700 }}>Date</TableCell>
                  <TableCell sx={{ color: "#fff", fontWeight: 700 }}>Total</TableCell>
                  <TableCell sx={{ color: "#fff", fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {supplierPOs.length ? (
                  supplierPOs.map((po, idx) => (
                    <TableRow key={po.id} hover sx={{ backgroundColor: idx % 2 === 0 ? ROW_ODD_BG : "#fff", "&:hover": { backgroundColor: "#f0f4f8 !important" } }}>
                      <TableCell>{po.invoice_number}</TableCell>
                      <TableCell>{po.nepal_date || "N/A"}</TableCell>
                      <TableCell>${po.total_amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <Tooltip title="View PO Details">
                            <IconButton onClick={() => setViewPO(po)} sx={{ color: ACTION_DEFAULT_COLOR, "&:hover": { color: ACTION_VIEW_COLOR, transform: "scale(1.1)" } }}>
                              <FaEye />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} sx={{ textAlign: "center", py: 4, color: ACTION_DEFAULT_COLOR }}>
                      😕 No purchase orders found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Payments Table */}
      {tab === 1 && (
        <Box>
          <TableContainer component={Paper} sx={{ boxShadow: "0 8px 20px rgba(0,0,0,0.08)", borderRadius: 4, overflow: "hidden", border: "1px solid #e2e8f0" }}>
            <Box sx={{ p: 2, borderBottom: "1px solid #eee", backgroundColor: "#fff" }}>
              <TextField label="Search by receipt number" value={paymentSearch} onChange={(e) => setPaymentSearch(e.target.value)} variant="outlined" size="small" fullWidth />
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
                      <TableCell>${p.amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <Tooltip title="View Payment Details">
                            <IconButton onClick={() => setViewPayment(p)} sx={{ color: ACTION_DEFAULT_COLOR, "&:hover": { color: ACTION_VIEW_COLOR, transform: "scale(1.1)" } }}>
                              <FaEye />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} sx={{ textAlign: "center", py: 4, color: ACTION_DEFAULT_COLOR }}>
                      😕 No payments found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* PO Detail Modal */}
      <Modal
        open={!!viewPO}
        onClose={() => setViewPO(null)}
        BackdropProps={{
          sx: {
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            backgroundColor: "rgba(0,0,0,0.25)",
          },
        }}
      >
        <Box sx={modalStyle}>
          {viewPO && (
            <>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight={700}>
                  Invoice: {viewPO.invoice_number}
                </Typography>
                <IconButton onClick={() => setViewPO(null)} size="small" sx={{ color: ACTION_DEFAULT_COLOR }}>
                  <FaTimes />
                </IconButton>
              </Stack>
              <Divider sx={{ mb: 2 }} />

              {/* Summary */}
              <Stack spacing={1} mb={2} direction="row" flexWrap="wrap" gap={2}>
                <Typography variant="body2">
                  <strong>Date:</strong> {viewPO.date || "N/A"}
                </Typography>
                <Typography variant="body2">
                  <strong>Total:</strong> ${viewPO.total_amount?.toFixed(2)}
                </Typography>
                <Typography variant="body2">
                  <strong>Paid:</strong> ${viewPO.paid_amount?.toFixed(2)}
                </Typography>
                <Typography variant="body2">
                  <strong>Due:</strong> ${viewPO.remaining_amount?.toFixed(2)}
                </Typography>
              </Stack>

              {/* Items Table */}
              <Typography variant="body1" mb={1} fontWeight={600}>
                Items
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
                    {viewPO.items.map((item, idx) => (
                      <TableRow key={idx} sx={{ "&:nth-of-type(odd)": { backgroundColor: "#f9fafb" } }}>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>{item.product_name || item.product || "Unknown"}</TableCell>
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

      {/* Payment Detail Modal (original framer-motion) */}
      <AnimatePresence>
        {viewPayment && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)", zIndex: 1390 }}
              onClick={() => setViewPayment(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.85, x: "-50%", y: "-50%" }}
              animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
              exit={{ opacity: 0, scale: 0.9, x: "-50%", y: "-50%" }}
              style={{ position: "fixed", left: "50%", top: "50%", zIndex: 1400, width: "90%", maxWidth: 500, transformOrigin: "center center" }}
              onClick={(e) => e.stopPropagation()}
            >
              <Paper sx={{ p: 4, borderRadius: 3, bgcolor: "#fff", maxHeight: "90vh", overflowY: "auto" }}>
                <Box sx={{ background: PRIMARY_ACCENT, p: 1.5, borderRadius: 1, mb: 2, textAlign: "center", position: "relative" }}>
                  <Typography variant="h6" sx={{ color: "#fff", fontWeight: 700, letterSpacing: 1 }}>
                    PAYMENT RECEIPT
                  </Typography>
                  <IconButton sx={{ position: "absolute", top: 4, right: 4, color: "#fff", opacity: 0.85 }} onClick={() => setViewPayment(null)} size="small">
                    <FaTimes />
                  </IconButton>
                </Box>
                <Divider sx={{ borderStyle: "dashed", borderColor: "#d1d5db", mb: 2 }} />
                <Stack spacing={1.2} sx={{ fontSize: "14px", color: "#111" }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Receipt #</span>
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
                      ${Number(viewPayment.amount).toFixed(2)}
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
                <Divider sx={{ my: 2, borderStyle: "dashed", borderColor: "#d1d5db" }} />
                <Typography variant="body2" sx={{ textAlign: "center", fontSize: "12px", opacity: 0.7, color: "#000", fontStyle: "italic" }}>
                  ★ Thank you for your payment ★
                </Typography>
              </Paper>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </Box>
  );
};

export default SupplierDetail;
