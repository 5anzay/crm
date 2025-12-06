// src/components/sidebar/Sidebar.tsx
import React from "react";
import {
  Box,
  Button,
  Stack,
  IconButton,
  Typography,
  Tooltip,
} from "@mui/material";
import {
  Menu,
  LayoutDashboard,
  Package,
  Users,
  Truck,
  Receipt,
  ClipboardList,
  CreditCard,
  Banknote,
  Wallet,
  FileText,
  RotateCcw,
} from "lucide-react";

interface Props {
  onNavigate: (
    page:
      | "dashboard"
      | "sales"
      | "products"
      | "customers"
      | "suppliers"
      | "purchaseOrders"
      | "supplierPayments"
      | "customerPayments"
      | "expenses"
      | "reports"
      | "returns"
  ) => void;
  onLogout?: () => void;
}

const Sidebar: React.FC<Props> = ({ onNavigate, onLogout }) => {
  // 🎨 Theme Colors
  const ORANGE_ACCENT = "linear-gradient(180deg, #1e3c72, #2a5298)";
  const ORANGE_ACCENT_GRADIENT = "linear-gradient(180deg, #1e3c72, #2a5298)";
  const LIGHT_SIDEBAR_BACKGROUND = "rgba(238,241,245)";
  const DARK_TEXT_COLOR = "#333333";
  const INACTIVE_TEXT_COLOR = "#616161";

  const menuItems: {
    label: string;
    page: Props["onNavigate"] extends (p: infer P) => void ? P : never;
    icon: React.ReactNode;
  }[] = [
    { label: "Dashboard", page: "dashboard", icon: <LayoutDashboard /> },
    { label: "Sales", page: "sales", icon: <Receipt /> },
    { label: "Products", page: "products", icon: <Package /> },
    { label: "Customers", page: "customers", icon: <Users /> },
    { label: "Suppliers", page: "suppliers", icon: <Truck /> },
    {
      label: "Purchase Orders",
      page: "purchaseOrders",
      icon: <ClipboardList />,
    },
    {
      label: "Supplier Payments",
      page: "supplierPayments",
      icon: <CreditCard />,
    },
    {
      label: "Customer Payments",
      page: "customerPayments",
      icon: <Banknote />,
    },
    { label: "Expenses", page: "expenses", icon: <Wallet /> },
    { label: "Reports", page: "reports", icon: <FileText /> },
    { label: "Returns", page: "returns", icon: <RotateCcw /> },
  ];

  const [activePage, setActivePage] = React.useState(menuItems[0].page);
  const [collapsed, setCollapsed] = React.useState(false);

  const handleClick = (page: typeof activePage) => {
    setActivePage(page);
    onNavigate(page);
  };

  return (
    <Box
      sx={{
        width: collapsed ? 80 : 245,
        transition: "all 0.35s ease-in-out",
        height: "100vh",
        background: LIGHT_SIDEBAR_BACKGROUND,
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        boxShadow: "0 8px 40px rgba(255,255,255,0.2)",
        color: DARK_TEXT_COLOR,
        p: 2,
        display: "flex",
        flexDirection: "column",
        borderRadius: "0 12px 12px 0",
        overflow: "hidden",
      }}
    >
      {/* 🔝 Top Section */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent={collapsed ? "center" : "space-between"}
        sx={{ mb: 3, transition: "all 0.3s ease-in-out", flexShrink: 0 }}
      >
        {!collapsed && (
          <Typography
            variant="h6"
            fontWeight={700}
            sx={{
              ml: 1,
              whiteSpace: "nowrap",
              px: 6,
              fontSize: "1.8rem",
              color: ORANGE_ACCENT,
            }}
          >
            JSMT
          </Typography>
        )}
        <IconButton
          onClick={() => setCollapsed(!collapsed)}
          sx={{
            color: ORANGE_ACCENT,
            "&:hover": { backgroundColor: "rgba(198,40,40,0.1)" },
            transition: "all 0.3s ease-in-out",
          }}
        >
          <Menu />
        </IconButton>
      </Stack>

      {/* 📋 Menu Buttons - Scrollable */}
      <Box sx={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
        <Stack spacing={2.5}>
          {menuItems.map((item) => {
            const isActive = activePage === item.page;
            const button = (
              <Button
                startIcon={
                  <Box
                    sx={{
                      fontSize: collapsed ? "1.8rem" : "1.2rem",
                      transition: "font-size 0.3s ease-in-out",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transform: collapsed ? "scale(1.4)" : "scale(1)",
                      color: isActive ? ORANGE_ACCENT : INACTIVE_TEXT_COLOR,
                    }}
                  >
                    {item.icon}
                  </Box>
                }
                fullWidth
                onClick={() => handleClick(item.page)}
                sx={{
                  justifyContent: collapsed ? "center" : "flex-start",
                  backgroundColor: isActive
                    ? "rgba(10, 10, 120, 0.3)"
                    : "transparent",
                  color: isActive ? ORANGE_ACCENT : INACTIVE_TEXT_COLOR,
                  textTransform: "none",
                  fontWeight: 700,
                  borderRadius: 4,
                  p: 1.5,
                  fontSize: collapsed ? "0.8rem" : "1rem",
                  boxShadow: isActive
                    ? "0 4px 12px rgba(198,40,40,0.2)"
                    : "none",
                  "&:hover": {
                    backgroundColor: isActive
                      ? ORANGE_ACCENT_GRADIENT
                      : "rgba(0,0,0,0.05)",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.05)",
                    transform: "translateX(4px)",
                    color: ORANGE_ACCENT,
                  },
                  transition: "all 0.3s ease-in-out",
                }}
              >
                {!collapsed && item.label}
              </Button>
            );




            return (
              <Box key={item.label} sx={{ position: "relative" }}>
                {/* 🔶 Vertical Orange Gradient Highlight */}
                {isActive && (
                  <Box
                    sx={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: "5px",
                      borderRadius: "0 4px 4px 0",
                      background: ORANGE_ACCENT_GRADIENT,
                      opacity: 0.9,
                      transition: "all 0.3s ease-in-out",
                    }}
                  />
                )}
                {collapsed ? (
                  <Tooltip title={item.label} placement="right">
                    {button}
                  </Tooltip>
                ) : (
                  button
                )}
              </Box>
            );
          })}

          {/* 🔚 Logout Button */}
{onLogout && (
<Button
  startIcon={<RotateCcw />}
  onClick={() => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    onLogout(); // notify parent
  }}
  sx={{
    mt: 3,
    justifyContent: collapsed ? "center" : "flex-start",
    backgroundColor: "transparent",
    color: "#d32f2f",
    textTransform: "none",
    fontWeight: 700,
    borderRadius: 4,
    p: 1.5,
    fontSize: collapsed ? "0.8rem" : "1rem",
    "&:hover": {
      backgroundColor: "rgba(211,47,47,0.1)",
      transform: "translateX(4px)",
    },
    transition: "all 0.3s ease-in-out",
  }}
>
  {!collapsed && "Logout"}
</Button>
)}
        </Stack>
      </Box>
    </Box>
  );
};

export default Sidebar;
