import React, { useState, useEffect, useRef } from "react";
import { Box, Stack, Button, Typography, Pagination, PaginationItem } from "@mui/material";
import { toast, ToastContainer } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import "react-toastify/dist/ReactToastify.css";
import { useLocation } from "react-router-dom";

import CustomerPaymentForm from "./CustomerPaymentForm";
import CustomerPaymentTable from "./CustomerPaymentTable";
import type { CustomerPayment } from "./types";
import { fetchPayments, createPayment, updatePayment, deletePayment } from "./api";

const getPageSize = () =>
  window.innerWidth >= 1200 ? 12 : window.innerWidth >= 768 ? 6 : 3;

const CustomerPaymentList: React.FC = () => {
  const [payments, setPayments] = useState<CustomerPayment[]>([]);
  const [editingPayment, setEditingPayment] = useState<CustomerPayment | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(getPageSize());
  const addButtonRef = useRef<HTMLButtonElement | null>(null);
  const [startPos, setStartPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const loadPayments = async () => {
    try {
      const data = await fetchPayments();
      setPayments(data);
    } catch {
      toast.error("Failed to load customer payments");
    }
  };

  useEffect(() => { loadPayments(); }, []);

  useEffect(() => {
    const handleResize = () => setPageSize(getPageSize());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSubmit = async (data: Omit<CustomerPayment, "id" | "created_at">) => {
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

  const handleEdit = (payment: CustomerPayment) => {
    setEditingPayment(payment);
    if (addButtonRef.current) {
      const rect = addButtonRef.current.getBoundingClientRect();
      setStartPos({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    }
    setFormVisible(true);
  };

  const handleDelete = (payment: CustomerPayment) => {
    toast.info(
      <div>
        <p>
          Delete Payment <strong>{payment.receipt_number || payment.id}</strong>?
        </p>
        <Stack direction="row" spacing={1} justifyContent="flex-end" mt={1}>
          <Button
            variant="contained"
            size="small"
            color="error"
            onClick={async () => {
              try {
                await deletePayment(payment.id!);
                toast.dismiss();
                toast.success("Deleted!");
                loadPayments();
              } catch {
                toast.error("Failed to delete");
              }
            }}
          >
            Yes
          </Button>
          <Button variant="outlined" size="small" onClick={() => toast.dismiss()}>
            Cancel
          </Button>
        </Stack>
      </div>,
      { autoClose: false, closeOnClick: false }
    );
  };

  const formatAmount = (amount: string | number) => {
    const num = typeof amount === "number" ? amount : parseFloat(amount as string);
    return isNaN(num) ? "0.00" : num.toFixed(2);
  };

  const currentData = payments.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(payments.length / pageSize);

  const openFormFromButton = () => {
    if (addButtonRef.current) {
      const rect = addButtonRef.current.getBoundingClientRect();
      setStartPos({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    }
    setFormVisible(true);
  };

  const location = useLocation();
  useEffect(() => {
    if (location.state?.openForm) {
      setFormVisible(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  return (
    <Box sx={{ minHeight: "100vh", p: { xs: 2, sm: 3, md: 4 }, bgcolor: "#f0f4f8" }}>
      <ToastContainer position="top-right" autoClose={2000} />

      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={800} color="#334155">
          Customer Payments
        </Typography>
        <Button
          ref={addButtonRef}
          variant="contained"
          onClick={() => { setEditingPayment(null); openFormFromButton(); }}
          sx={{
            textTransform: "none",
            background: "linear-gradient(180deg, #1e3c72, #2a5298)",
            color: "#fff",
            borderRadius: 3,
            "&:hover": { background: "linear-gradient(180deg, #1e3c72, #2a5298)" },
            mt: { xs: 1, sm: 0 },
            minWidth: 140,
          }}
        >
          Add Payment
        </Button>
      </Stack>

      {/* CUSTOMER PAYMENT TABLE */}
      <CustomerPaymentTable
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
      <AnimatePresence>
        {formVisible && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ position: "fixed", inset: 0, backgroundColor: "black", zIndex: 999 }}
              onClick={() => setFormVisible(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0, top: startPos.y, left: startPos.x, translateX: "-50%", translateY: "-50%" }}
              animate={{ opacity: 1, scale: 1, top: "50%", left: "50%", translateX: "-50%", translateY: "-50%" }}
              exit={{ opacity: 0, scale: 0, top: startPos.y, left: startPos.x }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              style={{ position: "fixed", zIndex: 1000, width: "95%", maxWidth: 600 }}
            >
              <CustomerPaymentForm
                visible={formVisible}
                onClose={() => setFormVisible(false)}
                onSubmit={handleSubmit}
                initialData={editingPayment || undefined}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </Box>
  );
};

export default CustomerPaymentList;
