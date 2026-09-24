"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(password)) {
      router.push("/more");
    } else {
      setError("Invalid username or password. (Hint: use admin/admin)");
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
      <div className="bg-gray-900 border border-red-900 rounded-2xl p-6 md:p-8 w-full max-w-sm md:max-w-md shadow-lg shadow-red-900/20 transition-all duration-300">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-6 md:mb-8 text-red-500">Account Login</h2>
        
        <form onSubmit={handleLogin} className="space-y-4 md:space-y-5 flex flex-col">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="p-3 md:p-4 rounded-lg bg-black border border-gray-700 text-white focus:outline-none focus:border-red-500 transition text-sm md:text-base"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="p-3 md:p-4 rounded-lg bg-black border border-gray-700 text-white focus:outline-none focus:border-red-500 transition text-sm md:text-base"
          />
          
          {error && <p className="text-red-500 text-xs md:text-sm">{error}</p>}
          
          <button 
            type="submit"
            className="p-3 md:p-4 mt-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold transition-colors active:scale-95 text-sm md:text-base"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
