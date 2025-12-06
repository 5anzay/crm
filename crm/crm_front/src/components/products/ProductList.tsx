import React, { useState, useEffect, useRef } from "react";
import ProductForm from "./ProductForm";
import ProductTable from "./ProductTable";
import type { Product } from "./types";
import { fetchProducts, createProduct, updateProduct, deleteProduct } from "./api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Box, Button, Stack, Pagination, PaginationItem, Typography } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";

const getPageSize = () => {
  if (window.innerWidth >= 1200) return 12;
  if (window.innerWidth >= 768) return 6;
  return 3;
};

const ProductList: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(getPageSize());
  const [startPos, setStartPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const addButtonRef = useRef<HTMLButtonElement | null>(null);

  // Load products
  const loadProducts = async () => {
    try {
      const data = await fetchProducts();
      setProducts(data);
    } catch {
      toast.error("Failed to load products");
    }
  };

  useEffect(() => { loadProducts(); }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => setPageSize(getPageSize());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSubmit = async (data: Omit<Product, "id">) => {
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, data);
        toast.success("Product updated!");
        setEditingProduct(null);
      } else {
        await createProduct(data);
        toast.success("Product added!");
      }
      loadProducts();
      setFormVisible(false);
    } catch {
      toast.error("Failed to save product");
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    openFormFromButton();
  };

  const handleDelete = (product: Product) => {
    toast.info(
      <div>
        <p>Are you sure you want to delete <strong>{product.name}</strong>?</p>
        <Stack direction="row" spacing={1} justifyContent="flex-end" mt={1}>
          <Button
            variant="contained"
            size="small"
            color="error"
            onClick={async () => {
              try {
                await deleteProduct(product.id);
                toast.dismiss();
                toast.success("Product deleted!");
                loadProducts();
              } catch {
                toast.error("Failed to delete product");
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

  // Pagination
  const totalPages = Math.ceil(products.length / pageSize);
  const currentData = products.slice((page - 1) * pageSize, page * pageSize);

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f0f4f8", p: { xs: 2, sm: 3, md: 4 } }}>
      <ToastContainer position="top-right" autoClose={2000} />

      {/* Header */}
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} mb={3} spacing={{ xs: 1, sm: 0 }}>
        <Typography variant="h5" fontWeight={800} color="#334155">
          Products Dashboard
        </Typography>
        <Button
          ref={addButtonRef}
          variant="contained"
          onClick={() => { setEditingProduct(null); openFormFromButton(); }}
          sx={{
            textTransform: "none",
            background: "linear-gradient(180deg, #1e3c72, #2a5298)",
            color: "#fff",
            borderRadius: 3,
            "&:hover": { background: "linear-gradient(90deg, #1e3c72, #2a5298)" },
            mt: { xs: 1, sm: 0 },
            minWidth: 140
          }}
        >
          Add Product
        </Button>
      </Stack>

      {/* Table */}
      <ProductTable products={currentData} onEdit={handleEdit} onDelete={handleDelete} />

      {/* Pagination */}
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

      {/* Modal animation */}
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
              <ProductForm
                visible={formVisible}
                onClose={() => setFormVisible(false)}
                onSubmit={handleSubmit}
                initialData={editingProduct || undefined}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </Box>
  );
};

export default ProductList;
