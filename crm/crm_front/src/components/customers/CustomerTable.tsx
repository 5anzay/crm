import React, { useState, useMemo } from "react";
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
} from "@mui/material";
import {
  Pencil,
  Trash2,
  Eye,
  ChevronUp,
  ChevronDown,
  Search,
  Mail,
  Phone,
} from "lucide-react";

import type { Customer } from "./types";

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
  customers: Customer[];
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
  onView: (customer: Customer) => void;
}

const CustomerTable: React.FC<Props> = ({ customers, onEdit, onDelete, onView }) => {
  const [searchText, setSearchText] = useState("");
  const [sortField, setSortField] = useState<"id" | "name">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const filteredCustomers = useMemo(() => {
    return customers
      .filter(
        (c) =>
          c.name.toLowerCase().includes(searchText.toLowerCase()) ||
          String(c.id).includes(searchText)
      )
      .sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];

        if (typeof aVal === "string" && typeof bVal === "string")
          return sortOrder === "asc"
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);

        if (typeof aVal === "number" && typeof bVal === "number")
          return sortOrder === "asc" ? aVal - bVal : bVal - aVal;

        return 0;
      });
  }, [customers, searchText, sortField, sortOrder]);

  const toggleSort = (field: "id" | "name") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
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
    { label: "Email", field: null, sortable: false },
    { label: "Phone", field: null, sortable: false },
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
      {/* Search Bar */}
      <Box sx={{ p: 2, borderBottom: "1px solid #eee", backgroundColor: "#fff" }}>
        <TextField
          placeholder="Search Customers by Name or ID..."
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

        <TableBody>
          {filteredCustomers.length > 0 ? (
            filteredCustomers.map((c, idx) => (
              <TableRow
                key={c.id}
                hover
                sx={{
                  transition: "background-color 0.15s ease-in",
                  "&:hover": { backgroundColor: "#f0f4f8 !important" },
                  backgroundColor: idx % 2 === 0 ? ROW_ODD_BG : "#ffffff",
                }}
              >
                <TableCell sx={{ color: ACTION_DEFAULT_COLOR }}>{c.id}</TableCell>

                <TableCell sx={{ fontWeight: 600, color: PRIMARY_ACCENT }}>
                  {c.name}
                </TableCell>

                <TableCell>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Mail size={14} color={ACTION_DEFAULT_COLOR} />
                    <Typography variant="body2" color={ACTION_DEFAULT_COLOR}>
                      {c.email || "-"}
                    </Typography>
                  </Stack>
                </TableCell>

                <TableCell>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Phone size={14} color={ACTION_DEFAULT_COLOR} />
                    <Typography variant="body2" color={ACTION_DEFAULT_COLOR}>
                      {c.phone || "-"}
                    </Typography>
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
                      onClick={() => onEdit(c)}
                    >
                      <Pencil size={16} />
                    </IconButton>

                    <IconButton
                      size="medium"
                      sx={{
                        color: ACTION_DEFAULT_COLOR,
                        "&:hover": { color: ACTION_DELETE_COLOR, transform: "scale(1.1)" },
                      }}
                      onClick={() => onDelete(c)}
                    >
                      <Trash2 size={16} />
                    </IconButton>

                    <IconButton
                      size="medium"
                      sx={{
                        color: ACTION_DEFAULT_COLOR,
                        "&:hover": { color: ACTION_VIEW_COLOR, transform: "scale(1.1)" },
                      }}
                      onClick={() => onView(c)}
                    >
                      <Eye size={16} />
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
                😕 No customers found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default CustomerTable;
