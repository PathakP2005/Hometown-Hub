import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !password) {
      return setMessage("Please fill in name, email, and password.");
    }

    try {
      const res = await axios.post("http://localhost:5000/api/auth/register", {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      setMessage(res.data.msg || "Registration successful. You can now login.");
      setName("");
      setEmail("");
      setPassword("");
      setTimeout(() => {
        navigate("/login");
      }, 1000);
    } catch (err) {
      console.error("Register error:", err);
      const errorMessage =
        err.response?.data?.msg ||
        err.response?.data?.message ||
        err.response?.data ||
        err.message;
      setMessage(`Registration failed: ${errorMessage}`);
    }
  };

  return (
    <div style={{ maxWidth: "420px", margin: "40px auto", padding: "20px", border: "1px solid #ddd", borderRadius: "12px", fontFamily: "Arial, sans-serif" }}>
      <h2>Register</h2>
      <form onSubmit={handleRegister}>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ width: "100%", padding: "10px", marginBottom: "12px", borderRadius: "6px", border: "1px solid #ccc" }}
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", padding: "10px", marginBottom: "12px", borderRadius: "6px", border: "1px solid #ccc" }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", padding: "10px", marginBottom: "12px", borderRadius: "6px", border: "1px solid #ccc" }}
        />
        <button type="submit" style={{ width: "100%", padding: "12px", borderRadius: "6px", border: "none", background: "#007bff", color: "white", cursor: "pointer" }}>
          Register
        </button>
      </form>
      {message && (
        <div style={{ marginTop: "16px", padding: "12px", borderRadius: "8px", background: "#f5f7ff", color: "#1e3a8a" }}>
          {message}
        </div>
      )}
      <p style={{ marginTop: "16px" }}>
        Already have an account? <a href="/login">Login here</a>.
      </p>
    </div>
  );
}

export default Register;
