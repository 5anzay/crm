// src/components/expenses/ExpenseForm.tsx
import React, { useState, useEffect } from "react";
import { Box, Stack, TextField, Button, Typography, MenuItem } from "@mui/material";
import type { Expense } from "./types";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Expense, "id">) => Promise<void>;
  initialData?: Expense;
}

const CATEGORY_CHOICES = ["Home", "Salary", "Shop", "Maintenance", "Other"];

const ExpenseForm: React.FC<Props> = ({ visible, onClose, onSubmit, initialData }) => {
  const [category, setCategory] = useState("Other");
  const [amount, setAmount] = useState<number | "">("");
  const [date, setDate] = useState("");
  const [nepalDate, setNepalDate] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (initialData) {
      setCategory(initialData.category || "Other");
      setAmount(initialData.amount ?? "");
      setDate(initialData.date ?? "");
      setNepalDate(initialData.nepal_date ?? "");
      setNotes(initialData.notes ?? "");
    } else {
      setCategory("Other");
      setAmount("");
      setDate(new Date().toISOString().split("T")[0]); // default to today
      setNepalDate("");
      setNotes("");
    }
  }, [initialData]);

  const handleSubmit = async () => {
    if (amount === "" || isNaN(Number(amount))) {
      alert("Amount is required and must be a number");
      return;
    }

    await onSubmit({
      category,
      amount: Number(amount),
      date: date || new Date().toISOString().split("T")[0],
      nepal_date: nepalDate,
      notes,
    });

    // reset form after submit
    setCategory("Other");
    setAmount("");
    setDate(new Date().toISOString().split("T")[0]);
    setNepalDate("");
    setNotes("");
    onClose();
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
        Expense
      </Typography>

      <Stack spacing={2}>
        <TextField
          select
          label="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {CATEGORY_CHOICES.map((c) => (
            <MenuItem key={c} value={c}>
              {c}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label="Amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
        />

        <TextField
          label="Date"
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
          label="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          multiline
          rows={2}
        />
      </Stack>

      <Stack direction="row" spacing={1} justifyContent="flex-end" mt={2}>
        <Button variant="contained" onClick={handleSubmit} sx={{background:"linear-gradient(180deg, #1e3c72, #2a5298)"}}>
          Save
        </Button>
        <Button variant="outlined" onClick={onClose}>
          Cancel
        </Button>
      </Stack>
    </Box>
  );
};

export default ExpenseForm;
