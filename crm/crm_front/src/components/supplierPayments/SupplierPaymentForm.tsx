// src/components/supplierPayments/SupplierPaymentForm.tsx
import React, { useState, useEffect } from "react";
import { Box, Stack, TextField, Button, Typography } from "@mui/material";
import type { SupplierPayment } from "./types";
import type { Supplier } from "../suppliers/types";
import { fetchSuppliers } from "../suppliers/api";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<SupplierPayment, "id">) => Promise<void>;
  initialData?: SupplierPayment;
}

const SupplierPaymentForm: React.FC<Props> = ({ visible, onClose, onSubmit, initialData }) => {
  const [supplierId, setSupplierId] = useState<number | undefined>();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState("");
  const [nepalDate, setNepalDate] = useState("");
  const [comment, setComment] = useState("");
  const [receiptNumber, setReceiptNumber] = useState("");

  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        const data = await fetchSuppliers();
        setSuppliers(data || []);
      } catch (err) {
        console.error("Failed to load suppliers", err);
      }
    };
    loadSuppliers();
  }, []);

  useEffect(() => {
    if (initialData) {
      setSupplierId(initialData.supplier);
      setAmount(initialData.amount);
      setDate(initialData.date || "");
      setNepalDate(initialData.nepal_date || "");
      setComment(initialData.comment || "");
      setReceiptNumber(initialData.receipt_number || "");
    } else {
      setSupplierId(undefined);
      setAmount(0);
      setDate("");
      setNepalDate("");
      setComment("");
      setReceiptNumber("");
    }
  }, [initialData]);

  const handleSubmit = async () => {
    if (!supplierId || !amount) {
      alert("Supplier and amount are required");
      return;
    }
    await onSubmit({
      supplier: supplierId,
      amount,
      date,
      nepal_date: nepalDate, // string
      comment,
      receipt_number: receiptNumber,
    });
  };

  if (!visible) return null;

  return (
    <Box
      sx={{
        bgcolor: "#fff",
        p: 3,
        borderRadius: 3,
        boxShadow: 3,
        maxWidth: 500,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Typography variant="h6" mb={2}>
        Supplier Payment
      </Typography>

      <Stack spacing={2}>
        <TextField
          select
          label=""
          value={supplierId || ""}
          onChange={(e) => setSupplierId(Number(e.target.value))}
          SelectProps={{ native: true }}
        >
          <option value="">Select Supplier</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </TextField>

        <TextField
          label="Amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
        />

        <TextField
          label=""
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        <TextField
          label="Nepali Date"
          type="text"
          value={nepalDate}
          onChange={(e) => setNepalDate(e.target.value)}
        />

        <TextField
          label="Receipt Number"
          value={receiptNumber}
          onChange={(e) => setReceiptNumber(e.target.value)}
        />

        <TextField
          label="Comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </Stack>

      <Stack direction="row" spacing={1} justifyContent="flex-end" mt={2}>
        <Button variant="contained" onClick={handleSubmit} sx={{background:"linear-gradient(1800deg, #1e3c72, #2a5298)"}}>
          Save
        </Button>
        <Button variant="outlined" onClick={onClose} color="error">
          Cancel
        </Button>
      </Stack>
    </Box>
  );
};

export default SupplierPaymentForm;
