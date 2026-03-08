import { Home, ListTodo, Settings, LogOut } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const menuItems = [
    { name: "Dashboard", icon: Home, path: "/" },
    { name: "My Tasks", icon: ListTodo, path: "/tasks" },
    { name: "Settings", icon: Settings, path: "/settings" },
  ];

  function handleLogout() {
    localStorage.removeItem("kairos_creds");
    navigate("/login");
    window.location.reload();
  }

  return (
    <div className="w-64 h-screen bg-zinc-950 border-r border-zinc-800 flex flex-col p-4">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8 px-2">
        <img src="/icons/32x32.png" alt="Kairos" className="w-8 h-8 rounded-lg" />
        <span className="text-xl font-bold text-white tracking-tight">Kairos</span>
      </div>

      <nav className="space-y-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path} className={`flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 group ${isActive ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:bg-zinc-900 hover:text-white"}`}>
              <item.icon size={20} className={isActive ? "text-white" : "text-zinc-500 group-hover:text-white"} />
              <span className="text-sm font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-4 border-t border-zinc-900 space-y-4">
        {/* Logout Button */}
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 text-zinc-400 hover:text-red-400 hover:bg-red-950/30 rounded-md transition-colors">
            <LogOut size={20} />
            <span className="text-sm font-medium">Log out</span>
        </button>

        <div className="flex items-center gap-3 px-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-xs text-zinc-500">System Online</span>
        </div>
      </div>
    </div>
  );
}