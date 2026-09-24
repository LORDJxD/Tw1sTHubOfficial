"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loadingForm, setLoadingForm] = useState(false);
  
  const { isLoggedIn, isApproved, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  // If they are logged in but NOT approved, show the pending screen
  if (isLoggedIn && !authLoading && !isApproved) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
        <div className="bg-gray-900 border border-yellow-600/50 rounded-2xl p-6 md:p-8 w-full max-w-md text-center shadow-lg shadow-yellow-900/10">
          <span className="text-5xl mb-4 block">⏳</span>
          <h2 className="text-2xl font-bold text-yellow-500 mb-2">Approval Pending</h2>
          <p className="text-gray-300 text-sm md:text-base mb-6">
            Your application has been received. An admin needs to approve your account before you can access the hub.
          </p>
          <button 
            onClick={logout}
            className="px-6 py-2 rounded-lg border border-red-600 text-red-500 hover:bg-red-900/30 transition active:scale-95 text-sm"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  // If they are logged in AND approved, redirect them
  if (isLoggedIn && !authLoading && isApproved) {
    router.push("/more");
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingForm(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      setError(error.message);
    }
    setLoadingForm(false);
  };

  const handleApply = async () => {
    if (!email || !password) {
      setError("Please enter an email and password to apply.");
      return;
    }
    setLoadingForm(true);
    setError("");

    const { data, error } = await supabase.auth.signUp({ email, password });
    
    if (error) {
      setError(error.message);
    } else {
      if (data?.user) {
        // Also register profile row for the admin to see in pending approvals
        try {
          await supabase.from("profiles").upsert({
            id: data.user.id,
            email: email,
            is_approved: false,
            created_at: new Date().toISOString()
          });
        } catch {
          // Trigger will handle if present
        }
      }
      setError("Application submitted! Log in to check your approval status.");
    }
    setLoadingForm(false);
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
          
          {error && <p className={`text-xs md:text-sm ${error.includes("submitted") ? "text-green-500" : "text-red-500"}`}>{error}</p>}
          
          <button 
            type="submit"
            disabled={loadingForm || authLoading}
            className="p-3 md:p-4 mt-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold transition-colors active:scale-95 text-sm md:text-base"
          >
            {loadingForm ? "Loading..." : "Login"}
          </button>

          <button 
            type="button"
            onClick={handleApply}
            disabled={loadingForm || authLoading}
            className="p-3 md:p-4 rounded-lg border border-red-600 hover:bg-red-900/30 disabled:opacity-50 text-red-500 font-bold transition-colors active:scale-95 text-sm md:text-base"
          >
            Apply for Account
          </button>
        </form>
      </div>
    </div>
  );
}
