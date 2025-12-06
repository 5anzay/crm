// src/components/layout/MainLayout.tsx
import React from "react";
import { Box } from "@mui/material";
import { Routes, Route, useNavigate } from "react-router-dom";
import Sidebar from "../sidebar/Sidebar";
import DashboardPage from "../dashboard/Dashboard";
import ProductList from "../products/ProductList";
import CustomerList from "../customers/CustomerList";
import CustomerDetail from "../customers/CustomerDetail";
import SupplierList from "../suppliers/SupplierList";
import SupplierDetail from "../suppliers/SupplierDetail";
import POList from "../purchaseOrders/POList";
import SaleList from "../sales/SaleList";
import SupplierPaymentList from "../supplierPayments/SupplierPaymentList";
import CustomerPaymentList from "../customerPayments/CustomerPaymentList";
import ExpenseList from "../expenses/ExpenseList";
import ReportPage from "../reports/ReportPage";
import ReturnList from "../returns/ReturnList";

const MainLayout: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
      }}
    >
    <Sidebar
onNavigate={navigate}
onLogout={() => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  window.location.reload(); // refresh app to show login page
}}
/>

      <Box
        sx={{
          flex: 1,
          bgcolor: "#f0f4f8",
          overflow: "auto",
          height: "100vh",
        }}
      >
        <Box sx={{ p: 3, minHeight: "100%" }}>
          <Routes>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/products" element={<ProductList />} />
            <Route path="/customers" element={<CustomerList />} />
            <Route path="/customers/:id" element={<CustomerDetail />} />
            <Route path="/customerPayments" element={<CustomerPaymentList />} />
            <Route path="/suppliers" element={<SupplierList />} />
            <Route path="/suppliers/:id" element={<SupplierDetail />} />
            <Route path="/supplierPayments" element={<SupplierPaymentList />} />
            <Route path="/sales" element={<SaleList />} />
            <Route path="/purchaseOrders" element={<POList />} />
            <Route path="/expenses" element={<ExpenseList />} />
            <Route path="/reports" element={<ReportPage />} />
            <Route path="/returns" element={<ReturnList />} />
            <Route path="*" element={<DashboardPage />} />
          </Routes>
        </Box>
      </Box>
    </Box>
  );
};

export default MainLayout;
