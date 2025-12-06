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
  Stack,
  Box,
  TextField,

} from "@mui/material";
import { Pencil, Trash2, Calendar, MessageCircle, DollarSign, ChevronUp, ChevronDown } from "lucide-react";
import type { Expense } from "./types";

interface Props {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
  formatAmount?: (amount: string | number) => string;
}

const PRIMARY_ACCENT = "#1e3c72";
const ACCENT_LIGHT = "#4a78a9";
const ACTION_DEFAULT_COLOR = "#475569";
const ACTION_EDIT_COLOR = ACCENT_LIGHT;
const ACTION_DELETE_COLOR = "#ef4444";
const ROW_ODD_BG = "#f9fafb";

type SortKey = "category" | "date" | "nepal_date" | "amount" | "notes";
type SortOrder = "asc" | "desc";

const ExpenseTable: React.FC<Props> = ({ expenses, onEdit, onDelete, formatAmount }) => {
  const [searchText, setSearchText] = useState("");
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  // Sorting function
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  // Filtered & sorted expenses
  const filteredExpenses = useMemo(() => {
    const term = searchText.toLowerCase();
    let data = expenses.filter(
      (e) =>
        (e.category?.toLowerCase() ?? "").includes(term) ||
        (e.date?.toLowerCase() ?? "").includes(term) ||
        (e.nepal_date?.toLowerCase() ?? "").includes(term) ||
        (e.notes?.toLowerCase() ?? "").includes(term)
    );

    if (sortKey) {
      data.sort((a, b) => {
        const aValue = a[sortKey] ?? "";
        const bValue = b[sortKey] ?? "";

        if (sortKey === "amount") {
          const aNum = typeof aValue === "number" ? aValue : parseFloat(aValue as string) || 0;
          const bNum = typeof bValue === "number" ? bValue : parseFloat(bValue as string) || 0;
          return sortOrder === "asc" ? aNum - bNum : bNum - aNum;
        } else {
          const aStr = (aValue as string).toString().toLowerCase();
          const bStr = (bValue as string).toString().toLowerCase();
          if (aStr < bStr) return sortOrder === "asc" ? -1 : 1;
          if (aStr > bStr) return sortOrder === "asc" ? 1 : -1;
          return 0;
        }
      });
    }

    return data;
  }, [expenses, searchText, sortKey, sortOrder]);

  const format = (amount: string | number) => {
    if (formatAmount) return formatAmount(amount);
    const num = typeof amount === "number" ? amount : parseFloat(amount as string);
    return isNaN(num) ? "0.00" : num.toFixed(2);
  };

  const renderSortIcon = (key: SortKey) => {
    if (sortKey !== key) return null;
    return sortOrder === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Search */}


      {/* Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
      <Box mb={2} sx={{ p: 2, borderBottom: "1px solid #eee", backgroundColor: "#fff", borderRadius: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search by Category, Date, Nepali Date, Notes..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          sx={{
            "& .MuiOutlinedInput-root": { borderRadius: 2 },
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
              {[
                { label: "Category", key: "category" as SortKey },
                { label: "Date", key: "date" as SortKey },
                { label: "Nepali Date", key: "nepal_date" as SortKey },
                { label: "Amount", key: "amount" as SortKey },
                { label: "Notes", key: "notes" as SortKey },
                { label: "Actions", key: null },
              ].map((col) => (
                <TableCell
                  key={col.label}
                  sx={{ color: "#fff", fontWeight: 700, fontSize: "0.875rem", cursor: col.key ? "pointer" : "default" }}
                  onClick={() => col.key && handleSort(col.key)}
                >
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    {col.label}
                    {col.key && renderSortIcon(col.key)}
                  </Stack>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredExpenses.length > 0 ? (
              filteredExpenses.map((e, idx) => (
                <TableRow
                  key={e.id}
                  hover
                  sx={{
                    backgroundColor: idx % 2 === 0 ? ROW_ODD_BG : "#fff",
                    "&:hover": { backgroundColor: "#f0f4f8 !important" },
                  }}
                >
                  <TableCell>{e.category ?? "-"}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Calendar size={16} />
                      {e.date ?? "-"}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Calendar size={16} />
                      {e.nepal_date ?? "-"}
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: PRIMARY_ACCENT }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <DollarSign size={16} />
                      {format(e.amount)}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    {e.notes && (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <MessageCircle size={16} />
                        {e.notes}
                      </Stack>
                    )}
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <IconButton
                        size="small"
                        sx={{ color: ACTION_DEFAULT_COLOR, "&:hover": { color: ACTION_EDIT_COLOR, transform: "scale(1.1)" } }}
                        onClick={() => onEdit(e)}
                      >
                        <Pencil size={16} />
                      </IconButton>
                      <IconButton
                        size="small"
                        sx={{ color: ACTION_DEFAULT_COLOR, "&:hover": { color: ACTION_DELETE_COLOR, transform: "scale(1.1)" } }}
                        onClick={() => onDelete(e)}
                      >
                        <Trash2 size={16} />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} sx={{ textAlign: "center", py: 4, color: ACTION_DEFAULT_COLOR }}>
                  😕 {searchText ? `No expenses match "${searchText}"` : "No expenses available."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ExpenseTable;
