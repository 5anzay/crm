// src/App.tsx
import React, { useEffect, useState } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import MainLayout from "./components/sidebar/MainLayout"; // correct path
import axios from "axios";
import LoginPage from "./components/LoginPage"; // correct path for LoginPage
import { Box, CircularProgress } from "@mui/material";

const theme = createTheme({
  typography: {
    fontFamily: "'Montserrat', sans-serif",
    h5: { fontWeight: 800 },
    h6: { fontWeight: 700 },
    body1: { fontWeight: 500 },
    body2: { fontWeight: 400 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: "none",
          fontWeight: 600,
        },
      },
    },
  },
});

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setLoggedIn(false);
        setLoading(false);
        return;
      }

      try {
        await axios.get("http://localhost:8000/api/auth-check/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setLoggedIn(true);
      } catch (err) {
        setLoggedIn(false);
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading)
    return (
      <Box
        sx={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {loggedIn ? (
        <MainLayout />
      ) : (
        <LoginPage onLoginSuccess={() => setLoggedIn(true)} />
      )}
    </ThemeProvider>
  );
};

export default App;
