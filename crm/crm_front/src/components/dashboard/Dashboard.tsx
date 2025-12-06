import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Stack,
  Card,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
} from "@mui/material";
import {
  FaShoppingCart,
  FaDollarSign,
  FaArrowDown,
  FaChartLine,
  FaUsers,
  FaPlus,
} from "react-icons/fa";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import { fetchDashboardData } from "./api";

interface StatusCard {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}

interface LowStock {
  product: string;
  quantity: number;
}

interface RecentSale {
  date: string;
  invoice_number: string;
  customer_display: string;
  total: number;
  profit: number;
}

interface ChartData {
  name: string;
  sales: number;
  expense: number;
}

interface ActionButton {
  label: string;
  route: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<"today" | "monthly" | "yearly">("today");
  const [loading, setLoading] = useState(true);
  const [statusCards, setStatusCards] = useState<StatusCard[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<LowStock[]>([]);
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [chartData, setChartData] = useState<{
    today: ChartData[];
    monthly: ChartData[];
    yearly: ChartData[];
  }>({
    today: [],
    monthly: [],
    yearly: [],
  });

  const actionButtons: ActionButton[] = [
    { label: "New Sale", route: "/sales" },
    { label: "New PO", route: "/purchaseOrders" },
    { label: "Pay Supplier ", route: "/supplierPayments" },
    { label: "Customer Pay", route: "/customerPayments" },
  ];

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      try {
        const data = await fetchDashboardData();

        setStatusCards([
          {
            title: "Total Sales Today",
            value: data.status_cards.total_sales_today,
            icon: <FaShoppingCart color="#2196f3" size={26} />,
          },
          {
            title: "Money In Today",
            value: data.status_cards.money_in_today,
            icon: <FaDollarSign color="#4caf50" size={26} />,
          },
          {
            title: "Money Out Today",
            value: data.status_cards.money_out_today,
            icon: <FaArrowDown color="#f44336" size={26} />,
          },
          {
            title: "Net Profit",
            value: data.status_cards.net_profit,
            icon: <FaChartLine color="#ff9800" size={26} />,
          },
          {
            title: "Total Customers",
            value: data.status_cards.total_customers,
            icon: <FaUsers color="#9c27b0" size={26} />,
          },
        ]);

        setLowStockProducts(data.low_stock_products || []);
        setRecentSales(data.recent_sales || []);
        setChartData({
          today: data.chart?.today || [],
          monthly: data.chart?.monthly || [],
          yearly: data.chart?.yearly || [],
        });
      } catch (err) {
        console.error("Failed to fetch dashboard:", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  const handleActionClick = (route: string) => {
    navigate(route, { state: { openForm: true } });
  };

  // Glassmorphism shared style
  const glassStyle = {
    background: "rgba(0, 0, 0, 0.01)", // more transparent
    backdropFilter: "blur(12px)",             // stronger blur for depth
    border: "1px solid rgba(255, 255, 255, 0.1)",
    boxShadow: "0 8px 40px rgba(255,255,255,0.2)",

     // softer shadow
  };
  return (
    <Box
      sx={{
        p: 3,
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor:"fff",

      }}
    >
      {/* === Status Cards === */}
      <Stack direction="row" justifyContent="space-between" spacing={2} mb={4}>
        {statusCards.map((card) => (
          <Card
            key={card.title}
            sx={{
              flex: 1,
              ...glassStyle,
              borderRadius: 3,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: 2.5,
              py: 2,
              color: "#fff",
              "&:hover": {
                transform: "translateY(-3px)",
                  boxShadow: "0 4px 20px rgba(31, 38, 135, 0.15)",
              },
            }}
          >
            <Box sx={{ display: "flex", flexDirection: "column" }}>
              <Typography variant="subtitle2" color="#475569">
                {card.title}
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="#475569">
                {card.value}
              </Typography>
            </Box>
            <Box
              sx={{
                width: 45,
                height: 45,
                borderRadius: "50%",
                backgroundColor: "rgba(255,255,255,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {card.icon}
            </Box>
          </Card>
        ))}
      </Stack>

      {/* === Row 2: Chart, Low Stock, Action Buttons === */}
      <Stack direction="row" spacing={2} sx={{ flexGrow: 1 }}>
        {/* Chart Section */}
        <Box
          sx={{
            flex: 3,
            ...glassStyle,
            borderRadius: 3,
            p: 3,
            display: "flex",
            flexDirection: "column",
            height: "350px",
            color: "#fff",
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            mb={1}
          >
            <Typography variant="h6" fontWeight={600} color="#475569">
              Sales & Expense Overview
            </Typography>
            <Stack direction="row" spacing={1}>
              {["today", "monthly", "yearly"].map((v) => (
                <Button
                  key={v}
                  variant={view === v ? "contained" : "outlined"}
                  size="small"
                  onClick={() => setView(v as any)}
                  sx={{
                    borderRadius: 2,
                    textTransform: "capitalize",
                    color: view === v ? "#fff" : "#fff",
                    background:
                      view === v
                        ? "linear-gradient(90deg, #1e3c72, #2a5298)"
                        : "linear-gradient(180deg, #004e92, #000428)",
                    borderColor: "rgba(255,255,255,0.3)",
                    "&:hover": {
                      background:
                        "linear-gradient(180deg, #004e92, #000428)",
                      color: "#fff",
                    },
                  }}
                >
                  {v}
                </Button>
              ))}
            </Stack>
          </Stack>

          <ResponsiveContainer width="100%" height={260}>
            {view === "today" ? (
              <BarChart data={chartData.today}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis dataKey="name" stroke="#475569" />
                <YAxis stroke="#475569" />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="sales"
                  fill="#475569"
                  barSize={40}
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="expense"
                  fill="#f85032"
                  barSize={40}
                  radius={[6, 6, 0, 0]}
                />

              </BarChart>
            ) : (
              <LineChart data={chartData[view]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis dataKey="name" stroke="#475569" />
                <YAxis stroke="#475569" />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="#475569"
                  strokeWidth={3}
                />
                <Line
                  type="monotone"
                  dataKey="expense"
                  stroke="#f85032"
                  strokeWidth={3}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </Box>

        {/* Low Stock Table */}
        <Box
          sx={{
            flex: 1.5,
            ...glassStyle,
            borderRadius: 3,
            p: 2,
            overflowY: "auto",
            height: "350px",
            color: "#fff",
          }}
        >
          <Typography variant="h6" fontWeight={600} mb={1} color="#475569">
            Low Stock Products
          </Typography>
          <Table size="small" stickyHeader>
            <TableHead >
              <TableRow>
                <TableCell sx={{ fontWeight: 600, backgroundColor:"rgba(0, 0, 0, 0.01)",color:"#475569" }}>Product</TableCell>
                <TableCell sx={{ fontWeight: 600, backgroundColor:"rgba(0, 0, 0, 0.01)",color:"#475569" }}>Quantity</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {lowStockProducts.map((p, i) => (
                <TableRow key={i}>
                  <TableCell sx={{color: "#475569" }}>{p.product}</TableCell>
                  <TableCell sx={{ color: "#475569" }}>{p.quantity}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>

        {/* Action Buttons */}
        <Stack
          spacing={1.5}
          sx={{
            flex: 1,
            ...glassStyle,
            borderRadius: 3,
            p: 2.5,
            justifyContent: "center",
            alignItems: "stretch",
            height: "350px",
          }}
        >
          {actionButtons.map((btn) => (
            <Button
              key={btn.label}
              variant="contained"
              startIcon={<FaPlus />}
              onClick={() => handleActionClick(btn.route)}
              sx={{
                background: "linear-gradient(90deg, #1e3c72, #2a5298)",
                color: "#fff",
                py: 1.3,
                borderRadius: 2,
                fontWeight: 600,
                textTransform: "none",
                "&:hover": {
                  background: "linear-gradient(180deg, #004e92, #000428)",
                },
              }}
            >
              {btn.label}
            </Button>
          ))}
        </Stack>
      </Stack>

      {/* === Recent Sales === */}
      <Box
        sx={{
          ...glassStyle,
          borderRadius: 3,
          p: 3,
          height: "280px",
          mb: 3,
          color: "#fff",
        }}
      >
        <Typography variant="h6" fontWeight={600} mb={1.5} color= "#475569">
          Recent Sales
        </Typography>
        <Table size="small" stickyHeader>
          <TableHead >
            <TableRow >
              <TableCell sx={{backgroundColor:"rgba(0, 0, 0, 0.01)", color: "#475569" }}>Date</TableCell>
              <TableCell sx={{backgroundColor:"rgba(0, 0, 0, 0.01)", color: "#475569" }}>Invoice</TableCell>
              <TableCell sx={{ backgroundColor:"rgba(0, 0, 0, 0.01)",color: "#475569" }}>Customer</TableCell>
              <TableCell sx={{ backgroundColor:"rgba(0, 0, 0, 0.01)",color: "#475569" }}>Total</TableCell>
              <TableCell sx={{ backgroundColor:"rgba(0, 0, 0, 0.01)",color: "#475569" }}>Profit</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {recentSales.map((sale, idx) => (
              <TableRow key={idx}>
                <TableCell sx={{ color: "#475569" }}>{sale.date}</TableCell>
                <TableCell sx={{ color: "#475569" }}>{sale.invoice_number}</TableCell>
                <TableCell sx={{ color: "#475569" }}>{sale.customer_display}</TableCell>
                <TableCell sx={{ color: "#475569" }}>{sale.total}</TableCell>
                <TableCell sx={{ color: "#475569" }}>{sale.profit}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </Box>
  );
};

export default Dashboard;
