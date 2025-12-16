import { useState, useEffect } from "react";
import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AppProvider } from "@/context/AppContext";
import { Sidebar } from "@/components/Sidebar";
import Scanner from "@/pages/Scanner";
import Tasks from "@/pages/Tasks";
import Settings from "@/pages/Settings";
import Login from "@/pages/Login";
import NotificationPopup from "@/pages/NotificationPopup";
import { invoke } from "@tauri-apps/api/core";
import { isPermissionGranted, requestPermission } from "@tauri-apps/plugin-notification";

// MainLayout
function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full bg-black text-white font-sans antialiased selection:bg-zinc-800 selection:text-white">
      <Sidebar />
      <main className="flex-1 h-screen overflow-y-auto bg-black">
        <div className="container mx-auto p-6 max-w-5xl">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    async function setupApp() {
      try {
        await invoke("init");
        console.log("✅ Database initialized");

        //Windows Notification Permission
        let permissionGranted = await isPermissionGranted();
        if (!permissionGranted) {
          const permission = await requestPermission();
          permissionGranted = permission === "granted";
        }
        console.log("🔔 Notification permission:", permissionGranted ? "granted" : "denied");

      } catch (e) {
        console.error("❌ Setup Failed:", e);
      }

      const creds = localStorage.getItem("kairos_creds");
      setIsAuthenticated(!!creds);
      
      setIsReady(true);
    }

    setupApp();
  }, []);

  if (!isReady) {
    return <div className="h-screen w-full bg-black flex items-center justify-center text-zinc-500">Initializing...</div>;
  }

  return (
    <AppProvider>
      {/* Notification Toast*/}
      <Toaster position="bottom-right" theme="dark" richColors />

      <Router>
        <Routes>
          <Route path="/notification" element={<NotificationPopup />} />

          <Route path="/login" element={
            !isAuthenticated ? <Login /> : <Navigate to="/" />
          } />

          <Route path="/" element={
            isAuthenticated ? <MainLayout><Scanner /></MainLayout> : <Navigate to="/login" />
          } />

          <Route path="/tasks" element={
            isAuthenticated ? <MainLayout><Tasks /></MainLayout> : <Navigate to="/login" />
          } />

          <Route path="/settings" element={
            isAuthenticated ? <MainLayout><Settings /></MainLayout> : <Navigate to="/login" />
          } />
        </Routes>
      </Router>
    </AppProvider>
  );
}