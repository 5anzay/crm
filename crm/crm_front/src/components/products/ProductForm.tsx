import React, { useState, useEffect } from "react";
import { Button, TextField, Stack, Box, Typography } from "@mui/material";
import type { Product } from "./types";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Product, "id">) => void;
  initialData?: Product;
}

const ProductForm: React.FC<Props> = ({ visible, onClose, onSubmit, initialData }) => {
  const [name, setName] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [costPrice, setCostPrice] = useState<number | "">("");
  const [stock, setStock] = useState<number | "">("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setPrice(Number(initialData.price) || "");
      setCostPrice(Number(initialData.cost_price) || "");
      setStock(Number(initialData.stock) || "");
      setCategory(initialData.category || "");
      setDescription(initialData.description || "");
    } else {
      setName(""); setPrice(""); setCostPrice(""); setStock(""); setCategory(""); setDescription("");
    }
  }, [initialData, visible]);

  const handleSubmit = () => {
    if (!name || price === "" || costPrice === "" || stock === "") {
      alert("Please fill in name, price, cost price, and stock.");
      return;
    }
    onSubmit({
      name,
      price: Number(price),
      cost_price: Number(costPrice),
      stock: Number(stock),
      category,
      description,
    });
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
        {initialData ? "Edit Product" : "Add Product"}
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
          label="Price"
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))}
          fullWidth
          variant="outlined"
          size="small"
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: 5 }, width: "70%" }}
          inputProps={{ style: { textAlign: "center" } }}
        />
        <TextField
          label="Cost Price"
          type="number"
          value={costPrice}
          onChange={(e) => setCostPrice(e.target.value === "" ? "" : Number(e.target.value))}
          fullWidth
          variant="outlined"
          size="small"
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: 5 }, width: "70%" }}
          inputProps={{ style: { textAlign: "center" } }}
        />
        <TextField
          label="Stock"
          type="number"
          value={stock}
          onChange={(e) => setStock(e.target.value === "" ? "" : Number(e.target.value))}
          fullWidth
          variant="outlined"
          size="small"
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: 5 }, width: "70%" }}
          inputProps={{ style: { textAlign: "center" } }}
        />
        <TextField
          label="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          fullWidth
          variant="outlined"
          size="small"
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: 5 }, width: "70%" }}
          inputProps={{ style: { textAlign: "center" } }}
        />
        <TextField
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
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

export default ProductForm;
