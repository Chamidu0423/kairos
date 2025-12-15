import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { invoke } from "@tauri-apps/api/core";

interface Email { id: number; subject: string; from: string; date: string; body: string; }
interface Task { id: number; title: string; due_date: string | null; is_completed: boolean; }

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