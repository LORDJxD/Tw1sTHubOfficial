"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/utils/supabase";

type Message = {
  id: string;
  text: string;
  sender_email: string;
  created_at: string;
};

export default function MessagesPage() {
  const { isLoggedIn, isApproved, user, loading } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoggedIn || !isApproved) return;

    // Fetch existing messages
    const fetchMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(50);
      
      if (data) setMessages(data);
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel("public:messages")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        setMessages((current) => [...current, payload.new as Message]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isLoggedIn, isApproved]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (loading) return <div className="flex-1 flex items-center justify-center">Loading...</div>;
  if (!isLoggedIn || !isApproved) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;

    const msg = input.trim();
    setInput("");

    // Insert into Supabase
    await supabase.from("messages").insert([
      { text: msg, sender_email: user.email }
    ]);
  };

  return (
    <div className="flex-1 flex flex-col p-4 max-w-3xl mx-auto w-full h-[calc(100vh-140px)]">
      <h2 className="text-xl md:text-2xl font-bold mb-4 text-red-500 border-b border-red-900 pb-2">Community Chat</h2>
      
      <div className="flex-1 overflow-y-auto bg-gray-900 rounded-xl border border-gray-800 p-4 mb-4 flex flex-col space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className={`p-3 rounded-lg max-w-[80%] ${msg.sender_email === user?.email ? "bg-red-900/40 text-red-100 self-end" : "bg-gray-800 text-gray-200 self-start"}`}>
            <span className="text-[10px] text-gray-400 block mb-1">{msg.sender_email}</span>
            <p className="text-sm">{msg.text}</p>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 p-3 rounded-xl bg-black border border-gray-700 focus:border-red-500 outline-none text-white transition"
        />
        <button 
          type="submit"
          className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition active:scale-95"
        >
          Send
        </button>
      </form>
    </div>
  );
}
