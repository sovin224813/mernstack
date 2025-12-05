import React, { useState, useContext } from "react";
import API from "../utils/api";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const { data } = await API.post("/auth/login", { email, password });
      login(data.data);
      navigate("/chat");
    } catch (err) {
      console.error("Login failed:", err);
      let message = "Invalid credentials.";
      if (err.response) {
        message = err.response.data?.message || "Invalid credentials.";
      } else if (err.request) {
        message = "Cannot connect to the server. Please check your connection.";
      }
      setError(message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[var(--color-bg-secondary)] px-4">
      <div className="w-full max-w-md">
        <form onSubmit={handleSubmit} className="bg-[var(--color-card)] p-8 rounded-lg shadow-xl">
          <h2 className="text-3xl font-bold mb-6 text-center text-[var(--color-text)]">
            Welcome Back!
          </h2>

          {error && <p className="text-[var(--color-danger)] text-sm mb-4 text-center">{error}</p>}

          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
              Email
            </label>
            <input
              id="email"
              className="block w-full border bg-[var(--color-input)] border-[var(--color-input-border)] text-[var(--color-text)] p-3 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                className="block w-full border bg-[var(--color-input)] border-[var(--color-input-border)] text-[var(--color-text)] p-3 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] pr-16"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center px-4 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-brand)]"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button
            className="w-full bg-[var(--color-brand)] text-white p-3 rounded-md font-semibold hover:bg-[var(--color-brand-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] focus:ring-offset-2 transition duration-200"
            type="submit"
          >
            Login
          </button>

          <div className="mt-6 text-center">
            <Link to="/register" className="text-sm text-[var(--color-brand)] hover:underline">
              No account? Register
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}