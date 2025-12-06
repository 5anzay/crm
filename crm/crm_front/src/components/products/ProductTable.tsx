import React, { useState, useMemo } from "react";
import type { Product } from "./types";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  IconButton,
  TextField,
  Stack,
  Typography,
  Box,
  Chip,
} from "@mui/material";

import {
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  Search,
  DollarSign,
  Package,
} from "lucide-react";

// --- SAME COLORS AS CUSTOMER TABLE ---
const PRIMARY_ACCENT = "#1e3c72";
const ACCENT_LIGHT = "#4a78a9";
const HEADER_TEXT_COLOR = "#fff";
const ACTION_DEFAULT_COLOR = "#475569";
const ACTION_EDIT_COLOR = ACCENT_LIGHT;
const ACTION_DELETE_COLOR = "#ef4444";
const ROW_ODD_BG = "#f9fafb";

interface Props {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

const ProductTable: React.FC<Props> = ({ products, onEdit, onDelete }) => {
  const [searchText, setSearchText] = useState("");
  const [sortField, setSortField] = useState<"id" | "name">("id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // --- SAME LOGIC (unchanged) ---
  const filteredProducts = useMemo(() => {
    const filtered = products.filter(
      (p) =>
        p.name.toLowerCase().includes(searchText.toLowerCase()) ||
        String(p.id).includes(searchText)
    );

    return filtered.sort((a, b) => {
      const aVal = a[sortField],
        bVal = b[sortField];

      if (typeof aVal === "string" && typeof bVal === "string")
        return sortOrder === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);

      if (typeof aVal === "number" && typeof bVal === "number")
        return sortOrder === "asc" ? aVal - bVal : bVal - aVal;

      return 0;
    });
  }, [products, searchText, sortField, sortOrder]);

  const toggleSort = (field: "id" | "name") => {
    if (sortField === field) setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const SortIcon = ({ field }: { field: "id" | "name" }) => {
    if (sortField !== field) return null;
    return sortOrder === "asc" ? (
      <ChevronUp size={16} style={{ marginLeft: 4 }} />
    ) : (
      <ChevronDown size={16} style={{ marginLeft: 4 }} />
    );
  };

  const headers = [
    { label: "ID", field: "id" as const, sortable: true },
    { label: "Name", field: "name" as const, sortable: true },
    { label: "Price", field: null, sortable: false },
    { label: "Stock", field: null, sortable: false },
    { label: "Actions", field: null, sortable: false },
  ];

  return (
    <TableContainer
      component={Paper}
      sx={{
        boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
        borderRadius: 4,
        overflow: "hidden",
        border: "1px solid #e2e8f0",
      }}
    >
      {/* Search Bar (same UI as customer) */}
      <Box sx={{ p: 2, borderBottom: "1px solid #eee", backgroundColor: "#fff" }}>
        <TextField
          placeholder="Search Products by Name or ID..."
          variant="outlined"
          size="small"
          fullWidth
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          InputProps={{
            startAdornment: (
              <Box sx={{ mr: 1, color: ACTION_DEFAULT_COLOR }}>
                <Search size={20} />
              </Box>
            ),
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 3,
              transition: "all 0.2s ease",
            },
            "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: PRIMARY_ACCENT,
              borderWidth: 2,
            },
          }}
        />
      </Box>

      <Table>
        {/* Header */}
        <TableHead>
          <TableRow sx={{ backgroundColor: PRIMARY_ACCENT }}>
            {headers.map((header) => (
              <TableCell
                key={header.label}
                onClick={() =>
                  header.sortable && toggleSort(header.field as "id" | "name")
                }
                sx={{
                  color: HEADER_TEXT_COLOR,
                  fontWeight: 700,
                  cursor: header.sortable ? "pointer" : "default",
                  py: 1.5,
                  fontSize: "0.9rem",
                  transition: "background-color 0.2s ease",
                  "&:hover": header.sortable
                    ? { backgroundColor: "rgba(255,255,255,0.15)" }
                    : {},
                }}
              >
                <Stack direction="row" alignItems="center">
                  {header.label}
                  {header.sortable && <SortIcon field={header.field as any} />}
                </Stack>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>

        {/* Body */}
        <TableBody>
          {filteredProducts.length > 0 ? (
            filteredProducts.map((p, idx) => (
              <TableRow
                key={p.id}
                hover
                sx={{
                  transition: "background-color 0.15s ease-in",
                  "&:hover": { backgroundColor: "#f0f4f8 !important" },
                  backgroundColor: idx % 2 === 0 ? ROW_ODD_BG : "#ffffff",
                }}
              >
                <TableCell sx={{ color: ACTION_DEFAULT_COLOR }}>{p.id}</TableCell>

                <TableCell sx={{ fontWeight: 600, color: PRIMARY_ACCENT }}>
                  {p.name}
                </TableCell>

                <TableCell>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <DollarSign size={14} color={PRIMARY_ACCENT} />
                    <Typography variant="body2" color={ACTION_DEFAULT_COLOR}>
                      {typeof p.price === "number"
                        ? p.price.toFixed(2)
                        : Number(p.price || 0).toFixed(2)}
                    </Typography>
                  </Stack>
                </TableCell>

                <TableCell>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Package size={14} color={PRIMARY_ACCENT} />
                    <Typography variant="body2" color={ACTION_DEFAULT_COLOR}>
                      {p.stock} in stock
                    </Typography>

                    {p.stock <= 5 && (
                      <Chip
                        label="Low"
                        size="small"
                        sx={{
                          bgcolor: "#fee2e2",
                          color: "#b91c1c",
                          height: 22,
                          fontWeight: 600,
                        }}
                      />
                    )}
                  </Stack>
                </TableCell>

                {/* Actions */}
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    <IconButton
                      size="medium"
                      sx={{
                        color: ACTION_DEFAULT_COLOR,
                        "&:hover": { color: ACTION_EDIT_COLOR, transform: "scale(1.1)" },
                      }}
                      onClick={() => onEdit(p)}
                    >
                      <Pencil size={16} />
                    </IconButton>

                    <IconButton
                      size="medium"
                      sx={{
                        color: ACTION_DEFAULT_COLOR,
                        "&:hover": { color: ACTION_DELETE_COLOR, transform: "scale(1.1)" },
                      }}
                      onClick={() => onDelete(p)}
                    >
                      <Trash2 size={16} />
                    </IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={5}
                sx={{ textAlign: "center", py: 3, color: ACTION_DEFAULT_COLOR }}
              >
                😕 No products found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ProductTable;
