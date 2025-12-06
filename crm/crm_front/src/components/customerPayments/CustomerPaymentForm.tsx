// src/components/customerPayments/CustomerPaymentForm.tsx
import React, { useState, useEffect } from "react";
import { Box, Stack, TextField, Button, Typography } from "@mui/material";
import type { CustomerPayment } from "./types";
import type { Customer } from "../customers/types";
import { fetchCustomers } from "../customers/api";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<CustomerPayment, "id">) => Promise<void>;
  initialData?: CustomerPayment;
}

const CustomerPaymentForm: React.FC<Props> = ({ visible, onClose, onSubmit, initialData }) => {
  const [customerId, setCustomerId] = useState<number | undefined>();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState("");
  const [nepalDate, setNepalDate] = useState("");
  const [comment, setComment] = useState("");


  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const data = await fetchCustomers();
        setCustomers(data || []);
      } catch (err) {
        console.error("Failed to load customers", err);
      }
    };
    loadCustomers();
  }, []);

  useEffect(() => {
    if (initialData) {
      setCustomerId(initialData.customer);
      setAmount(initialData.amount);
      setDate(initialData.date || "");
      setNepalDate(initialData.nepal_date || "");
      setComment(initialData.comment || "");

    } else {
      setCustomerId(undefined);
      setAmount(0);
      setDate("");
      setNepalDate("");
      setComment("");

    }
  }, [initialData]);

  const handleSubmit = async () => {
    if (!customerId || !amount) {
      alert("Customer and amount are required");
      return;
    }
    await onSubmit({
      customer: customerId,
      amount,
      date,
      nepal_date: nepalDate,
      comment,
      
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
        Customer Payment
      </Typography>

      <Stack spacing={2}>
        <TextField
          select
          label=""
          value={customerId || ""}
          onChange={(e) => setCustomerId(Number(e.target.value))}
          SelectProps={{ native: true }}
        >
          <option value="">Select Customer</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
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

export default CustomerPaymentForm;
