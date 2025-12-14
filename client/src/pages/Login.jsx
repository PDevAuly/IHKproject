// client/src/pages/Login.jsx
import React, { useState } from "react";
import { API_BASE } from "../config";

export default function Login() {
  const [email, setEmail] = useState("ashraf@example.com");
  const [password, setPassword] = useState("geheim123");
  const [error, setError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Login fehlgeschlagen");
        return;
      }

      // User + Token im Local Storage ablegen
      localStorage.setItem("user", JSON.stringify(data));

      // Weiter zum Dashboard (Platzhalter)
      window.location.href = "/dashboard";
    } catch (err) {
      console.error("Login-Fehler im Frontend:", err);
      setError("Server nicht erreichbar");
    }
  }

  return (
    <div style={{ maxWidth: "400px", margin: "80px auto", fontFamily: "sans-serif" }}>
      <h2 style={{ marginBottom: "20px" }}>Onboarding-Tool Login</h2>

      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: "10px" }}>
          <input
            type="email"
            placeholder="E-Mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: "8px" }}
          />
        </div>
        <div style={{ marginBottom: "10px" }}>
          <input
            type="password"
            placeholder="Passwort"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", padding: "8px" }}
          />
        </div>
        <button
          type="submit"
          style={{
            width: "100%",
            padding: "10px",
            cursor: "pointer",
          }}
        >
          Login
        </button>
      </form>

      {error && (
        <p style={{ color: "red", marginTop: "10px" }}>
          {error}
        </p>
      )}
    </div>
  );
}
