import React, { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  TextField,
  Stack,
  Typography,
  Box,
} from "@mui/material";
import {
  Pencil,
  Trash2,
  Eye,
  Search,
  Mail,
  Phone,
  MapPin,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import type { Supplier } from "./types";

// --- COLORS ---
const PRIMARY_ACCENT = "#1e3c72";
const ACCENT_LIGHT = "#4a78a9";
const HEADER_TEXT_COLOR = "#fff";
const ACTION_DEFAULT_COLOR = "#475569";
const ACTION_EDIT_COLOR = ACCENT_LIGHT;
const ACTION_DELETE_COLOR = "#ef4444";
const ACTION_VIEW_COLOR = ACCENT_LIGHT;
const ROW_ODD_BG = "#f9fafb";

interface Props {
  suppliers: Supplier[];
  onEdit: (supplier: Supplier) => void;
  onDelete: (supplier: Supplier) => void;
  onView?: (supplier: Supplier) => void;
}

const SupplierTable: React.FC<Props> = ({ suppliers, onEdit, onDelete, onView }) => {
  const [searchText, setSearchText] = useState("");
  const [sortField, setSortField] = useState<"id" | "name" | "email">("id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const filteredSuppliers = useMemo(() => {
    return suppliers
      .filter(
        (s) =>
          s.id.toString().includes(searchText) ||
          s.name.toLowerCase().includes(searchText.toLowerCase()) ||
          (s.email && s.email.toLowerCase().includes(searchText.toLowerCase()))
      )
      .sort((a, b) => {
        let aVal: string | number = a[sortField] || "";
        let bVal: string | number = b[sortField] || "";

        if (typeof aVal === "number" && typeof bVal === "number")
          return sortOrder === "asc" ? aVal - bVal : bVal - aVal;

        if (typeof aVal === "string" && typeof bVal === "string")
          return sortOrder === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);

        return 0;
      });
  }, [suppliers, searchText, sortField, sortOrder]);

  const toggleSort = (field: "id" | "name" | "email") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const SortIcon = ({ field }: { field: "id" | "name" | "email" }) => {
    if (sortField !== field) return null;
    return sortOrder === "asc" ? (
      <ChevronUp size={16} style={{ marginLeft: 4 }} />
    ) : (
      <ChevronDown size={16} style={{ marginLeft: 4 }} />
    );
  };

  const headers = [
    { label: "ID", field: "id", sortable: true },
    { label: "Name", field: "name", sortable: true },
    { label: "Email", field: "email", sortable: true },
    { label: "Phone", field: null, sortable: false },
    { label: "Address", field: null, sortable: false },
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
      {/* Search */}
      <Box sx={{ p: 2, borderBottom: "1px solid #eee", backgroundColor: "#fff" }}>
        <TextField
          placeholder="Search Suppliers by ID, Name, or Email..."
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
            "& .MuiOutlinedInput-root": { borderRadius: 3 },
            "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: PRIMARY_ACCENT,
              borderWidth: 2,
            },
          }}
        />
      </Box>

      <Table>
        <TableHead>
          <TableRow sx={{ backgroundColor: PRIMARY_ACCENT }}>
            {headers.map((header) => (
              <TableCell
                key={header.label}
                onClick={() => header.sortable && toggleSort(header.field as any)}
                sx={{
                  color: HEADER_TEXT_COLOR,
                  fontWeight: 700,
                  cursor: header.sortable ? "pointer" : "default",
                  py: 1.5,
                  fontSize: "0.9rem",
                  "&:hover": header.sortable ? { backgroundColor: "rgba(255,255,255,0.15)" } : {},
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

        <TableBody>
          {filteredSuppliers.length > 0 ? (
            filteredSuppliers.map((s, idx) => (
              <TableRow
                key={s.id}
                hover
                sx={{
                  "&:hover": { backgroundColor: "#f0f4f8 !important" },
                  backgroundColor: idx % 2 === 0 ? ROW_ODD_BG : "#ffffff",
                }}
              >
                <TableCell>{s.id || "-"}</TableCell>
                <TableCell sx={{ fontWeight: 600, color: PRIMARY_ACCENT }}>{s.name}</TableCell>
                <TableCell>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Mail size={14} color={ACTION_DEFAULT_COLOR} />
                    <Typography>{s.email || "-"}</Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Phone size={14} color={ACTION_DEFAULT_COLOR} />
                    <Typography>{s.phone || "-"}</Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <MapPin size={14} color={ACTION_DEFAULT_COLOR} />
                    <Typography>{s.address || "-"}</Typography>
                  </Stack>
                </TableCell>

                <TableCell >
                  <Stack direction="row" spacing={1} >
                    <IconButton
                      size="medium"
                      sx={{ color: ACTION_DEFAULT_COLOR, "&:hover": { color: ACTION_EDIT_COLOR, transform: "scale(1.2)" } }}
                      onClick={() => onEdit(s)}
                    >
                      <Pencil size={16} />
                    </IconButton>


                    <IconButton
                      size="medium"
                      sx={{ color: ACTION_DEFAULT_COLOR, "&:hover": { color: ACTION_DELETE_COLOR, transform: "scale(1.2)" } }}
                      onClick={() => onDelete(s)}
                    >
                      <Trash2 size={16} />
                    </IconButton>

                    {onView && (
                      <IconButton
                        size="medium"
                        sx={{ color: ACTION_DEFAULT_COLOR, "&:hover": { color: ACTION_VIEW_COLOR, transform: "scale(1.2)" } }}
                        onClick={() => onView(s)}
                      >
                        <Eye size={16} />
                      </IconButton>
                    )}
                  </Stack>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} align="center" sx={{ py: 3, color: ACTION_DEFAULT_COLOR }}>
                😕 No suppliers found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default SupplierTable;
