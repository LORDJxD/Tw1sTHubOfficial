"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/utils/supabase";

type Profile = {
  id: string;
  email: string | null;
  is_approved: boolean | null;
  is_admin: boolean | null;
  created_at: string;
};

type ChatMessage = {
  id: string;
  sender_email: string;
  text: string;
  created_at: string;
};

export default function AdminPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState<"pending" | "all" | "chat" | "setup">("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "admin">("all");
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [alertNotice, setAlertNotice] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  const showAlert = (text: string, type: "success" | "error" | "info" = "info") => {
    setAlertNotice({ text, type });
    setTimeout(() => {
      setAlertNotice((current) => (current?.text === text ? null : current));
    }, 5000);
  };

  const loadData = async () => {
    setLoadingData(true);
    try {
      // Fetch all profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        showAlert(
          "Could not fetch profiles: " + profilesError.message + ". Make sure the RLS policies in 'Database Setup' are applied.",
          "error"
        );
      } else if (profilesData) {
        setProfiles(profilesData as Profile[]);
      }

      // Fetch recent messages for moderation
      const { data: messagesData, error: messagesError } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (!messagesError && messagesData) {
        setMessages(messagesData as ChatMessage[]);
      }
    } catch (err: unknown) {
      console.error("Admin dashboard fetch error:", err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (!authLoading && isAdmin) {
      loadData();

      // Realtime subscription for profiles
      const profilesChannel = supabase
        .channel("admin:profiles")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "profiles" },
          (payload) => {
            if (payload.eventType === "INSERT") {
              const newProf = payload.new as Profile;
              setProfiles((prev) => [newProf, ...prev.filter((p) => p.id !== newProf.id)]);
              showAlert(`New application received: ${newProf.email || newProf.id}`, "info");
            } else if (payload.eventType === "UPDATE") {
              const updated = payload.new as Profile;
              setProfiles((prev) =>
                prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
              );
            } else if (payload.eventType === "DELETE") {
              const old = payload.old as { id: string };
              setProfiles((prev) => prev.filter((p) => p.id !== old.id));
            }
          }
        )
        .subscribe();

      // Realtime subscription for messages
      const messagesChannel = supabase
        .channel("admin:messages")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "messages" },
          (payload) => {
            if (payload.eventType === "INSERT") {
              const newMsg = payload.new as ChatMessage;
              setMessages((prev) => [newMsg, ...prev.filter((m) => m.id !== newMsg.id)]);
            } else if (payload.eventType === "DELETE") {
              const old = payload.old as { id: string };
              setMessages((prev) => prev.filter((m) => m.id !== old.id));
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(profilesChannel);
        supabase.removeChannel(messagesChannel);
      };
    }
  }, [authLoading, isAdmin]);

  // Set approval status
  const handleSetApproval = async (id: string, isApproved: boolean) => {
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_approved: isApproved })
        .eq("id", id);

      if (error) {
        showAlert(`Failed to update approval: ${error.message}. Check Database Setup RLS permissions.`, "error");
      } else {
        setProfiles((prev) =>
          prev.map((p) => (p.id === id ? { ...p, is_approved: isApproved } : p))
        );
        showAlert(
          `User ${isApproved ? "Approved" : "Access Revoked"} successfully.`,
          "success"
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showAlert(`An error occurred: ${msg}`, "error");
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  // Toggle admin status
  const handleToggleAdmin = async (id: string, currentIsAdmin: boolean | null) => {
    const nextVal = !currentIsAdmin;
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_admin: nextVal })
        .eq("id", id);

      if (error) {
        showAlert(`Failed to update admin role: ${error.message}`, "error");
      } else {
        setProfiles((prev) =>
          prev.map((p) => (p.id === id ? { ...p, is_admin: nextVal } : p))
        );
        showAlert(`User admin role ${nextVal ? "granted" : "revoked"}.`, "success");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showAlert(`An error occurred: ${msg}`, "error");
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  // Delete profile
  const handleDeleteProfile = async (id: string, email: string | null) => {
    if (!confirm(`Are you sure you want to remove the profile for ${email || id}?`)) return;

    setActionLoading((prev) => ({ ...prev, [id]: true }));
    try {
      const { error } = await supabase.from("profiles").delete().eq("id", id);
      if (error) {
        showAlert(`Failed to delete profile: ${error.message}`, "error");
      } else {
        setProfiles((prev) => prev.filter((p) => p.id !== id));
        showAlert("Profile deleted successfully.", "success");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showAlert(`An error occurred: ${msg}`, "error");
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  // Approve all pending
  const handleApproveAllPending = async () => {
    const pendingList = profiles.filter((p) => !p.is_approved);
    if (pendingList.length === 0) return;

    if (!confirm(`Approve all ${pendingList.length} pending applications?`)) return;

    setActionLoading((prev) => ({ ...prev, all: true }));
    try {
      const ids = pendingList.map((p) => p.id);
      const { error } = await supabase
        .from("profiles")
        .update({ is_approved: true })
        .in("id", ids);

      if (error) {
        showAlert(`Failed to approve all: ${error.message}`, "error");
      } else {
        setProfiles((prev) =>
          prev.map((p) => (ids.includes(p.id) ? { ...p, is_approved: true } : p))
        );
        showAlert(`Successfully approved ${pendingList.length} user(s)!`, "success");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showAlert(`An error occurred: ${msg}`, "error");
    } finally {
      setActionLoading((prev) => ({ ...prev, all: false }));
    }
  };

  // Delete a chat message
  const handleDeleteMessage = async (msgId: string) => {
    if (!confirm("Are you sure you want to delete this message?")) return;

    setActionLoading((prev) => ({ ...prev, [msgId]: true }));
    try {
      const { error } = await supabase.from("messages").delete().eq("id", msgId);
      if (error) {
        showAlert(`Failed to delete message: ${error.message}`, "error");
      } else {
        setMessages((prev) => prev.filter((m) => m.id !== msgId));
        showAlert("Message deleted from chat.", "success");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showAlert(`An error occurred: ${msg}`, "error");
    } finally {
      setActionLoading((prev) => ({ ...prev, [msgId]: false }));
    }
  };

  // Filtered profiles
  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        (p.email && p.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (filterStatus === "pending") return !p.is_approved;
      if (filterStatus === "approved") return !!p.is_approved;
      if (filterStatus === "admin") return !!p.is_admin;
      return true;
    });
  }, [profiles, searchQuery, filterStatus]);

  const pendingCount = useMemo(() => profiles.filter((p) => !p.is_approved).length, [profiles]);
  const approvedCount = useMemo(() => profiles.filter((p) => p.is_approved).length, [profiles]);

  // Loading state
  if (authLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-400 text-sm">Authenticating Admin Access...</p>
      </div>
    );
  }

  // Not authorized
  if (!isAdmin) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-gray-900 border border-red-900/60 rounded-2xl p-8 max-w-md w-full shadow-2xl shadow-red-950/40">
          <div className="w-16 h-16 bg-red-950/60 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-800 text-2xl font-bold">
            !
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Restricted Access</h1>
          <p className="text-gray-400 text-sm mb-6">
            The Admin Dashboard is only accessible to designated Tw1sT administrators.
            {user ? (
              <span className="block mt-2 text-xs text-gray-500">
                Logged in as: <strong className="text-gray-300">{user.email}</strong>
              </span>
            ) : (
              <span className="block mt-2 text-xs text-gray-500">You are currently not signed in.</span>
            )}
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/"
              className="flex-1 py-2.5 px-4 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-medium text-sm transition"
            >
              Return Home
            </Link>
            <Link
              href="/login"
              className="flex-1 py-2.5 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium text-sm transition"
            >
              {user ? "Switch Account" : "Sign In"}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const sqlSetupScript = `-- Run this in your Supabase SQL Editor to enable full Admin permissions & auto-profile creation:

-- 1. Ensure profiles table structure
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  is_approved boolean default false,
  is_admin boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists is_approved boolean default false;
alter table public.profiles add column if not exists is_admin boolean default false;
alter table public.profiles add column if not exists created_at timestamp with time zone default timezone('utc'::text, now());

-- 2. Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.messages enable row level security;

-- 3. RLS Policies for Profiles
drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles" on public.profiles
  for select using (
    (auth.jwt() ->> 'email') in ('RowellJoshuaEndriga@gmail.com')
    or exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

drop policy if exists "Admins can update profiles" on public.profiles;
create policy "Admins can update profiles" on public.profiles
  for update using (
    (auth.jwt() ->> 'email') in ('RowellJoshuaEndriga@gmail.com')
    or exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "Admins can delete profiles" on public.profiles;
create policy "Admins can delete profiles" on public.profiles
  for delete using (
    (auth.jwt() ->> 'email') in ('RowellJoshuaEndriga@gmail.com')
    or exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- 4. Messages Policies
drop policy if exists "Anyone can read messages" on public.messages;
create policy "Anyone can read messages" on public.messages
  for select using (true);

drop policy if exists "Authenticated users can insert messages" on public.messages;
create policy "Authenticated users can insert messages" on public.messages
  for insert with check (auth.role() = 'authenticated');

drop policy if exists "Admins can delete messages" on public.messages;
create policy "Admins can delete messages" on public.messages
  for delete using (
    (auth.jwt() ->> 'email') in ('RowellJoshuaEndriga@gmail.com')
    or exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- 5. Auto-create Profile Trigger for Signups
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, is_approved, is_admin)
  values (
    new.id,
    new.email,
    case when lower(new.email) = 'rowelljoshuaendriga@gmail.com' then true else false end,
    case when lower(new.email) = 'rowelljoshuaendriga@gmail.com' then true else false end
  )
  on conflict (id) do update set
    email = excluded.email,
    is_approved = case when lower(excluded.email) = 'rowelljoshuaendriga@gmail.com' then true else public.profiles.is_approved end,
    is_admin = case when lower(excluded.email) = 'rowelljoshuaendriga@gmail.com' then true else public.profiles.is_admin end;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 6. Enable Realtime Publications
alter publication supabase_realtime add table public.profiles;
alter publication supabase_realtime add table public.messages;`;

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(sqlSetupScript);
    setCopiedSql(true);
    showAlert("SQL script copied to clipboard!", "success");
    setTimeout(() => setCopiedSql(false), 3000);
  };

  return (
    <div className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full flex flex-col">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-red-950/60 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-red-600/20 text-red-400 border border-red-600/40">
              Admin Portal
            </span>
            <span className="text-xs text-gray-500 font-mono">{user?.email}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-1">Tw1sT Command Center</h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loadingData}
            className="px-4 py-2 rounded-lg bg-gray-900 border border-gray-800 hover:border-gray-700 text-gray-300 text-sm font-medium transition flex items-center gap-2 active:scale-95 disabled:opacity-50"
          >
            <span className={`inline-block ${loadingData ? "animate-spin" : ""}`}>↻</span>
            Refresh
          </button>
          <Link
            href="/more"
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition active:scale-95"
          >
            Exit to Hub
          </Link>
        </div>
      </div>

      {/* Alert Notice */}
      {alertNotice && (
        <div
          className={`mb-6 p-4 rounded-xl border flex items-center justify-between text-sm transition-all ${
            alertNotice.type === "success"
              ? "bg-green-950/40 border-green-800 text-green-300"
              : alertNotice.type === "error"
              ? "bg-red-950/50 border-red-800 text-red-300"
              : "bg-blue-950/40 border-blue-800 text-blue-300"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="font-bold">
              {alertNotice.type === "success" ? "✓" : alertNotice.type === "error" ? "⚠" : "ℹ"}
            </span>
            <span>{alertNotice.text}</span>
          </div>
          <button
            onClick={() => setAlertNotice(null)}
            className="text-gray-400 hover:text-white text-xs uppercase font-mono ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 mb-6">
        <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4 flex flex-col justify-between">
          <span className="text-xs text-gray-400 font-medium">Total Registered</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-bold text-white">{profiles.length}</span>
            <span className="text-xs text-gray-500">accounts</span>
          </div>
        </div>

        <div
          className={`border rounded-xl p-4 flex flex-col justify-between transition-all ${
            pendingCount > 0
              ? "bg-yellow-950/30 border-yellow-700/60 shadow-lg shadow-yellow-950/20"
              : "bg-gray-900/80 border-gray-800"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-yellow-500 font-medium">Pending Approvals</span>
            {pendingCount > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 animate-pulse" />
            )}
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-bold text-yellow-400">{pendingCount}</span>
            <span className="text-xs text-yellow-600 font-medium">waiting</span>
          </div>
        </div>

        <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4 flex flex-col justify-between">
          <span className="text-xs text-green-500 font-medium">Approved Members</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-bold text-green-400">{approvedCount}</span>
            <span className="text-xs text-gray-500">active</span>
          </div>
        </div>

        <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4 flex flex-col justify-between">
          <span className="text-xs text-red-400 font-medium">Chat Messages</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-bold text-red-500">{messages.length}</span>
            <span className="text-xs text-gray-500">recent</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-gray-800 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab("pending")}
          className={`px-4 py-2.5 text-sm font-bold border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === "pending"
              ? "border-red-600 text-red-500"
              : "border-transparent text-gray-400 hover:text-gray-200"
          }`}
        >
          <span>Pending Applications</span>
          {pendingCount > 0 && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-500 text-black font-bold">
              {pendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2.5 text-sm font-bold border-b-2 transition whitespace-nowrap ${
            activeTab === "all"
              ? "border-red-600 text-red-500"
              : "border-transparent text-gray-400 hover:text-gray-200"
          }`}
        >
          All Users Directory ({profiles.length})
        </button>

        <button
          onClick={() => setActiveTab("chat")}
          className={`px-4 py-2.5 text-sm font-bold border-b-2 transition whitespace-nowrap ${
            activeTab === "chat"
              ? "border-red-600 text-red-500"
              : "border-transparent text-gray-400 hover:text-gray-200"
          }`}
        >
          Chat Moderation ({messages.length})
        </button>

        <button
          onClick={() => setActiveTab("setup")}
          className={`px-4 py-2.5 text-sm font-bold border-b-2 transition whitespace-nowrap ${
            activeTab === "setup"
              ? "border-red-600 text-red-500"
              : "border-transparent text-gray-400 hover:text-gray-200"
          }`}
        >
          Database Setup / SQL
        </button>
      </div>

      {/* Tab 1: Pending Applications */}
      {activeTab === "pending" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-900/50 p-4 rounded-xl border border-gray-800">
            <div>
              <h2 className="text-lg font-bold text-white">Pending Approval Queue</h2>
              <p className="text-xs text-gray-400">
                Users who registered via "Apply for Account" and are waiting to access the hub.
              </p>
            </div>
            {pendingCount > 0 && (
              <button
                onClick={handleApproveAllPending}
                disabled={actionLoading.all}
                className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold text-xs transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1"
              >
                {actionLoading.all ? "Approving All..." : `Approve All (${pendingCount})`}
              </button>
            )}
          </div>

          {pendingCount === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-green-950/50 border border-green-800/80 flex items-center justify-center text-green-400 text-2xl font-bold mb-3">
                ✓
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Queue is Clear!</h3>
              <p className="text-sm text-gray-400 max-w-sm">
                There are currently no accounts waiting for approval. New applications will appear here in real time.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profiles
                .filter((p) => !p.is_approved)
                .map((prof) => (
                  <div
                    key={prof.id}
                    className="bg-gray-900 border border-yellow-800/40 rounded-xl p-5 shadow-lg flex flex-col justify-between gap-4 transition hover:border-yellow-700"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-yellow-950 text-yellow-400 border border-yellow-700/60 uppercase">
                          Pending Review
                        </span>
                        <span className="text-[11px] text-gray-500 font-mono">
                          {prof.created_at ? new Date(prof.created_at).toLocaleDateString() : "Recent"}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-white break-all mb-1">
                        {prof.email || "No Email Provided"}
                      </h4>
                      <p className="text-xs text-gray-500 font-mono truncate">
                        ID: {prof.id}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-gray-800">
                      <button
                        onClick={() => handleSetApproval(prof.id, true)}
                        disabled={actionLoading[prof.id]}
                        className="flex-1 py-2 px-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold text-xs transition active:scale-95 disabled:opacity-50 text-center"
                      >
                        {actionLoading[prof.id] ? "Processing..." : "✓ Approve Access"}
                      </button>
                      <button
                        onClick={() => handleDeleteProfile(prof.id, prof.email)}
                        disabled={actionLoading[prof.id]}
                        className="py-2 px-3 rounded-lg border border-red-800/80 hover:bg-red-950/40 text-red-400 font-medium text-xs transition active:scale-95 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: All Users Directory */}
      {activeTab === "all" && (
        <div className="space-y-4">
          {/* Filter and Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Search by email or user ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 p-3 rounded-xl bg-gray-900 border border-gray-800 text-white focus:border-red-500 outline-none text-sm transition"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="p-3 rounded-xl bg-gray-900 border border-gray-800 text-white focus:border-red-500 outline-none text-sm cursor-pointer"
            >
              <option value="all">All Statuses ({profiles.length})</option>
              <option value="pending">Pending Only ({pendingCount})</option>
              <option value="approved">Approved Only ({approvedCount})</option>
              <option value="admin">Admins</option>
            </select>
          </div>

          {filteredProfiles.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center text-gray-400 text-sm">
              No users found matching your search criteria.
            </div>
          ) : (
            <div className="overflow-x-auto bg-gray-900 rounded-xl border border-gray-800 shadow-md">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase bg-black/40">
                    <th className="p-3.5 pl-4">User</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Role</th>
                    <th className="p-3.5">Registered</th>
                    <th className="p-3.5 pr-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {filteredProfiles.map((prof) => (
                    <tr key={prof.id} className="hover:bg-gray-800/40 transition">
                      <td className="p-3.5 pl-4">
                        <div className="font-medium text-white break-all">
                          {prof.email || "No email"}
                        </div>
                        <div className="text-xs text-gray-500 font-mono truncate max-w-xs">
                          {prof.id}
                        </div>
                      </td>
                      <td className="p-3.5">
                        {prof.is_approved ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-950 text-green-400 border border-green-800">
                            Approved
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-yellow-950 text-yellow-400 border border-yellow-800">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="p-3.5">
                        {prof.is_admin ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-950 text-red-400 border border-red-800">
                            Admin
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500">Member</span>
                        )}
                      </td>
                      <td className="p-3.5 text-xs text-gray-400 font-mono whitespace-nowrap">
                        {prof.created_at ? new Date(prof.created_at).toLocaleDateString() : "Unknown"}
                      </td>
                      <td className="p-3.5 pr-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {prof.is_approved ? (
                            <button
                              onClick={() => handleSetApproval(prof.id, false)}
                              disabled={actionLoading[prof.id]}
                              className="px-2.5 py-1 rounded text-xs font-medium border border-yellow-700/60 text-yellow-400 hover:bg-yellow-950/40 transition active:scale-95 disabled:opacity-50"
                            >
                              Revoke
                            </button>
                          ) : (
                            <button
                              onClick={() => handleSetApproval(prof.id, true)}
                              disabled={actionLoading[prof.id]}
                              className="px-2.5 py-1 rounded text-xs font-bold bg-green-600 hover:bg-green-700 text-white transition active:scale-95 disabled:opacity-50"
                            >
                              Approve
                            </button>
                          )}

                          <button
                            onClick={() => handleToggleAdmin(prof.id, prof.is_admin)}
                            disabled={actionLoading[prof.id]}
                            className={`px-2 py-1 rounded text-xs font-medium border transition active:scale-95 disabled:opacity-50 ${
                              prof.is_admin
                                ? "border-gray-700 text-gray-400 hover:text-white"
                                : "border-red-900/60 text-red-400 hover:bg-red-950/40"
                            }`}
                            title={prof.is_admin ? "Remove Admin Role" : "Make Admin"}
                          >
                            {prof.is_admin ? "Demote" : "Make Admin"}
                          </button>

                          <button
                            onClick={() => handleDeleteProfile(prof.id, prof.email)}
                            disabled={actionLoading[prof.id]}
                            className="px-2 py-1 rounded text-xs font-medium text-gray-500 hover:text-red-400 hover:bg-red-950/30 transition"
                            title="Delete Profile"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Chat Moderation */}
      {activeTab === "chat" && (
        <div className="space-y-4">
          <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Live Chat Moderation</h2>
              <p className="text-xs text-gray-400">
                View real-time chat messages and purge spam or inappropriate messages.
              </p>
            </div>
            <Link
              href="/messages"
              className="text-xs font-bold text-red-500 hover:underline"
            >
              Open Chat Room ?
            </Link>
          </div>

          {messages.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center text-gray-400 text-sm">
              No chat messages found.
            </div>
          ) : (
            <div className="space-y-2">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl p-3 flex items-start justify-between gap-4 transition"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-red-400 truncate">
                        {msg.sender_email}
                      </span>
                      <span className="text-[10px] text-gray-500 font-mono">
                        {msg.created_at ? new Date(msg.created_at).toLocaleTimeString() : ""}
                      </span>
                    </div>
                    <p className="text-sm text-gray-200 break-words">{msg.text}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteMessage(msg.id)}
                    disabled={actionLoading[msg.id]}
                    className="p-1.5 px-2.5 rounded bg-red-950/60 border border-red-800 hover:bg-red-900/60 text-red-300 text-xs font-medium transition active:scale-95 disabled:opacity-50"
                  >
                    {actionLoading[msg.id] ? "..." : "Delete"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Database Setup / SQL */}
      {activeTab === "setup" && (
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Supabase Schema & Security Setup</h3>
                <p className="text-xs text-gray-400 mt-1">
                  Run this query in your <strong>Supabase Dashboard → SQL Editor</strong> to ensure tables, RLS policies, and triggers are configured.
                </p>
              </div>
              <button
                onClick={copySqlToClipboard}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition active:scale-95 flex items-center justify-center gap-2"
              >
                <span>{copiedSql ? "✓" : "📋"}</span>
                {copiedSql ? "Copied!" : "Copy SQL Script"}
              </button>
            </div>

            <pre className="bg-black border border-gray-800 rounded-xl p-4 text-xs font-mono text-gray-300 overflow-x-auto max-h-[450px]">
              {sqlSetupScript}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
