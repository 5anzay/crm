import React, { useState } from "react";
import { Box, TextField, Button, Typography, Paper } from "@mui/material";
import axios from "axios";

interface LoginPageProps {
  onLoginSuccess: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    try {
      const response = await axios.post("http://173.234.14.163:8000/api/token/", {
        username,
        password,
      });

      localStorage.setItem("access_token", response.data.access);
      localStorage.setItem("refresh_token", response.data.refresh);

      setError("");
      onLoginSuccess();
    } catch (err) {
      setError("Invalid username or password");
    }
  };

  const circles = Array.from({ length: 8 });

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
        fontFamily: "Arial, sans-serif",
        overflow: "hidden",
        background: "#0f1f3d",
      }}
    >
      {/* Blue Fire Background Circles */}
      {circles.map((_, idx) => (
        <Box
          key={idx}
          sx={{
            position: "absolute",
            width: 400 + idx * 50,
            height: 400 + idx * 50,
            borderRadius: "50%",
            background: "rgba(0, 150, 255, 0.1)",
            bottom: "-200px",
            left: `${-100 + idx * 50}px`,
            filter: "blur(150px)",
            animation: `floatUp${idx} 15s ease-in-out infinite alternate`,
          }}
        />
      ))}

      {/* Animation Keyframes */}
      <style>
        {circles
          .map(
            (_, idx) => `
          @keyframes floatUp${idx} {
            0% { transform: translate(0,0) rotate(0deg); }
            50% { transform: translate(${50 - idx * 20}px, -${300 + idx * 50}px) rotate(45deg); }
            100% { transform: translate(0,-${600 + idx * 30}px) rotate(0deg); }
          }
        `
          )
          .join("\n")}
      </style>

      {/* Login Card */}
      <Paper
        elevation={6}
        sx={{
          p: 4,
          borderRadius: 3,
          width: 350,
          bgcolor: "rgba(35,57,93,0.95)",
          color: "#fff",
          zIndex: 1,
          textAlign: "center",
        }}
      >
        <Typography variant="h5" sx={{ mb: 3, color: "#00bfff" }}>
          Welcome Back
        </Typography>

        <TextField
          fullWidth
          label="Username"
          variant="filled"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          sx={{
            mb: 2,
            input: { color: "#fff" },
            ".MuiFilledInput-root": { backgroundColor: "rgba(43,70,109,0.7)" },
          }}
        />
        <TextField
          fullWidth
          label="Password"
          type="password"
          variant="filled"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          sx={{
            mb: 3,
            input: { color: "#fff" },
            ".MuiFilledInput-root": { backgroundColor: "rgba(43,70,109,0.7)" },
          }}
        />

        <Button
          fullWidth
          variant="contained"
          sx={{
            bgcolor: "#1e90ff",
            ":hover": { bgcolor: "#187bcd" },
            fontWeight: "bold",
            py: 1.5,
          }}
          onClick={handleLogin}
        >
          Login
        </Button>

        {error && (
          <Typography color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}
      </Paper>
    </Box>
  );
};

export default LoginPage;
