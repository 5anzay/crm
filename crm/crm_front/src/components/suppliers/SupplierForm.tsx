import React, { useState, useEffect } from "react";
import { Box, TextField, Button, Stack, Typography } from "@mui/material";
import type { Supplier } from "./types";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Supplier, "id">) => void;
  initialData?: Supplier;
}

const SupplierForm: React.FC<Props> = ({ visible, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState<Omit<Supplier, "id">>({
    name: "",
    email: "",
    phone: "",
    address: "",
    company: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        email: initialData.email || "",
        phone: initialData.phone || "",
        address: initialData.address || "",

      });
    } else {
      setFormData({ name: "", email: "", phone: "", address: "", });
    }
  }, [initialData]);

  const handleChange = (field: keyof Supplier, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) return;
    onSubmit(formData);
  };

  if (!visible) return null;

  return (
    <Box
      sx={{
        backgroundColor: "#fff",
        p: 4,
        borderRadius: 3,
        boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
      }}
    >
      <Typography variant="h6" fontWeight={800} mb={2} color="#334155">
        {initialData ? "Edit Supplier" : "Add Supplier"}
      </Typography>

      <Stack spacing={2}>
        <TextField
          label="Name"
          fullWidth
          value={formData.name}
          onChange={(e) => handleChange("name", e.target.value)}
        />
        <TextField
          label="Email"
          fullWidth
          value={formData.email}
          onChange={(e) => handleChange("email", e.target.value)}
        />
        <TextField
          label="Phone"
          fullWidth
          value={formData.phone}
          onChange={(e) => handleChange("phone", e.target.value)}
        />
        
        <TextField
          label="Address"
          fullWidth
          multiline
          rows={3}
          value={formData.address}
          onChange={(e) => handleChange("address", e.target.value)}
        />
      </Stack>

      <Stack direction="row" justifyContent="flex-end" spacing={2} mt={3}>
        <Button variant="outlined" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          sx={{ background: "linear-gradient(180deg, #1e3c72, #2a5298)", "&:hover": { background: "linear-gradient(90deg, #1e3c72, #2a5298)" } }}
        >
          {initialData ? "Update" : "Add"}
        </Button>
      </Stack>
    </Box>
  );
};

export default SupplierForm;
