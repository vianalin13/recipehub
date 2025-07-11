"use client";

import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";


export default function LoginPage() {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      username: formData.username,
      password: formData.password,
      redirect: false
    });

    if(result?.error) {
      setError("Invalid username or password");
    } else {
      router.push("/"); //redirect
    }
    setLoading(false);
  };

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        {error && <p>{error}</p>}

        <div>
          <label>username</label>
          <input
            type="username"
            value={formData.username}
            onChange={e => setFormData({...formData, username: e.target.value})}
            required
          />
        </div>

        <div>
          <label>password</label>
          <input
            type="password"
            value={formData.password}
            onChange={e => setFormData({...formData, password: e.target.value})}
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}