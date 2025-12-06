import React, { useState, useEffect } from "react";
import { Box, Stack, Button, Typography, Modal, Pagination, PaginationItem } from "@mui/material";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useLocation } from "react-router-dom";
import SupplierPaymentForm from "./SupplierPaymentForm";
import SupplierPaymentTable from "./SupplierPaymentTable";
import type { SupplierPayment } from "./types";
import { fetchPayments, createPayment, updatePayment, deletePayment } from "./api";

const getPageSize = () =>
  window.innerWidth >= 1200 ? 12 : window.innerWidth >= 768 ? 6 : 3;

const SupplierPaymentList: React.FC = () => {
  const [payments, setPayments] = useState<SupplierPayment[]>([]);
  const [editingPayment, setEditingPayment] = useState<SupplierPayment | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(getPageSize());

  const loadPayments = async () => {
    try {
      const data = await fetchPayments();
      setPayments(data);
    } catch {
      toast.error("Failed to load supplier payments");
    }
  };

  useEffect(() => { loadPayments(); }, []);

  useEffect(() => {
    const handleResize = () => setPageSize(getPageSize());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const location = useLocation();
  useEffect(() => {
    if (location.state?.openForm) {
      setFormVisible(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleSubmit = async (data: Omit<SupplierPayment, "id" | "created_at">) => {
    try {
      if (editingPayment) {
        await updatePayment(editingPayment.id!, data);
        toast.success("Payment updated!");
        setEditingPayment(null);
      } else {
        await createPayment(data);
        toast.success("Payment added!");
      }
      setFormVisible(false);
      loadPayments();
    } catch {
      toast.error("Failed to save payment");
    }
  };

  const handleEdit = (payment: SupplierPayment) => {
    setEditingPayment(payment);
    setFormVisible(true);
  };

  const handleDelete = async (payment: SupplierPayment) => {
    if (!window.confirm(`Delete Payment ${payment.receipt_number ?? payment.id}?`)) return;
    try {
      await deletePayment(payment.id!);
      toast.success("Payment deleted!");
      loadPayments();
    } catch {
      toast.error("Failed to delete payment");
    }
  };

  const formatAmount = (amount: string | number) => {
    const num = typeof amount === "number" ? amount : parseFloat(amount as string);
    return isNaN(num) ? "0.00" : num.toFixed(2);
  };

  const totalPages = Math.ceil(payments.length / pageSize);
  const currentData = payments.slice((page - 1) * pageSize, page * pageSize);

  return (
    <Box sx={{ minHeight: "100vh", p: { xs: 2, sm: 3, md: 4 }, bgcolor: "#f0f4f8" }}>
      <ToastContainer position="top-right" autoClose={2000} />

      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={800} color="#334155">Supplier Payments</Typography>
        <Button
          variant="contained"
          onClick={() => { setEditingPayment(null); setFormVisible(true); }}
          sx={{
            textTransform: "none",
            background: "linear-gradient(180deg, #1e3c72, #2a5298)",
            color: "#fff",
            borderRadius: 3,
            "&:hover": { background: "linear-gradient(90deg, #1e3c72, #2a5298)" },
            mt: { xs: 1, sm: 0 },
            minWidth: 140,
          }}
        >
          Add Payment
        </Button>
      </Stack>

      {/* SUPPLIER PAYMENT TABLE */}
      <SupplierPaymentTable
        payments={currentData}
        onEdit={handleEdit}
        onDelete={handleDelete}
        formatAmount={formatAmount}
      />

      {/* Pagination */}
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <Pagination
          count={Math.max(totalPages, 1)}
          page={page}
          onChange={(_, value) => setPage(value)}
          renderItem={(item) => (
            <PaginationItem
              {...item}
              sx={{
                color: "#2d469f",
                "&.Mui-selected": {
                  background: "linear-gradient(180deg, #1e3c72, #2a5298)",
                  color: "#fff",
                  "&:hover": { background: "linear-gradient(90deg, #1e3c72, #2a5298)" },
                },
              }}
            />
          )}
        />
      </Box>

      {/* FORM MODAL */}
      <Modal open={formVisible} onClose={() => setFormVisible(false)}>
        <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", bgcolor: "#fff", borderRadius: 2, p: 4, minWidth: 400, maxWidth: 600 }}>
          <SupplierPaymentForm
            visible={formVisible}
            onClose={() => setFormVisible(false)}
            onSubmit={handleSubmit}
            initialData={editingPayment || undefined}
          />
        </Box>
      </Modal>
    </Box>
  );
};

export default SupplierPaymentList;
