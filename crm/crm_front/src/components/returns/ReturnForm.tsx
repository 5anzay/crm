// src/components/returns/ReturnForm.tsx
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
import { Trash2, Plus } from "lucide-react";
import type { Return, ReturnItem } from "./types";
import type { Product } from "../products/types";
import type { Sale } from "../sales/types";
import type { Customer } from "../customers/types";
import { fetchSales } from "../sales/api";
import { fetchCustomers } from "../customers/api";
import { fetchProducts } from "../products/api";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Return, "id" | "total_refund">) => Promise<void>;
  initialData?: Return;
}

const ReturnForm: React.FC<Props> = ({ visible, onClose, onSubmit, initialData }) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [saleId, setSaleId] = useState<number | null>(null);
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [nepalDate, setNepalDate] = useState("");
  const [comment, setComment] = useState("");
  const [items, setItems] = useState<ReturnItem[]>([]);

  // Load sales, customers, products
  useEffect(() => {
    const loadData = async () => {
      try {
        const [saleData, customerData, productData] = await Promise.all([
          fetchSales(),
          fetchCustomers(),
          fetchProducts(),
        ]);

        setSales(saleData ?? []);
        setCustomers(customerData ?? []);
        setProducts(productData ?? []);
      } catch (err) {
        console.error("Failed to load data", err);
      }
    };
    loadData();
  }, []);

  // Initialize form with initialData
  useEffect(() => {
    if (initialData) {
      setSaleId(initialData.sale ?? null);
      setCustomerId(initialData.customer ?? null);
      setDate(initialData.date ?? new Date().toISOString().split("T")[0]);
      setNepalDate(initialData.nepal_date ?? "");
      setComment(initialData.comment ?? "");
      setItems(initialData.items ?? []);
    } else {
      setSaleId(null);
      setCustomerId(null);
      setDate(new Date().toISOString().split("T")[0]);
      setNepalDate("");
      setComment("");
      setItems([]);
    }
  }, [initialData]);

  /* ------------------------------------------------------
   * AUTO-SELECT CUSTOMER WHEN SALE IS SELECTED
   * ------------------------------------------------------ */
  useEffect(() => {
    if (!saleId) return;

    const sale = sales.find((s) => s.id === saleId);
    if (sale?.customer) {
      setCustomerId(sale.customer);
    }
  }, [saleId, sales]);

  const addItem = () =>
    setItems((prev) => [
      ...prev,
      { product: undefined, quantity: 1, unit_price: 0 },
    ]);

  const removeItem = (idx: number) =>
    setItems((prev) => prev.filter((_, i) => i !== idx));

  const updateItem = <K extends keyof ReturnItem>(
    idx: number,
    field: K,
    value: ReturnItem[K]
  ) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  const handleProductChange = (idx: number, product: Product | null) => {
    setItems((prev) => {
      const updated = [...prev];
      if (product && product.id) {
        updated[idx] = {
          ...updated[idx],
          product: product.id,
          unit_price: product.price ?? 0,
        };
      } else {
        updated[idx] = {
          ...updated[idx],
          product: undefined,
          unit_price: 0,
        };
      }
      return updated;
    });
  };

  const handleSubmit = async () => {
    if (!saleId || items.length === 0) {
      alert("Sale and at least one return item are required.");
      return;
    }

    await onSubmit({
      sale: saleId,
      customer: customerId ?? undefined,
      date,
      nepal_date: nepalDate,
      comment,
      items,
    });

    setSaleId(null);
    setCustomerId(null);
    setDate(new Date().toISOString().split("T")[0]);
    setNepalDate("");
    setComment("");
    setItems([]);

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
        {initialData ? "Edit Return" : "Create New Return"}
      </Typography>

      <Box sx={{ display: "flex", gap: 3, flex: 1, overflow: "hidden" }}>
        {/* LEFT COLUMN */}
        <Stack spacing={2} sx={{ width: "30%", position: "relative", zIndex: 10 }}>
          {/* SALE SELECT */}
          <Autocomplete
            value={saleId ? sales.find((s) => s.id === saleId) ?? null : null}
            onChange={(_, newValue) => setSaleId(newValue?.id ?? null)}
            options={sales}
            getOptionLabel={(option) => option.invoice_number ?? `#${option.id}`}
            isOptionEqualToValue={(option, value) => option?.id === value?.id}
            disablePortal={false}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Sale"
                inputProps={{
                  ...params.inputProps,
                  autoComplete: 'chrome-off',
                }}
              />
            )}
            slotProps={{
              popper: {
                sx: {
                  zIndex: 1500,
                },
              },
            }}
          />

          {/* CUSTOMER AUTO-SELECTED + LOCKED */}
          <Autocomplete
            value={
              customerId
                ? customers.find((c) => c.id === customerId) ?? null
                : null
            }
            onChange={(_, newValue) => setCustomerId(newValue?.id ?? null)}
            options={customers}
            disabled={!!saleId} // LOCKED WHEN SALE IS SELECTED
            getOptionLabel={(option) => option.name ?? "-"}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            disablePortal={false}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Customer"
                inputProps={{
                  ...params.inputProps,
                  autoComplete: 'chrome-off',
                }}
              />
            )}
            slotProps={{
              popper: {
                sx: {
                  zIndex: 1500,
                },
              },
            }}
          />

          <TextField
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            label="Nepali Date"
            value={nepalDate}
            onChange={(e) => setNepalDate(e.target.value)}
          />

          <TextField
            label="Comment"
            multiline
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </Stack>

        {/* RIGHT COLUMN */}
        <Stack spacing={2} sx={{ width: "70%" }}>
          <Typography variant="subtitle1" fontWeight={600} color="#1e293b">
            Return Items
          </Typography>

          <Box
            sx={{
              flex: 1,
              overflowY: "auto",
              borderRadius: 2,
              border: "1px solid #e2e8f0",
              p: 2,
              backgroundColor: "#fff",
            }}
          >
            {items.map((item, idx) => (
              <Stack
                key={idx}
                direction="row"
                spacing={1.5}
                alignItems="center"
                sx={{ mb: 1.5 }}
              >
                {/* PRODUCT SELECT */}
                <Autocomplete
                  value={
                    item.product
                      ? products.find((p) => p.id === item.product) ?? null
                      : null
                  }
                  options={products}
                  getOptionLabel={(option) => option.name ?? ""}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  onChange={(_, newValue) => handleProductChange(idx, newValue)}
                  disablePortal={false}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Product"
                      inputProps={{
                        ...params.inputProps,
                        autoComplete: 'chrome-off',
                      }}
                    />
                  )}
                  slotProps={{
                    popper: {
                      sx: {
                        zIndex: 1500,
                      },
                    },
                  }}
                  sx={{ flex: 2 }}
                />

                <TextField
                  label="Qty"
                  type="number"
                  size="small"
                  value={item.quantity}
                  onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))}
                  sx={{ width: 90 }}
                />

                <TextField
                  label="Unit Price"
                  type="number"
                  size="small"
                  value={item.unit_price}
                  onChange={(e) => updateItem(idx, "unit_price", Number(e.target.value))}
                  sx={{ width: 120 }}
                />

                <Typography sx={{ width: 100, textAlign: "right", fontWeight: 600 }}>
                  ${(item.quantity * item.unit_price).toFixed(2)}
                </Typography>

                <IconButton color="error" onClick={() => removeItem(idx)}>
                  <Trash2 size={20} />
                </IconButton>
              </Stack>
            ))}

            <Button
              variant="outlined"
              startIcon={<Plus />}
              onClick={addItem}
              sx={{
                mt: 1,
                borderRadius: 2,
                background: "linear-gradient(180deg, #1e3c72, #2a5298)",
                color: "#fff",
              }}
            >
              Add Item
            </Button>
          </Box>

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
              }}
            >
              Save
            </Button>

            <Button variant="outlined" onClick={onClose} sx={{ px: 4, py: 1, borderRadius: 2 }}>
              Cancel
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Paper>
  );
};

export default ReturnForm;
