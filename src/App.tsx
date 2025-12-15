import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import Scanner from "./pages/Scanner";
import Tasks from "./pages/Tasks";
import Login from "./pages/Login";
import { AppProvider } from "./context/AppContext";
import { Toaster } from "sonner";
import Settings from "./pages/Settings";

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

function App() {
  const isAuthenticated = !!localStorage.getItem("kairos_creds");

  return (
    <AppProvider>
      <Toaster position="bottom-right" theme="dark" richColors />

      <Router>
        <Routes>
          <Route path="/login" element={
            isAuthenticated ? <Navigate to="/" /> : <Login />
          } />

          <Route path="/settings" element={
            isAuthenticated ? <MainLayout><Settings /></MainLayout> : <Navigate to="/login" />
          } />

          <Route path="/" element={
            isAuthenticated ? <MainLayout><Scanner /></MainLayout> : <Navigate to="/login" />
          } />

          <Route path="/tasks" element={
            isAuthenticated ? <MainLayout><Tasks /></MainLayout> : <Navigate to="/login" />
          } />

          <Route path="/settings" element={
            isAuthenticated ? <MainLayout><div className="p-10 text-zinc-500">Settings Page</div></MainLayout> : <Navigate to="/login" />
          } />
        </Routes>
      </Router>
    </AppProvider>
  );
}

export default App;