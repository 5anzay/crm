// src/components/sales/SaleForm.tsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Stack,
  TextField,
  Button,
  Typography,
  IconButton,
  Autocomplete,
  Paper,
} from "@mui/material";
import { Add, Remove } from "@mui/icons-material";
import type { Sale, SaleItem } from "./types";
import type { Customer } from "../customers/types";
import type { Product } from "../products/types";
import { fetchCustomers } from "../customers/api";
import { fetchProducts } from "../products/api";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (
    data: Omit<Sale, "id" | "invoice_number" | "total_amount" | "remaining_amount">
  ) => Promise<void>;
  initialData?: Sale;
}

const SaleForm: React.FC<Props> = ({ visible, onClose, onSubmit, initialData }) => {
  const [saleDate, setSaleDate] = useState("");
  const [paidAmount, setPaidAmount] = useState(0);
  const [customerId, setCustomerId] = useState<number | undefined>(undefined);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<SaleItem[]>([]);
  const [nepalDate, setNepalDate] = useState("");
  const [comment, setComment] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [custData, prodData] = await Promise.all([
          fetchCustomers(),
          fetchProducts(),
        ]);
        setCustomers(custData || []);
        setProducts(prodData || []);
      } catch (err) {
        console.error("Failed to load customers/products", err);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (initialData) {
      setSaleDate(initialData.date ?? new Date().toISOString().slice(0, 10));
      setPaidAmount(initialData.paid_amount);
      setCustomerId(initialData.customer ?? undefined);
      setNepalDate(initialData.nepal_date || "");
      setComment(initialData.comment || "");
      setItems(
        initialData.items?.map((i) => ({
          ...i,
          product: typeof i.product === "number" ? i.product : undefined,
        })) || [{ product_name: "", quantity: 1, unit_price: 0 }]
      );
    } else {
      setSaleDate(new Date().toISOString().slice(0, 10));
      setPaidAmount(0);
      setCustomerId(undefined);
      setNepalDate("");
      setComment("");
      setItems([{ product_name: "", quantity: 1, unit_price: 0 }]);
    }
  }, [initialData]);

  const handleItemChange = (index: number, field: keyof SaleItem, value: string | number) => {
    setItems((prev) => {
      const updated = [...prev];
      if (field === "quantity" || field === "unit_price") {
        updated[index][field] = Number(value) || 0;
      } else if (field === "product_name") {
        updated[index][field] = String(value) || "";
      }
      return updated;
    });
  };

  const addItem = () => setItems([...items, { product_name: "", quantity: 1, unit_price: 0 }]);
  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));

  const handleSubmit = async () => {
    if (!items.length) return alert("Add at least one product");

    const preparedItems = items
      .filter((i) => (i.product || i.product_name) && i.quantity > 0)
      .map((i) => ({
        product: i.product,
        product_name: i.product_name,
        quantity: i.quantity,
        unit_price: i.unit_price,
      }));

    if (!preparedItems.length) return alert("Add at least one valid product");

    await onSubmit({
      date: saleDate,
      paid_amount: paidAmount,
      customer: customerId,
      items: preparedItems,
      comment,
      nepal_date: nepalDate,
    });

    onClose();
  };

  if (!visible) return null;

  return (
    <Paper
      elevation={3}
      sx={{
        maxHeight: "90vh",
        display: "flex",
        flexDirection: "column",
        p: 3,
        borderRadius: 3,
        bgcolor: "#f1f5f9",
      }}
    >
      <Typography variant="h5" fontWeight={700} mb={3} color="#1e293b">
        {initialData ? "Edit Sale" : "Create New Sale"}
      </Typography>

      <Box sx={{ display: "flex", gap: 3, flex: 1, overflow: "hidden" }}>
        {/* LEFT COLUMN */}
        <Stack spacing={2} sx={{ width: "30%" }}>
          <TextField
            label="Date"
            type="date"
            value={saleDate}
            onChange={(e) => setSaleDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />

          <Autocomplete
            options={customers}
            getOptionLabel={(option) => option.name}
            value={customers.find((c) => c.id === customerId) || null}
            onChange={(_, newValue) => setCustomerId(newValue?.id)}
            renderInput={(params) => <TextField {...params} label="Customer" />}
            fullWidth
            disablePortal={false}
            slotProps={{
              popper: {
                sx: {
                  zIndex: 1500,
                },
              },
            }}
          />

          <TextField
            label="Paid Amount"
            type="number"
            value={paidAmount}
            onChange={(e) => setPaidAmount(Number(e.target.value))}
            fullWidth
          />

          <TextField
            label="Nepali Date"
            value={nepalDate}
            onChange={(e) => setNepalDate(e.target.value)}
            fullWidth
          />

          <TextField
            label="Comment"
            multiline
            rows={5}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            fullWidth
          />
        </Stack>

        {/* RIGHT COLUMN */}
        <Stack spacing={2} sx={{ width: "70%", display: "flex", flexDirection: "column" }}>
          <Typography variant="subtitle1" fontWeight={600} color="#1e293b">
            Sale Items
          </Typography>

          {/* Sale Items scrollable */}
          <Box
            sx={{
              flex: 1,
              overflowY: "auto",
              borderRadius: 2,
              border: "1px solid #e2e8f0",
              p: 2,
              backgroundColor: "#fff",
              mb: 2,
            }}
          >
            {items.map((item, idx) => (
              <Stack key={idx} direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                <Autocomplete
                  freeSolo
                  options={products.map((p) => ({
                    id: p.id,
                    name: p.name,
                    unit_price: Number(p.price),
                  }))}
                  getOptionLabel={(option) => (typeof option === "string" ? option : option.name)}
                  value={
                    item.product
                      ? (() => {
                          const p = products.find((p) => p.id === item.product);
                          return p ? { id: p.id, name: p.name, unit_price: Number(p.price) } : null;
                        })()
                      : item.product_name || null
                  }
                  onChange={(_, newValue) => {
                    setItems((prev) => {
                      const updated = [...prev];
                      if (typeof newValue === "string") {
                        updated[idx].product_name = newValue;
                        updated[idx].product = undefined;
                        updated[idx].unit_price = 0;
                      } else if (newValue) {
                        updated[idx].product = newValue.id;
                        updated[idx].product_name = newValue.name;
                        updated[idx].unit_price = newValue.unit_price;
                      } else {
                        updated[idx].product = undefined;
                        updated[idx].product_name = "";
                        updated[idx].unit_price = 0;
                      }
                      return updated;
                    });
                  }}
                  renderInput={(params) => <TextField {...params} label="Product Name" size="small" />}
                  sx={{ flex: 2 }}
                  disablePortal={false}
                  slotProps={{
                    popper: {
                      sx: {
                        zIndex: 1500,
                      },
                    },
                  }}
                />

                <TextField
                  label="Qty"
                  type="number"
                  size="small"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(idx, "quantity", Number(e.target.value))}
                  sx={{ width: 90 }}
                />

                <TextField
                  label="Unit Price"
                  type="number"
                  size="small"
                  value={item.unit_price}
                  onChange={(e) => handleItemChange(idx, "unit_price", Number(e.target.value))}
                  sx={{ width: 120 }}
                />

                <Typography sx={{ width: 100, textAlign: "right", fontWeight: 600 }}>
                  ${(item.quantity * item.unit_price).toFixed(2)}
                </Typography>

                <IconButton color="error" onClick={() => removeItem(idx)} size="small">
                  <Remove />
                </IconButton>
              </Stack>
            ))}

            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={addItem}
              sx={{
                mt: 1.5,
                borderRadius: 2,
                  background: "linear-gradient(180deg, #1e3c72, #2a5298)",
                color: "#fff",

              }}
            >
              Add Product
            </Button>
          </Box>

          {/* Footer Buttons always visible */}
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button
              variant="contained"
              onClick={handleSubmit}
              sx={{
                px: 4,
                py: 1,
                borderRadius: 2,
                textTransform: "none",
                background: "linear-gradient(180deg, #1e3c72, #2a5298)",
                "&:hover": { backgroundColor: "#0284c7" },
              }}
            >
              Save
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              onClick={onClose}
              sx={{ px: 4, py: 1, borderRadius: 2, textTransform: "none" }}
            >
              Cancel
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Paper>
  );
};

export default SaleForm;
