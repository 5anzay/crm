// src/components/expenses/ExpenseList.tsx
import React, { useState, useEffect, useRef } from "react";
import { Box, Stack, Button, Typography, Pagination, PaginationItem, Card, CardContent } from "@mui/material";
import { toast, ToastContainer } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import "react-toastify/dist/ReactToastify.css";
import { TrendingUp, Calendar } from "lucide-react";

import ExpenseForm from "./ExpenseForm";
import ExpenseTable from "./ExpenseTable";
import type { Expense } from "./types";
import { fetchExpenses, createExpense, updateExpense, deleteExpense } from "./api";

const getPageSize = () =>
  window.innerWidth >= 1200 ? 12 : window.innerWidth >= 768 ? 6 : 3;

const ExpenseList: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(getPageSize());
  const addButtonRef = useRef<HTMLButtonElement | null>(null);
  const [startPos, setStartPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const loadExpenses = async () => {
    try {
      const data = await fetchExpenses();
      const normalized = data.map((e: Expense) => ({
        ...e,
        amount: typeof e.amount === "number" ? e.amount : parseFloat(e.amount as any) || 0,
      }));
      setExpenses(normalized);
    } catch {
      toast.error("Failed to load expenses");
    }
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  useEffect(() => {
    const handleResize = () => setPageSize(getPageSize());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSubmit = async (data: Omit<Expense, "id">) => {
    try {
      const payload = {
        ...data,
        amount: Number(data.amount),
        date: data.date || new Date().toISOString().split("T")[0],
      };

      if (editingExpense) {
        await updateExpense(editingExpense.id!, payload);
        toast.success("Expense updated!");
        setEditingExpense(null);
      } else {
        await createExpense(payload);
        toast.success("Expense added!");
      }

      setFormVisible(false);
      loadExpenses();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save expense");
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    if (addButtonRef.current) {
      const rect = addButtonRef.current.getBoundingClientRect();
      setStartPos({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    }
    setFormVisible(true);
  };

  const handleDelete = (expense: Expense) => {
    toast.info(
      <div>
        <p>
          Delete Expense <strong>{expense.id}</strong>?
        </p>
        <Stack direction="row" spacing={1} justifyContent="flex-end" mt={1}>
          <Button
            variant="contained"
            size="small"
            color="error"
            onClick={async () => {
              try {
                await deleteExpense(expense.id!);
                toast.dismiss();
                toast.success("Deleted!");
                loadExpenses();
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

  const totalPages = Math.ceil(expenses.length / pageSize);
  const currentData = expenses.slice((page - 1) * pageSize, page * pageSize);

  const openFormFromButton = () => {
    if (addButtonRef.current) {
      const rect = addButtonRef.current.getBoundingClientRect();
      setStartPos({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    }
    setFormVisible(true);
  };

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const totalThisMonth = expenses
    .filter(e => new Date(e.date!).getMonth() === currentMonth && new Date(e.date!).getFullYear() === currentYear)
    .reduce((sum, e) => sum + e.amount, 0);

  const totalThisYear = expenses
    .filter(e => new Date(e.date!).getFullYear() === currentYear)
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <Box sx={{ minHeight: "100vh", p: { xs: 2, sm: 3, md: 4 }, bgcolor: "#f0f4f8" }}>
      <ToastContainer position="top-right" autoClose={2000} />

      <Stack direction={{ xs: "column", sm: "row" }} spacing={3} mb={3}>
  {/* Monthly Expense Card */}
  <Card
    sx={{
      flex: 1,
      boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
      //borderLeft: `6px solid #4a78a9`,
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
            bgcolor: "#4a78a9",
            color: "#fff",
            boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
            display: "flex",
          }}
        >
          <TrendingUp size={28} />
        </Box>
        <Stack spacing={0.5}>
          <Typography variant="body2" color="#475569" fontWeight={500}>
            Total Expenses This Month
          </Typography>
          <Typography variant="h5" fontWeight={800} color="#1e3c72">
            {totalThisMonth.toLocaleString("en-US", { style: "currency", currency: "USD" })}
          </Typography>
        </Stack>
      </Stack>
    </CardContent>
  </Card>

  {/* Yearly Expense Card */}
  <Card
    sx={{
      flex: 1,
      boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
    //  borderLeft: `6px solid #1e3c72`,
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
            bgcolor: "#1e3c72",
            color: "#fff",
            boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
            display: "flex",
          }}
        >
          <Calendar size={28} />
        </Box>
        <Stack spacing={0.5}>
          <Typography variant="body2" color="#475569" fontWeight={500}>
            Total Expenses This Year
          </Typography>
          <Typography variant="h5" fontWeight={800} color="#1e3c72">
            {totalThisYear.toLocaleString("en-US", { style: "currency", currency: "USD" })}
          </Typography>
        </Stack>
      </Stack>
    </CardContent>
  </Card>
</Stack>


      {/* Header & Add Button */}
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={800} color="#334155">
          Expenses
        </Typography>
        <Button
          ref={addButtonRef}
          variant="contained"
          onClick={() => { setEditingExpense(null); openFormFromButton(); }}
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
          Add Expense
        </Button>
      </Stack>

      {/* Expense Table */}
      <ExpenseTable
        expenses={currentData}
        onEdit={handleEdit}
        onDelete={handleDelete}
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
              style={{ position: "fixed", zIndex: 1000, width: "95%", maxWidth: 600 }}
            >
              <ExpenseForm
                visible={formVisible}
                onClose={() => setFormVisible(false)}
                onSubmit={handleSubmit}
                initialData={editingExpense || undefined}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </Box>
  );
};

export default ExpenseList;
