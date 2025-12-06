// src/components/returns/ReturnList.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Stack,
  Button,
  Typography,
  Pagination,
  PaginationItem,
  Card,
  CardContent,
} from "@mui/material";
import { toast, ToastContainer } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import "react-toastify/dist/ReactToastify.css";
import { TrendingUp, Calendar } from "lucide-react";

import ReturnForm from "./ReturnForm";
import ReturnTable from "./ReturnTable";
import type { Return, ReturnItem } from "./types";
import { fetchReturns, createReturn, updateReturn, deleteReturn } from "./api";

const getPageSize = () =>
  window.innerWidth >= 1200 ? 12 : window.innerWidth >= 768 ? 6 : 3;

const ReturnList: React.FC = () => {
  const [returns, setReturns] = useState<Return[]>([]);
  const [editingReturn, setEditingReturn] = useState<Return | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(getPageSize());
  const addButtonRef = useRef<HTMLButtonElement | null>(null);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [viewingReturn, setViewingReturn] = useState<Return | null>(null);
  const [viewModalVisible, setViewModalVisible] = useState(false);

  const loadReturns = async () => {
    try {
      const data = await fetchReturns();
      const normalized = data.map((r: Return) => ({
        ...r,
        total_refund: r.total_refund ?? 0,
      }));
      setReturns(normalized);
    } catch {
      toast.error("Failed to load returns");
    }
  };

  useEffect(() => {
    loadReturns();
  }, []);

  useEffect(() => {
    const handleResize = () => setPageSize(getPageSize());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const computeTotalRefund = (items: ReturnItem[]) =>
    items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);

  const handleSubmit = async (data: Omit<Return, "id" | "total_refund">) => {
    try {
      const payload: Omit<Return, "id"> = {
        ...data,
        total_refund: computeTotalRefund(data.items),
        date: data.date || new Date().toISOString().split("T")[0],
      };

      if (editingReturn?.id) {
        await updateReturn(editingReturn.id, payload);
        toast.success("Return updated!");
        setEditingReturn(null);
      } else {
        await createReturn(payload);
        toast.success("Return added!");
      }

      setFormVisible(false);
      loadReturns();
    } catch {
      toast.error("Failed to save return");
    }
  };

  const handleView = (ret: Return) => {
    setViewingReturn(ret);
    setViewModalVisible(true);
  };

  const handleDelete = (ret: Return) => {
    toast.info(
      <div>
        <p>
          Delete Return <strong>{ret.id}</strong>?
        </p>
        <Stack direction="row" spacing={1} justifyContent="flex-end" mt={1}>
          <Button
            variant="contained"
            size="small"
            color="error"
            onClick={async () => {
              try {
                if (ret.id) await deleteReturn(ret.id);
                toast.dismiss();
                toast.success("Deleted!");
                loadReturns();
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

  const totalPages = Math.ceil(returns.length / pageSize);
  const currentData = returns.slice((page - 1) * pageSize, page * pageSize);

  const openFormFromButton = () => {
    if (addButtonRef.current) {
      const rect = addButtonRef.current.getBoundingClientRect();
      setStartPos({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    }
    setFormVisible(true);
  };

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const totalThisMonth = returns
    .filter(r => new Date(r.date!).getMonth() === currentMonth && new Date(r.date!).getFullYear() === currentYear)
    .reduce((sum, r) => sum + (r.total_refund ?? 0), 0);

  const totalThisYear = returns
    .filter(r => new Date(r.date!).getFullYear() === currentYear)
    .reduce((sum, r) => sum + (r.total_refund ?? 0), 0);

  return (
    <Box sx={{ minHeight: "100vh", p: { xs: 2, sm: 3, md: 4 }, bgcolor: "#f0f4f8" }}>
      <ToastContainer position="top-right" autoClose={2000} />

      {/* Total Refund Cards */}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={3} mb={3}>
        {[
          {
            title: "Total Refunds This Month",
            amount: totalThisMonth,
            icon: <TrendingUp size={28} />,
            color: "#4a78a9",
          },
          {
            title: "Total Refunds This Year",
            amount: totalThisYear,
            icon: <Calendar size={28} />,
            color: "#1e3c72",
          },
        ].map((card, idx) => (
          <Card
            key={idx}
            sx={{
              flex: 1,
              boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
              borderRadius: "16px",
              transition: "transform 0.3s, box-shadow 0.3s",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: "0 12px 25px rgba(0,0,0,0.15)",
              },
            }}
          >
            <CardContent>
              <Stack direction="row" spacing={3} alignItems="center">
                <Box
                  sx={{
                    p: 2,
                    borderRadius: "50%",
                    bgcolor: card.color,
                    color: "#fff",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                    display: "flex",
                  }}
                >
                  {card.icon}
                </Box>
                <Stack spacing={0.5}>
                  <Typography variant="body2" color="#475569" fontWeight={500}>
                    {card.title}
                  </Typography>
                  <Typography variant="h5" fontWeight={800} color="#1e3c72">
                    {card.amount.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                  </Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>

      {/* Header & Add Button */}
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={800} color="#334155">
          Returns
        </Typography>
        <Button
          ref={addButtonRef}
          variant="contained"
          onClick={() => { setEditingReturn(null); openFormFromButton(); }}
          sx={{
            textTransform: "none",
            background: "linear-gradient(180deg, #1e3c72, #2a5298)",
            color: "#fff",
            borderRadius: 3,
            "&:hover": { background: "linear-gradient(90deg, #1e3c72, #2a5298)", transform: "scale(1.05)" },
            mt: { xs: 1, sm: 0 },
            minWidth: 140,
          }}
        >
          Add Return
        </Button>
      </Stack>

      {/* Return Table */}
      <ReturnTable
        returns={currentData}
        onDelete={handleDelete}
        onView={handleView}
        formatAmount={(amt) => (typeof amt === "number" ? amt.toFixed(2) : amt)}
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

      {/* Form Modal */}
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
              style={{
                position: "fixed",
                top: "50%",
                left: "60%",
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
            >
              <ReturnForm
                visible={formVisible}
                onClose={() => setFormVisible(false)}
                onSubmit={handleSubmit}
                initialData={editingReturn || undefined}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* View Modal */}
      <AnimatePresence>
        {viewModalVisible && viewingReturn && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ position: "fixed", inset: 0, backgroundColor: "black", zIndex: 999 }}
              onClick={() => setViewModalVisible(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              style={{
                position: "fixed",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                zIndex: 1400,
                width: "90%",
                maxWidth: 600,
                backgroundColor: "#fff",
                borderRadius: 12,
                padding: 24,
                boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
              }}
            >
              <Typography variant="h6" fontWeight={700} mb={2}>
                Return #{viewingReturn.id}
              </Typography>
              <Stack spacing={1.5}>
                <Typography><b>Sale:</b> {viewingReturn.sale}</Typography>
                <Typography><b>Customer:</b> {viewingReturn.customer}</Typography>
                <Typography><b>Date:</b> {viewingReturn.date}</Typography>
                <Typography><b>Nepali Date:</b> {viewingReturn.nepal_date}</Typography>
                <Typography><b>Total Refund:</b> {viewingReturn.total_refund}</Typography>
                <Typography><b>Comment:</b> {viewingReturn.comment}</Typography>
              </Stack>
              <Box textAlign="right" mt={3}>
                <Button variant="contained" onClick={() => setViewModalVisible(false)} sx={{ textTransform: "none" }}>
                  Close
                </Button>
              </Box>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </Box>
  );
};

export default ReturnList;
