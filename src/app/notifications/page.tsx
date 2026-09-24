"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";

type Notification = {
  id: number;
  title: string;
  date: string;
  content: string;
  image?: string | null;
};

const INITIAL_NOTIFICATIONS: Notification[] = [
  { id: 1, title: "Server Maintenance Tonight", date: "2025-12-22T18:30:00", content: "We will perform server maintenance tonight from 8 PM to 11 PM. Please save your work." },
  { id: 2, title: "New Feature: Dark Mode", date: "2025-12-21T09:15:00", content: "Dark mode is now available on all devices. Go to your profile settings to enable it." },
  { id: 3, title: "Weekly Update", date: "2025-12-20T14:45:00", content: "Here's your weekly update summary. Check out the highlights and new announcements." },
  { id: 4, title: "Holiday Notice", date: "2025-12-19T08:00:00", content: "Our offices will be closed for the holidays from Dec 24 to Jan 2.", image: "/res/logo.png" },
];

export default function NotificationsPage() {
  const { isLoggedIn } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  
  const [selectedNotif, setSelectedNotif] = useState<Notification | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newImage, setNewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setNewImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleCreate = () => {
    if (!newTitle || !newContent) return;
    
    const newNotif: Notification = {
      id: Date.now(),
      title: newTitle,
      content: newContent,
      date: new Date().toISOString(),
      image: newImage
    };
    
    setNotifications([newNotif, ...notifications]);
    setIsCreating(false);
    setNewTitle("");
    setNewContent("");
    setNewImage(null);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this post?")) {
      setNotifications(notifications.filter(n => n.id !== id));
      setSelectedNotif(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.toLocaleDateString()} | ${d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  };

  return (
    <div className="flex-1 p-4 relative pb-20">
      <h2 className="text-2xl font-bold mb-4 text-red-500 border-b border-red-900 pb-2">Notifications</h2>
      
      <div className="space-y-3">
        {notifications.map(n => (
          <div 
            key={n.id} 
            onClick={() => setSelectedNotif(n)}
            className="bg-gray-900 border border-gray-800 p-4 rounded-xl shadow-md cursor-pointer hover:bg-gray-800 transition active:scale-[0.98]"
          >
            <h3 className="text-lg font-semibold text-white">{n.title}</h3>
            <p className="text-sm text-gray-500">{formatDate(n.date)}</p>
          </div>
        ))}
      </div>

      {/* Floating Action Button */}
      {isLoggedIn && (
        <button 
          onClick={() => setIsCreating(true)}
          className="fixed bottom-[80px] right-6 w-14 h-14 bg-red-600 text-white rounded-full text-3xl shadow-lg flex items-center justify-center hover:bg-red-700 active:scale-95 transition-all z-40"
        >
          +
        </button>
      )}

      {/* View Modal */}
      {selectedNotif && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 backdrop-blur-sm" onClick={() => setSelectedNotif(null)}>
          <div className="bg-gray-900 border border-gray-700 w-full max-w-md rounded-2xl p-6 relative shadow-xl" onClick={e => e.stopPropagation()}>
            <button className="absolute top-4 right-4 text-gray-400 hover:text-white" onClick={() => setSelectedNotif(null)}>✕</button>
            <h2 className="text-xl font-bold mb-1 pr-6">{selectedNotif.title}</h2>
            <p className="text-xs text-gray-500 mb-4">{formatDate(selectedNotif.date)}</p>
            <p className="text-gray-300 mb-4 whitespace-pre-wrap">{selectedNotif.content}</p>
            {selectedNotif.image && (
              <div className="relative w-full h-48 mb-4">
                <Image src={selectedNotif.image} alt="Attached" fill className="object-cover rounded-lg" />
              </div>
            )}
            {isLoggedIn && (
              <button 
                onClick={() => handleDelete(selectedNotif.id)}
                className="w-full p-2 mt-4 bg-red-600/20 text-red-500 border border-red-600/50 rounded-lg hover:bg-red-600 hover:text-white transition"
              >
                Delete Post
              </button>
            )}
          </div>
        </div>
      )}

      {/* Create Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 backdrop-blur-sm" onClick={() => setIsCreating(false)}>
          <div className="bg-gray-900 border border-gray-700 w-full max-w-md rounded-2xl p-6 relative shadow-xl" onClick={e => e.stopPropagation()}>
            <button className="absolute top-4 right-4 text-gray-400 hover:text-white" onClick={() => setIsCreating(false)}>✕</button>
            <h2 className="text-xl font-bold mb-4 text-red-500">Create Post</h2>
            
            <input 
              type="text" 
              placeholder="Title" 
              value={newTitle} 
              onChange={e => setNewTitle(e.target.value)}
              className="w-full p-3 bg-black border border-gray-700 rounded-lg mb-3 text-white focus:border-red-500 outline-none"
            />
            <textarea 
              placeholder="Content" 
              rows={4}
              value={newContent} 
              onChange={e => setNewContent(e.target.value)}
              className="w-full p-3 bg-black border border-gray-700 rounded-lg mb-3 text-white focus:border-red-500 outline-none"
            />
            <input 
              type="file" 
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageUpload}
              className="w-full mb-4 text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-800 file:text-white hover:file:bg-gray-700"
            />
            
            <button 
              onClick={handleCreate}
              className="w-full p-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition"
            >
              Submit Post
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
