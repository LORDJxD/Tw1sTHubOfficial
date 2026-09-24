"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      setError(error.message);
    } else {
      router.push("/more");
    }
    setLoading(false);
  };

  const handleSignUp = async () => {
    if (!email || !password) {
      setError("Please enter an email and password to sign up.");
      return;
    }
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signUp({ email, password });
    
    if (error) {
      setError(error.message);
    } else {
      setError("Account created! You can now log in."); // If email confirmations are off, they can just login.
    }
    setLoading(false);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
      <div className="bg-gray-900 border border-red-900 rounded-2xl p-6 md:p-8 w-full max-w-sm md:max-w-md shadow-lg shadow-red-900/20 transition-all duration-300">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-6 md:mb-8 text-red-500">Tw1sT Login</h2>
        
        <form onSubmit={handleLogin} className="space-y-4 md:space-y-5 flex flex-col">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
          
          {error && <p className={`text-xs md:text-sm ${error.includes("created") ? "text-green-500" : "text-red-500"}`}>{error}</p>}
          
          <button 
            type="submit"
            disabled={loading}
            className="p-3 md:p-4 mt-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold transition-colors active:scale-95 text-sm md:text-base"
          >
            {loading ? "Loading..." : "Login"}
          </button>

          <button 
            type="button"
            onClick={handleSignUp}
            disabled={loading}
            className="p-3 md:p-4 rounded-lg border border-red-600 hover:bg-red-900/30 disabled:opacity-50 text-red-500 font-bold transition-colors active:scale-95 text-sm md:text-base"
          >
            Create Account
          </button>
        </form>
      </div>
    </div>
  );
}
