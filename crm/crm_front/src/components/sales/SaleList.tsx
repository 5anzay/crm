// src/components/sales/SaleList.tsx
import React, { useState, useEffect, useRef } from "react";
import SaleForm from "./SaleForm";
import SaleTable from "./SaleTable";
import { fetchSales, createSale, updateSale, deleteSale } from "./api";
import type { Sale } from "./types";

import { useLocation } from "react-router-dom";

import { Box, Stack, Button, Typography, Pagination, PaginationItem } from "@mui/material";
import { toast, ToastContainer } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import "react-toastify/dist/ReactToastify.css";

const getPageSize = () => (window.innerWidth >= 1200 ? 12 : window.innerWidth >= 768 ? 6 : 3);

const SaleList: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(getPageSize());
  const addButtonRef = useRef<HTMLButtonElement | null>(null);

  const safeDate = (value?: string | Date): string => {
    if (!value) return new Date().toISOString().slice(0, 10);
    const date = value instanceof Date ? value : new Date(value);
    return !isNaN(date.getTime()) ? date.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
  };

  const loadSales = async () => {
    try {
      const data = await fetchSales();
      const cleaned = data.map((sale) => ({
        ...sale,
        total_amount: Number(sale.total_amount ?? 0),
        paid_amount: Number(sale.paid_amount ?? 0),
        remaining_amount: Number(sale.remaining_amount ?? 0),
        date: safeDate(sale.date),
        items:
          sale.items?.map((item) => ({
            ...item,
            quantity: Number(item.quantity ?? 0),
            unit_price: Number(item.unit_price ?? 0),
          })) ?? [],
      }));
      setSales(cleaned);
    } catch {
      toast.error("Failed to load sales");
    }
  };

  useEffect(() => {
    loadSales();
  }, []);

  // Adjust page size on window resize
  useEffect(() => {
    const handleResize = () => setPageSize(getPageSize());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSubmit = async (data: Omit<Sale, "id" | "total_amount" | "remaining_amount" | "invoice_number">) => {
    try {
      const formattedData = { ...data, date: safeDate(data.date) };
      if (editingSale?.id) {
        await updateSale(editingSale.id, formattedData);
        toast.success("Sale updated!");
        setEditingSale(null);
      } else {
        await createSale(formattedData);
        toast.success("Sale added!");
      }
      setFormVisible(false);
      loadSales();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save sale");
    }
  };

  const handleEdit = (sale: Sale) => {
    setEditingSale({ ...sale, date: safeDate(sale.date) });
    setFormVisible(true);
  };

  const handleDelete = (sale: Sale) => {
    toast.info(
      <div>
        <p>
          Delete Sale <strong>{sale.invoice_number}</strong>?
        </p>
        <Stack direction="row" spacing={1} justifyContent="flex-end" mt={1}>
          <Button
            variant="contained"
            size="small"
            color="error"
            onClick={async () => {
              try {
                await deleteSale(sale.id!);
                toast.dismiss();
                toast.success("Deleted!");
                loadSales();
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

  const totalPages = Math.ceil(sales.length / pageSize);
  const currentData = sales.slice((page - 1) * pageSize, page * pageSize);

  const openFormFromButton = () => {
    setEditingSale(null);
    setFormVisible(true);
  };

  const location = useLocation();
  useEffect(() => {
    if (location.state?.openForm) {
      setFormVisible(true);
      window.history.replaceState({}, document.title); // clear state to prevent reopening on refresh
    }
  }, [location.state]);

  return (
    <Box sx={{ flex: 1, position: "relative", p: { xs: 2, sm: 3, md: 4 } }}>
      <ToastContainer position="top-right" autoClose={2000} />

      {/* Header */}
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={800} color="#334155">
          Sales
        </Typography>
        <Button
          ref={addButtonRef}
          variant="contained"
          onClick={openFormFromButton}
          sx={{
            textTransform: "none",
            background: "linear-gradient(180deg, #1e3c72, #2a5298)",
            color: "#fff",
            borderRadius: 3,
            "&:hover": { bgcolor: "#1f306e" },
            mt: { xs: 1, sm: 0 },
            minWidth: 140,
          }}
        >
          Add Sale
        </Button>
      </Stack>

      {/* Sale Table */}
      <SaleTable
        sales={currentData}
        onEdit={handleEdit}
        onDelete={handleDelete}
        
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
                  "&:hover": { backgroundColor: "#1f306e" },
                },
              }}
            />
          )}
        />
      </Box>

      {/* Sale Form Modal */}
      <AnimatePresence>
        {formVisible && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "black",
                zIndex: 999,
              }}
              onClick={() => setFormVisible(false)}
            />

            {/* Modal */}
            <motion.div
            initial={{ opacity: 0, scale: 0.85, x: "-50%", y: "-50%" }}
          animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
          exit={{ opacity: 0, scale: 0.9, x: "-50%", y: "-50%" }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          style={{

            position: "fixed",
            top: "50%",
            left: "55%",
            zIndex: 1400,
            transformOrigin: "center center",
            maxHeight: "90vh",
            overflowY: "auto",
            width: "90%",
            maxWidth: 1000,
            padding: 3,
            backgroundColor: "#f0f4f8",
            borderRadius: 8,
            boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
          }}
          onClick={(e) => e.stopPropagation()}


            >
              <SaleForm
                visible={formVisible}
                onClose={() => setFormVisible(false)}
                onSubmit={handleSubmit}
                initialData={editingSale || undefined}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </Box>
  );
};

export default SaleList;
