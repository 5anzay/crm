// src/components/purchase_orders/POForm.tsx
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
import type { PurchaseOrder, POItem } from "./types";
import type { Supplier } from "../suppliers/types";
import type { Product } from "../products/types";
import { fetchSuppliers } from "../suppliers/api";
import { fetchProducts } from "../products/api";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  initialData?: PurchaseOrder;
}

const POForm: React.FC<Props> = ({ visible, onClose, onSubmit, initialData }) => {
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [poDate, setPoDate] = useState("");
  const [nepalDate, setNepalDate] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [supplierId, setSupplierId] = useState<number | undefined>(undefined);
  const [paidAmount, setPaidAmount] = useState(0);
  const [comment, setComment] = useState("");
  const [items, setItems] = useState<POItem[]>([{ product_name: "", quantity: 1, cost_price: 0 }]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [suppliersData, productsData] = await Promise.all([fetchSuppliers(), fetchProducts()]);
        setSuppliers(suppliersData || []);
        setProducts(productsData || []);
      } catch (err) {
        console.error("Failed to load suppliers/products", err);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (initialData) {
      setInvoiceNumber(initialData.invoice_number || "");
      setPoDate(initialData.date || "");
      setNepalDate(initialData.nepal_date || "");
      setComment(initialData.comment || "");
      const supplier = suppliers.find((s) => s.id === initialData.supplier);
      setSupplierName(supplier?.name || "");
      setSupplierId(initialData.supplier);
      setPaidAmount(initialData.paid_amount ?? 0);
      setItems(initialData.items?.map((i) => ({ ...i })) || [{ product_name: "", quantity: 1, cost_price: 0 }]);
    } else {
      setInvoiceNumber("");
      setPoDate("");
      setNepalDate("");
      setComment("");
      setSupplierName("");
      setSupplierId(undefined);
      setPaidAmount(0);
      setItems([{ product_name: "", quantity: 1, cost_price: 0 }]);
    }
  }, [initialData, suppliers]);

  const handleItemChange = (index: number, field: keyof POItem, value: string | number) => {
    const updated = [...items];
    const item = { ...updated[index] } as any;
    if (field === "quantity" || field === "cost_price") item[field] = Number(value);
    else item[field] = value;
    updated[index] = item;
    setItems(updated);
  };

  const addItem = () => setItems([...items, { product_name: "", quantity: 1, cost_price: 0 }]);
  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));

  const handleSubmit = async () => {
    const preparedItems = items
      .filter((item) => (item.product || item.product_name) && item.quantity > 0 && item.cost_price >= 0)
      .map((item) => ({
        product: item.product,
        product_name: item.product_name,
        quantity: item.quantity,
        cost_price: item.cost_price,
      }));

    if (!preparedItems.length) {
      alert("Add at least one product before submitting.");
      return;
    }

    try {
      await onSubmit({
        invoice_number: invoiceNumber,
        supplier: supplierId,
        paid_amount: paidAmount,
        date: poDate,
        nepal_date: nepalDate,
        comment,
        items: preparedItems,
      });
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to save Purchase Order.");
    }
  };

  if (!visible) return null;

  return (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        borderRadius: 3,
        bgcolor: "#f1f5f9",
        maxHeight: "90vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Typography variant="h5" fontWeight={700} mb={2} color="#1e293b">
        {initialData ? "Edit Purchase Order" : "Create New Purchase Order"}
      </Typography>

      <Box sx={{ display: "flex", gap: 3, flex: 1, overflow: "hidden" }}>
        {/* LEFT COLUMN */}
        <Stack spacing={2} sx={{ width: "35%" }}>
          <TextField
            label="Invoice Number"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            fullWidth
          />
          <TextField
            label="Date"
            type="date"
            value={poDate}
            onChange={(e) => setPoDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <TextField
            label="Nepal Date"
            placeholder="YYYY-MM-DD"
            value={nepalDate}
            onChange={(e) => setNepalDate(e.target.value)}
            fullWidth
          />
          <Autocomplete
            freeSolo
            options={suppliers.map((s) => ({ id: s.id, name: s.name })) || []}
            getOptionLabel={(option) => (typeof option === "string" ? option : option.name)}
            value={supplierId ? suppliers.find((s) => s.id === supplierId) || "" : supplierName}
            onChange={(_, newValue) => {
              if (typeof newValue === "string") {
                setSupplierName(newValue);
                setSupplierId(undefined);
              } else if (newValue) {
                setSupplierName(newValue.name);
                setSupplierId(newValue.id);
              }
            }}
            renderInput={(params) => <TextField {...params} label="Supplier" />}
            fullWidth
          />
          <TextField
            label="Paid Amount"
            type="number"
            value={paidAmount}
            onChange={(e) => setPaidAmount(Number(e.target.value))}
            InputProps={{ startAdornment: <Typography sx={{ mr: 1 }}>$</Typography> }}
            fullWidth
          />
          <TextField
            label="Comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            multiline
            rows={3}
            fullWidth
          />
        </Stack>

        {/* RIGHT COLUMN - Products */}
        <Stack spacing={2} sx={{ width: "65%", flex: 1, display: "flex", flexDirection: "column" }}>
          <Typography variant="subtitle1" fontWeight={600} color="#1e293b">
            Products
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
              <Stack key={idx} direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                <Autocomplete
                  freeSolo
                  options={products.map((p) => ({ id: p.id, name: p.name, cost_price: p.cost_price })) || []}
                  getOptionLabel={(option) => (typeof option === "string" ? option : option.name)}
                  value={item.product ? products.find((p) => p.id === item.product) || "" : item.product_name}
                  onChange={(_, newValue) => {
                    const updated = [...items];
                    if (typeof newValue === "string") {
                      updated[idx].product_name = newValue;
                      updated[idx].product = undefined;
                    } else if (newValue) {
                      updated[idx].product_name = newValue.name;
                      updated[idx].product = newValue.id;
                      updated[idx].cost_price = newValue.cost_price;
                    }
                    setItems(updated);
                  }}
                  renderInput={(params) => <TextField {...params} label="Product Name" size="small" />}
                  sx={{ flex: 2 }}
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
                  label="Cost Price"
                  type="number"
                  size="small"
                  value={item.cost_price}
                  onChange={(e) => handleItemChange(idx, "cost_price", Number(e.target.value))}
                  sx={{ width: 120 }}
                  InputProps={{ startAdornment: <Typography sx={{ mr: 1 }}>$</Typography> }}
                />
                <IconButton
                  onClick={() => removeItem(idx)}
                  sx={{ color: "#475569", "&:hover": { color: "#ef4444" } }}
                >
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
                borderColor: "#94a3b8",
                color: "linear-gradient(90deg, #1e3c72, #2a5298)",
                "&:hover": { borderColor: "#0ea5e9", color: "#0ea5e9" },
              }}
            >
              Add Product
            </Button>
          </Box>

          {/* Action Buttons */}
          <Stack direction="row" spacing={2} justifyContent="flex-end" mt={1}>
            <Button
              variant="contained"
              onClick={handleSubmit}
              sx={{
                px: 4,
                py: 1,
                borderRadius: 2,
                textTransform: "none",
                background: "linear-gradient(18deg, #1e3c72, #2a5298)",
                "&:hover": { background: "linear-gradient(90deg, #1e3c72, #2a5298)" },
              }}
            >
              Save
            </Button>
            <Button
              variant="outlined"
              onClick={onClose}
              sx={{
                px: 4,
                py: 1,
                borderRadius: 2,
                textTransform: "none",
                borderColor: "#64748b",
                color: "#475569",
                "&:hover": { borderColor: "#475569", backgroundColor: "#f1f5f9" },
              }}
            >
              Cancel
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Paper>
  );
};

export default POForm;
