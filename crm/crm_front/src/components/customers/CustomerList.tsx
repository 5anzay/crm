import React, { useState, useEffect, useMemo, useRef } from "react";
import CustomerForm from "./CustomerForm";
import CustomerTable from "./CustomerTable";
import type { Customer } from "./types";
import { fetchCustomers, createCustomer, updateCustomer, deleteCustomer } from "./api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Box, Button, Stack, Pagination, PaginationItem, Typography } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

const getPageSize = () => {
  if (window.innerWidth >= 1200) return 12;
  if (window.innerWidth >= 768) return 6;
  return 3;
};

const CustomerList: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(getPageSize());
  const [startPos, setStartPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const addButtonRef = useRef<HTMLButtonElement | null>(null);
  const navigate = useNavigate();

  const loadCustomers = async () => {
    try {
      const data = await fetchCustomers();
      setCustomers(data);
    } catch {
      toast.error("Failed to load customers");
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    const handleResize = () => setPageSize(getPageSize());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSubmit = async (data: Omit<Customer, "id">) => {
    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, data);
        toast.success("Customer updated!");
        setEditingCustomer(null);
      } else {
        await createCustomer(data);
        toast.success("Customer added!");
      }
      loadCustomers();
      setFormVisible(false);
    } catch {
      toast.error("Failed to save customer");
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    openFormFromButton();
  };

  const handleDelete = (customer: Customer) => {
    toast.info(
      <div>
        <p>Are you sure you want to delete <strong>{customer.name}</strong>?</p>
        <Stack direction="row" spacing={1} justifyContent="flex-end" mt={1}>
          <Button
            variant="contained"
            size="small"
            color="error"
            onClick={async () => {
              try {
                await deleteCustomer(customer.id);
                toast.dismiss();
                toast.success("Customer deleted!");
                loadCustomers();
              } catch {
                toast.error("Failed to delete customer");
              }
            }}
          >
            Yes
          </Button>
          <Button variant="outlined" size="small" onClick={() => toast.dismiss()}>Cancel</Button>
        </Stack>
      </div>,
      { autoClose: false, closeOnClick: false }
    );
  };

  const openFormFromButton = () => {
    if (addButtonRef.current) {
      const rect = addButtonRef.current.getBoundingClientRect();
      setStartPos({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    }
    setFormVisible(true);
  };

  const totalPages = Math.ceil(customers.length / pageSize);
  const currentData = useMemo(() => {
    return customers.slice((page - 1) * pageSize, page * pageSize);
  }, [customers, page, pageSize]);

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f0f4f8", p: { xs: 2, sm: 3, md: 4 } }}>
      <ToastContainer position="top-right" autoClose={2000} />

      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        mb={3}
      >
        <Typography variant="h5" fontWeight={800} color="#334155">
          Customers Dashboard
        </Typography>
        <Button
          ref={addButtonRef}
          variant="contained"
          onClick={() => { setEditingCustomer(null); openFormFromButton(); }}
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
          Add Customer
        </Button>
      </Stack>

      <CustomerTable
        customers={currentData}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={(c) => navigate(`/customers/${c.id}`)} // Navigate to CustomerDetail
      />

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
              <CustomerForm
                visible={formVisible}
                onClose={() => setFormVisible(false)}
                onSubmit={handleSubmit}
                initialData={editingCustomer || undefined}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </Box>
  );
};

export default CustomerList;
