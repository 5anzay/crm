// src/components/reports/ReportPage.tsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Card,
  CardContent,
  Stack,
} from "@mui/material";
import { DollarSign, TrendingUp } from "lucide-react";
import type {
  ReportType,
  ProductReportItem,
  SalesReport,
  ExpenseBreakdown,
   ReturnReportItem,
} from "./types";

// ---------------- API Service ----------------
import { fetchReport, downloadReportPDF } from "./api";

// ---------------- TabPanel ----------------
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}
const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && <Box p={2}>{children}</Box>}
  </div>
);

const reportTabs: { label: string; type: ReportType }[] = [
  { label: "Products", type: "product" },
  { label: "Sales", type: "sales" },
  { label: "Purchase Orders", type: "purchaseorder" },
  { label: "Customers", type: "customer" },
  { label: "Suppliers", type: "supplier" },
  { label: "Expenses", type: "expense" },
    { label: "Returns", type: "return" },
];

const ReportPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // ---------------- Fetch Report ----------------
  useEffect(() => {
    const loadReport = async () => {
      setLoading(true);
      try {
        const type = reportTabs[activeTab].type;
        const data = await fetchReport(type, month, year);
        setReportData(data);
      } catch (error) {
        console.error("Failed to fetch report:", error);
        setReportData(null);
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, [activeTab, month, year]);

  // ---------------- View PDF ----------------
  const handleViewPDF = async () => {
    setPdfLoading(true);
    try {
      const type = reportTabs[activeTab].type;
      const blob = await downloadReportPDF(type, month, year);
      const fileURL = URL.createObjectURL(blob);

      const newWindow = window.open(fileURL, "_blank");
      if (!newWindow) {
        const link = document.createElement("a");
        link.href = fileURL;
        link.download = `${type}_report_${month}_${year}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error("Failed to load PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setPdfLoading(false);
    }
  };

  // ---------------- Summary Cards ----------------
  const renderSummaryCards = (summary: any, type: ReportType) => {
    if (!summary) return null;

    const items: { label: string; value: any; icon?: React.ReactNode; color?: string }[] = [];

    switch (type) {
      case "product":
        items.push(
          { label: "Total Products", value: summary.total_products, icon: <TrendingUp />, color: "#4a78a9" },
          { label: "Low Stock", value: summary.low_stock_count, icon: <TrendingUp />, color: "#1e3c72" },
          { label: "Most Sold Product", value: summary.most_sold_product || "N/A", icon: <TrendingUp />, color: "#4a78a9" },
          { label: "Favorite Product", value: summary.favorite_product || "N/A", icon: <TrendingUp />, color: "#1e3c72" }
        );
        break;

      case "sales":
        items.push(
          { label: "Total Sales", value: summary.total_sales, icon: <DollarSign />, color: "#4a78a9" },
          { label: "Profit", value: summary.total_profit, icon: <DollarSign />, color: "#1e3c72" },
          { label: "Count", value: summary.sales_count, icon: <TrendingUp />, color: "#4a78a9" }
        );
        break;

      case "purchaseorder":
        items.push(
          { label: "Total Purchase", value: summary.total_purchase, icon: <DollarSign />, color: "#4a78a9" },
          { label: "Total Paid", value: summary.total_paid, icon: <DollarSign />, color: "#1e3c72" },
          { label: "Total Due", value: summary.total_due, icon: <DollarSign />, color: "#4a78a9" },
          { label: "Count", value: summary.purchase_count, icon: <TrendingUp />, color: "#1e3c72" }
        );
        break;

      case "customer":
        items.push(
          { label: "Total Customers", value: summary.total_customers, icon: <TrendingUp />, color: "#4a78a9" },
          { label: "Total Sales", value: summary.total_sales, icon: <DollarSign />, color: "#1e3c72" },
          { label: "Total Paid", value: summary.total_paid, icon: <DollarSign />, color: "#4a78a9" },
          { label: "Total Balance", value: summary.total_balance, icon: <DollarSign />, color: "#1e3c72" },
          { label: "Total Returns", value: summary.total_returns, icon: <TrendingUp />, color: "#4a78a9" }
        );
        break;

      case "supplier":
        items.push(
          { label: "Total Suppliers", value: summary.total_suppliers, icon: <TrendingUp />, color: "#4a78a9" },
          { label: "Total Purchase", value: summary.total_purchase, icon: <DollarSign />, color: "#1e3c72" },
          { label: "Total Paid", value: summary.total_paid, icon: <DollarSign />, color: "#4a78a9" },
          { label: "Total Balance", value: summary.total_balance, icon: <DollarSign />, color: "#1e3c72" },
          { label: "Total Purchase Count", value: summary.purchase_count, icon: <TrendingUp />, color: "#4a78a9" }
        );
        break;

      case "expense":
        items.push(
          { label: "Total Expense", value: summary.total_expense, icon: <DollarSign />, color: "#4a78a9" },
          { label: "Total Expense Count", value: summary.expense_count, icon: <TrendingUp />, color: "#1e3c72" }
        );
        break;

      case "return":
        items.push(
          { label: "Total Returns", value: summary.total_returns, icon: <TrendingUp />, color: "#4a78a9" },
          { label: "Total Refund", value: summary.total_refund, icon: <DollarSign />, color: "#1e3c72" }
        );
        break;
    }

    return (
      <Stack direction="row" spacing={1} flexWrap="nowrap" mb={4}>
        {items.map((item, idx) => (
          <Card
            key={idx}
            sx={{
              flex: "1 1 220px",

              borderRadius: "16px",
              background: "#fff",
              color: "#1e3c72",
              boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
              transition: "transform 0.3s, box-shadow 0.3s",
              "&:hover": { transform: "translateY(-4px)", boxShadow: "0 12px 25px rgba(0,0,0,0.15)" },
            }}
          >
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: "50%",
                    bgcolor: item.color,
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {item.icon}
                </Box>
                <Box>
                  <Typography variant="body2" color="#475569" fontWeight={500}>
                    {item.label}
                  </Typography>
                  <Typography variant="h6" fontWeight={800} color="#1e3c72">
                    {typeof item.value === "number" &&
                    ["Total Sales","Profit","Total Purchase","Total Paid","Total Due","Total Balance","Total Expense","Total Refund"].includes(item.label)
                      ? item.value.toLocaleString("en-US", { style: "currency", currency: "USD" })
                      : item.value}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>
    );
  };

  // ---------------- Render Table ----------------
  const renderTable = (data: any, type: ReportType) => {
    if (!data) return <Typography>No data available</Typography>;

    const summary = data.summary;

    const tableContainerStyle = {
      borderRadius: 2,
      overflow: "hidden",
      boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
      mb: 2,
    };

    const tableCellHeaderStyle = {
      fontWeight: 700,
      fontSize: "0.875rem",
      backgroundColor: "#1e3c72",
      color: "#fff",
    };

    const tableRowStyle = (idx: number) => ({
      backgroundColor: idx % 2 === 0 ? "#f9fafb" : "#fff",
      "&:hover": { backgroundColor: "#f0f4f8" },
    });

    switch (type) {
      case "product": {
        const items: ProductReportItem[] = data.items || [];
        return (
          <>
            {renderSummaryCards(summary, type)}
            <TableContainer component={Paper} sx={tableContainerStyle}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {["Product", "Sold Quantity", "Total Revenue", "Total Cost", "Profit", "Remaining Stock"].map((h) => (
                      <TableCell key={h} sx={tableCellHeaderStyle}>
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.length ? (
                    items.map((row, idx) => (
                      <TableRow key={idx} sx={tableRowStyle(idx)}>
                        <TableCell>{row.product || "N/A"}</TableCell>
                        <TableCell>{row.sold_quantity}</TableCell>
                        <TableCell>{row.total_revenue}</TableCell>
                        <TableCell>{row.total_cost}</TableCell>
                        <TableCell>{row.profit}</TableCell>
                        <TableCell>{row.remaining_stock}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No products found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        );
      }

      case "sales": {
        const items: SalesReport[] = data.items || [];
        return (
          <>
            {renderSummaryCards(summary, type)}
            <TableContainer component={Paper} sx={tableContainerStyle}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {["Date", "Invoice", "Customer", "Total", "Profit"].map((h) => (
                      <TableCell key={h} sx={tableCellHeaderStyle}>
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.length ? (
                    items.map((row: any, idx: number) => (
                      <TableRow key={idx} sx={tableRowStyle(idx)}>
                        <TableCell>{row.date}</TableCell>
                        <TableCell>{row.invoice_number}</TableCell>
                        <TableCell>{row.customer_display || "N/A"}</TableCell>
                        <TableCell>{row.total}</TableCell>
                        <TableCell>{row.profit}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No sales found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        );
      }


      case "return": {
  const items: ReturnReportItem[] = data.items || [];
  return (
    <>
      {renderSummaryCards(summary, type)}
      <TableContainer component={Paper} sx={tableContainerStyle}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {["Date", "Invoice Number", "Customer", "Total Refund", "Comment"].map((h) => (
                <TableCell key={h} sx={tableCellHeaderStyle}>
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {items.length ? (
              items.map((row, idx) => (
                <TableRow key={idx} sx={tableRowStyle(idx)}>
                  <TableCell>{row.date}</TableCell>
                  <TableCell>{row.invoice_number}</TableCell>
                  <TableCell>{row.customer}</TableCell>
                  <TableCell>{row.total_refund}</TableCell>
                  <TableCell>{row.comment || "-"}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No returns found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}

      case "purchaseorder": {
        const items = data.items || [];
        return (
          <>
            {renderSummaryCards(summary, type)}
            <TableContainer component={Paper} sx={tableContainerStyle}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {["Date", "Invoice Number", "Supplier", "Total", "Paid", "Due"].map((h) => (
                      <TableCell key={h} sx={tableCellHeaderStyle}>
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.length ? (
                    items.map((row: any, idx: number) => (
                      <TableRow key={idx} sx={tableRowStyle(idx)}>
                        <TableCell>{row.date}</TableCell>
                        <TableCell>{row.invoice_number}</TableCell>
                        <TableCell>{row.supplier_display || "N/A"}</TableCell>
                        <TableCell>{row.total}</TableCell>
                        <TableCell>{row.paid}</TableCell>
                        <TableCell>{row.due}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No purchase orders found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        );
      }

      case "customer": {
        const items = data.items || [];
        return (
          <>
            {renderSummaryCards(summary, type)}
            <TableContainer component={Paper} sx={tableContainerStyle}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {["Date", "Name", "Total Sales", "Total Paid", "Balance", "Sales Count"].map((h) => (
                      <TableCell key={h} sx={tableCellHeaderStyle}>
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.length ? (
                    items.map((row: any, idx: number) => (
                      <TableRow key={idx} sx={tableRowStyle(idx)}>
                        <TableCell>{row.date}</TableCell>
                        <TableCell>{row.customer}</TableCell>
                        <TableCell>{row.total_sales}</TableCell>
                        <TableCell>{row.total_paid}</TableCell>
                        <TableCell>{row.balance}</TableCell>
                        <TableCell>{row.total_returns}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No customers found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        );
      }

      case "supplier": {
        const items = data.items || [];
        return (
          <>
            {renderSummaryCards(summary, type)}
            <TableContainer component={Paper} sx={tableContainerStyle}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {["Date", "Name", "Total Purchase", "Total Paid", "Balance", "Purchase Count"].map((h) => (
                      <TableCell key={h} sx={tableCellHeaderStyle}>
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.length ? (
                    items.map((row: any, idx: number) => (
                      <TableRow key={idx} sx={tableRowStyle(idx)}>
                        <TableCell>{row.date}</TableCell>
                        <TableCell>{row.supplier}</TableCell>
                        <TableCell>{row.total_purchase}</TableCell>
                        <TableCell>{row.total_paid}</TableCell>
                        <TableCell>{row.balance}</TableCell>
                        <TableCell>{row.purchase_count}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No suppliers found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        );
      }

      case "expense": {
        const items: ExpenseBreakdown[] = data.items || [];
        return (
          <>
            {renderSummaryCards(summary, type)}
            <TableContainer component={Paper} sx={tableContainerStyle}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {["Category", "Amount", "Expense Count"].map((h) => (
                      <TableCell key={h} sx={tableCellHeaderStyle}>
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.length ? (
                    items.map((row, idx) => (
                      <TableRow key={idx} sx={tableRowStyle(idx)}>
                        <TableCell>{row.category || "N/A"}</TableCell>
                        <TableCell>{row.total}</TableCell>
                        <TableCell>{row.count}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        No expenses found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        );
      }

      default:
        return <Typography>No data available</Typography>;
    }
  };


  return (
    <Box p={2}>
      {/* Toolbar */}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={2} flexWrap="wrap">
        <Select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          displayEmpty
        >
          <MenuItem value={0}>Annual</MenuItem>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <MenuItem key={m} value={m}>
              {m}
            </MenuItem>
          ))}
        </Select>

        <Select value={year} onChange={(e) => setYear(Number(e.target.value))}>
          {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
            <MenuItem key={y} value={y}>
              {y}
            </MenuItem>
          ))}
        </Select>

        <Button
          variant="contained"
          onClick={handleViewPDF}
          disabled={pdfLoading}
          sx={{
            background: "linear-gradient(180deg, #1e3c72, #2a5298)",
            color: "#fff",
            textTransform: "none",
            borderRadius: 3,
            "&:hover": { transform: "scale(1.05)", boxShadow: "0 8px 16px rgba(0,0,0,0.25)" },
            transition: "all 0.25s ease",
            minWidth: 140,
          }}
        >
          {pdfLoading ? <CircularProgress size={24} color="inherit" /> : "View PDF"}
        </Button>
      </Stack>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          mb: 2,
          "& .MuiTabs-indicator": { backgroundColor: "#1e3c72" },
          "& .MuiTab-root": { textTransform: "none", fontWeight: 600 },
        }}
      >
        {reportTabs.map((tab, idx) => (
          <Tab key={idx} label={tab.label} />
        ))}
      </Tabs>

      {/* Content */}
      {loading ? (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : (
        reportTabs.map((tab, idx) => (
          <TabPanel key={idx} value={activeTab} index={idx}>
            {renderTable(reportData, tab.type)}
          </TabPanel>
        ))
      )}
    </Box>
  );
};

export default ReportPage;
