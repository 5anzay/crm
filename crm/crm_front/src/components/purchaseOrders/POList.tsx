import React, { useState, useEffect, useMemo, useRef } from "react";
import POForm from "./POForm";
import POTable from "./POTable"; // Updated Table version
import { fetchPOs, createPO, updatePO, deletePO } from "./api";
import type { PurchaseOrder } from "./types";
import { useLocation } from "react-router-dom";
import {
  Box,
  Stack,
  Button,

  Typography,
  Pagination,
  PaginationItem,
} from "@mui/material";
import { toast, ToastContainer } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import "react-toastify/dist/ReactToastify.css";

const getPageSize = () =>
  window.innerWidth >= 1200 ? 12 : window.innerWidth >= 768 ? 6 : 3;

const POList: React.FC = () => {
  const [pos, setPOs] = useState<PurchaseOrder[]>([]);
  const [editingPO, setEditingPO] = useState<PurchaseOrder | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [search,] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(getPageSize());
  const addButtonRef = useRef<HTMLButtonElement | null>(null);
  const [startPos, setStartPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const loadPOs = async () => {
    try {
      const data = await fetchPOs();
      const cleaned = data.map((po) => ({
        ...po,
        total_amount: Number(po.total_amount ?? 0),
        paid_amount: Number(po.paid_amount ?? 0),
        remaining_amount: Number(po.remaining_amount ?? 0),
        date: po.date || "",
        items:
          po.items?.map((item) => ({
            ...item,
            quantity: Number(item.quantity ?? 0),
            cost_price: Number(item.cost_price ?? 0),
          })) ?? [],
      }));
      setPOs(cleaned);
    } catch {
      toast.error("Failed to load purchase orders");
    }
  };

  useEffect(() => {
    loadPOs();
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    const handleResize = () => setPageSize(getPageSize());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSubmit = async (
    data: Omit<PurchaseOrder, "id" | "total_amount" | "remaining_amount">
  ) => {
    try {
      if (editingPO) {
        await updatePO(editingPO.id!, data);
        toast.success("Purchase Order updated!");
        setEditingPO(null);
      } else {
        await createPO(data);
        toast.success("Purchase Order added!");
      }
      setFormVisible(false);
      loadPOs();
    } catch {
      toast.error("Failed to save Purchase Order");
    }
  };

  const handleEdit = (po: PurchaseOrder) => {
    setEditingPO({ ...po, date: po.date || "" });
    if (addButtonRef.current) {
      const rect = addButtonRef.current.getBoundingClientRect();
      setStartPos({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    }
    setFormVisible(true);
  };

  const handleDelete = (po: PurchaseOrder) => {
    toast.info(
      <div>
        <p>
          Delete Purchase Order <strong>{po.invoice_number}</strong>?
        </p>
        <Stack direction="row" spacing={1} justifyContent="flex-end" mt={1}>
          <Button
            variant="contained"
            size="small"
            color="error"
            onClick={async () => {
              try {
                await deletePO(po.id!);
                toast.dismiss();
                toast.success("Deleted!");
                loadPOs();
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

  // Search + pagination
  const filteredPOs = useMemo(
    () =>
      pos.filter(
        (p) =>
          p.invoice_number.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          (p.date?.toLowerCase().includes(debouncedSearch.toLowerCase()) ?? false)
      ),
    [pos, debouncedSearch]
  );

  const totalPages = Math.ceil(filteredPOs.length / pageSize);
  const currentData = filteredPOs.slice((page - 1) * pageSize, page * pageSize);

  // Open form from Add button
  const openFormFromButton = () => {
    if (addButtonRef.current) {
      const rect = addButtonRef.current.getBoundingClientRect();
      setStartPos({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    }
    setFormVisible(true);
  };

  // Open form from dashboard state
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

      {/* Header Section */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h5" fontWeight={800} color="#334155">
          Purchase Orders
        </Typography>
        <Button
          ref={addButtonRef}
          sx={{
            textTransform: "none",
            background: "linear-gradient(180deg, #1e3c72, #2a5298)",
            color: "#fff",
            borderRadius: 3,
            "&:hover": { background: "linear-gradient(90deg, #1e3c72, #2a5298)" },
            mt: { xs: 1, sm: 0 },
            minWidth: 140,
          }}
          variant="contained"
          onClick={() => {
            setEditingPO(null);
            openFormFromButton();
          }}
        >
          Add PO
        </Button>
      </Stack>

      {/* Table */}
      <POTable purchaseOrders={currentData} onEdit={handleEdit} onDelete={handleDelete} />

      {/* Pagination */}
      {totalPages >= 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, val) => setPage(val)}
            renderItem={(item) => (
              <PaginationItem
                {...item}
                sx={{
                  color: "#2d469f",
                  "&.Mui-selected": {
                    background: "linear-gradient(180deg, #1e3c72, #2a5298)",
                    color: "#fff",
                  },
                }}
              />
            )}
          />
        </Box>
      )}

      {/* Animated Form */}
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
              initial={{
                opacity: 0,
                scale: 0,
                top: startPos.y,
                left: startPos.x,
                translateX: "-50%",
                translateY: "-50%",
              }}
              animate={{
                opacity: 1,
                scale: 1,
                top: "50%",
                left: "58%",
                translateX: "-50%",
                translateY: "-50%",
              }}
              exit={{ opacity: 0, scale: 0, top: startPos.y, left: startPos.x }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              style={{ position: "fixed", zIndex: 1000, width: "95%", maxWidth: 1100 }}
            >
              <POForm
                visible={formVisible}
                onClose={() => setFormVisible(false)}
                onSubmit={handleSubmit}
                initialData={editingPO || undefined}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </Box>
  );
};

export default POList;
