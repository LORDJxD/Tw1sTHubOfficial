"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase";
import { User } from "@supabase/supabase-js";

const DEFAULT_ADMIN_EMAILS = [
  "rowelljoshuaendriga@gmail.com",
];

export const checkIsAdmin = (email?: string | null): boolean => {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  if (DEFAULT_ADMIN_EMAILS.includes(normalized)) return true;

  const envAdmins = process.env.NEXT_PUBLIC_ADMIN_EMAILS;
  if (envAdmins) {
    const list = envAdmins.split(",").map((e) => e.trim().toLowerCase());
    if (list.includes(normalized)) return true;
  }
  return false;
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isApproved, setIsApproved] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchProfile = async (userId: string, email?: string | null) => {
    const isEmailAdmin = checkIsAdmin(email);
    try {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      const approved = data?.is_approved ?? isEmailAdmin;
      const admin = data?.is_admin === true || isEmailAdmin;

      setIsApproved(!!approved);
      setIsAdmin(!!admin);
    } catch {
      setIsApproved(isEmailAdmin);
      setIsAdmin(isEmailAdmin);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchProfile(currentUser.id, currentUser.email).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Listen for changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchProfile(currentUser.id, currentUser.email).finally(() => setLoading(false));
      } else {
        setIsApproved(false);
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const requireAuth = (callback: () => void) => {
    if (user && isApproved) {
      callback();
    } else {
      router.push("/login");
    }
  };

  const requireAdmin = (callback: () => void) => {
    if (user && isAdmin) {
      callback();
    } else {
      router.push("/admin");
    }
  };

  return {
    user,
    isApproved,
    isAdmin,
    isLoggedIn: !!user,
    loading,
    logout,
    requireAuth,
    requireAdmin
  };
}
