import React, { useState, useEffect } from "react";
import { Button, TextField, Stack, Box, Typography } from "@mui/material";
import type { Customer } from "./types";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Customer, "id">) => void;
  initialData?: Customer;
}

const CustomerForm: React.FC<Props> = ({ visible, onClose, onSubmit, initialData }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setEmail(initialData.email || "");
      setPhone(initialData.phone || "");
      setAddress(initialData.address || "");
    } else {
      setName(""); setEmail(""); setPhone(""); setAddress("");
    }
  }, [initialData, visible]);

  const handleSubmit = () => {
    if (!name) {
      alert("Please enter name.");
      return;
    }
    onSubmit({ name, email, phone, address });
    onClose();
  };

  return (
    <Box
      sx={{
        backgroundColor: "#fefefe",
        borderRadius: 3,
        boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
        p: 4,
        width: "95%",
        maxWidth: { xs: "95%", sm: 700, md: 900, lg: 1000 },
        border: "1px solid #e2e8f0",
      }}
    >
      <Typography variant="h6" fontWeight={800} mb={2} color="#334155">
        {initialData ? "Edit Customer" : "Add Customer"}
      </Typography>

      <Stack spacing={2} alignItems="center">
        <TextField
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          variant="outlined"
          size="small"
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: 5 }, width: "70%" }}
          inputProps={{ style: { textAlign: "center" } }}
        />
        <TextField
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          fullWidth
          variant="outlined"
          size="small"
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: 5 }, width: "70%" }}
          inputProps={{ style: { textAlign: "center" } }}
        />
        <TextField
          label="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          fullWidth
          variant="outlined"
          size="small"
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: 5 }, width: "70%" }}
          inputProps={{ style: { textAlign: "center" } }}
        />
        <TextField
          label="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          fullWidth
          multiline
          rows={3}
          variant="outlined"
          size="small"
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: 5 }, width: "70%" }}
          inputProps={{ style: { textAlign: "center" } }}
        />

        <Stack direction="row" spacing={2} justifyContent="flex-end" mt={1}>
          <Button onClick={onClose} color="secondary" variant="outlined" sx={{ borderRadius: 3 }}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            sx={{
              background: "linear-gradient(180deg, #1e3c72, #2a5298)",
              color: "#fff",
              borderRadius: 3,
              "&:hover": { background: "linear-gradient(90deg, #1e3c72, #2a5298)" },
            }}
          >
            {initialData ? "Update" : "Add"}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
};

export default CustomerForm;
