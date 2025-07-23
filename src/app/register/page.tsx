"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST", 
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      let data;
      try {
        data = await response.json();
      } catch {
        data = {};
      }
      console.log('Register API response:', data);
      
      if(!response.ok) {
        setError(data.error || "Registration failed");
        return;
      }

      //redirect to login
      router.push("/login");
    } catch (error) {
      console.error(error);
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Create Account</h2>

      <form onSubmit={handleSubmit}>
        {error && (
          <p data-testid="register-error">{error}</p>
        )}

        <div>
          <label htmlFor="username">username</label>
          <input
            id="username"
            name="username"
            type="username"
            required
            disabled={loading}
            value={formData.username}
            onChange={(e) =>
              setFormData({...formData, username: e.target.value})
            }
          />
        </div>

        <div>
          <label htmlFor="email">email</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            disabled={loading}
            value={formData.email}
            onChange={(e) =>
              setFormData({...formData, email: e.target.value})
            }
          />
        </div>

        <div>
          <label htmlFor="password">password</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            disabled={loading}
            value={formData.password}
            onChange={(e) =>
              setFormData({...formData, password: e.target.value})
            }
          />
          
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Creating Account..." : "Register"}
        </button>
      </form>

    </div>
  );
}