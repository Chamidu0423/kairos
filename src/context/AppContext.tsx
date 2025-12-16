import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { toast } from "sonner";
import { CheckCircle, Mail } from "lucide-react";

interface Email { id: number; subject: string; from: string; date: string; body: string; }
interface Task { id: number; title: string; due_date: string | null; is_completed: boolean; }

interface CustomNotification {
  type: string;
  title: string;
  body: string;
}

//Custom Notification Toast
function showCustomNotification(notif: CustomNotification) {
  const duration = parseInt(localStorage.getItem("notification_duration") || "10") * 1000;
  
  toast.custom(
    (t) => (
      <div className="w-[360px] bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl overflow-hidden animate-in slide-in-from-right">
        {/* Header */}
        <div className={`px-4 py-2 flex items-center justify-between ${
          notif.type === "task" ? "bg-green-900/50" : "bg-blue-900/50"
        }`}>
          <div className="flex items-center gap-2">
            {notif.type === "task" ? (
              <CheckCircle className="w-4 h-4 text-green-400" />
            ) : (
              <Mail className="w-4 h-4 text-blue-400" />
            )}
            <span className="text-xs font-medium text-zinc-300 uppercase tracking-wider">
              {notif.type === "task" ? "Task Created" : "New Email"}
            </span>
          </div>
          <button 
            onClick={() => toast.dismiss(t)}
            className="text-zinc-500 hover:text-white transition-colors text-lg leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-white text-base mb-1">{notif.title}</h3>
          <p className="text-sm text-zinc-400 whitespace-pre-line">{notif.body}</p>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-black/30 border-t border-zinc-800 flex items-center justify-between">
          <span className="text-[10px] text-zinc-600 font-medium">KAIROS</span>
          <button 
            onClick={() => toast.dismiss(t)}
            className="text-xs text-zinc-500 hover:text-white transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    ),
    { 
      duration: duration === 0 ? Infinity : duration,
      position: "bottom-right"
    }
  );
}

interface AppContextType {
  emails: Email[];
  tasks: Task[];
  loadingEmails: boolean;
  loadingTasks: boolean;
  refreshEmails: () => void;
  refreshTasks: () => void;
  setEmails: React.Dispatch<React.SetStateAction<Email[]>>; 
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [emails, setEmails] = useState<Email[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingEmails, setLoadingEmails] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);

  async function refreshTasks() {
    setLoadingTasks(true);
    try {
      const data = await invoke<Task[]>("get_all_tasks");
      setTasks(data);
    } catch (error) {
      console.error("Failed to load tasks:", error);
    }
    setLoadingTasks(false);
  }

  async function refreshEmails() {
    const credsString = localStorage.getItem("kairos_creds");
    if (!credsString) return;

    const creds = JSON.parse(credsString);
    setLoadingEmails(true);
    try {
      const data = await invoke<Email[]>("fetch_recent_emails", {
        email: creds.email,
        password: creds.password,
        server: creds.server,
      });
      setEmails(data);
    } catch (error) {
      console.error("Failed to scan emails:", error);
    }
    setLoadingEmails(false);
  }

  useEffect(() => {
    refreshTasks();

    const unlistenEmails = listen<Email[]>("emails-updated", (event) => {
      console.log("📬 Emails updated from background monitor");
      setEmails(event.payload);
    });

    const unlistenTasks = listen("task-created", () => {
      console.log("✅ Task created from background monitor");
      refreshTasks();
    });

    const unlistenNotification = listen<CustomNotification>("show-notification", (event) => {
      console.log("🔔 Custom notification received");
      const style = localStorage.getItem("notification_style") || "custom";
      if (style === "custom") {
        showCustomNotification(event.payload);
      }
      // Windows notification is handle by backend
    });

    return () => {
      unlistenEmails.then(fn => fn());
      unlistenTasks.then(fn => fn());
      unlistenNotification.then(fn => fn());
    };
  }, []);

  return (
    <AppContext.Provider value={{ 
      emails, 
      tasks, 
      loadingEmails, 
      loadingTasks, 
      refreshEmails, 
      refreshTasks,
      setEmails 
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}