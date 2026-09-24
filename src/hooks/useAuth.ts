"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export function useAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const loggedIn = localStorage.getItem("loggedIn") === "true";
    setIsLoggedIn(loggedIn);
  }, []);

  const login = (password: string) => {
    if (password === "admin") {
      localStorage.setItem("loggedIn", "true");
      setIsLoggedIn(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem("loggedIn");
    setIsLoggedIn(false);
    router.push("/login");
  };

  const requireAuth = (callback: () => void) => {
    if (isLoggedIn) {
      callback();
    } else {
      router.push("/login");
    }
  };

  return { isLoggedIn, login, logout, requireAuth };
}
