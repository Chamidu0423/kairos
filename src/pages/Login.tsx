import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Mail, Lock, Server, ArrowRight, Loader2 } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    server: "imap.gmail.com"
  });

  async function handleLogin() {
    setLoading(true);
    try {
      await invoke("test_imap_connection", {
        email: formData.email,
        password: formData.password,
        server: formData.server,
      });

      localStorage.setItem("kairos_creds", JSON.stringify(formData));

      navigate("/");
      window.location.reload();
    } catch (error) {
      alert("Login Failed: " + error);
    }
    setLoading(false);
  }

  return (
    <div className="h-screen w-full bg-black flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-800/20 via-black to-black"></div>
      
      <Card className="w-[400px] bg-zinc-900/80 border-zinc-800 text-zinc-100 backdrop-blur-xl relative z-10">
        <CardHeader className="text-center space-y-2">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-black font-bold text-2xl mx-auto mb-2">
            K
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Welcome back</CardTitle>
          <CardDescription className="text-zinc-400">
            Sign in to connect your university email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="relative">
              <Server className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
              <Input 
                value={formData.server} 
                onChange={(e) => setFormData({...formData, server: e.target.value})} 
                className="pl-9 bg-zinc-950/50 border-zinc-800 text-white" 
                placeholder="IMAP Server" 
              />
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
              <Input 
                value={formData.email} 
                onChange={(e) => setFormData({...formData, email: e.target.value})} 
                className="pl-9 bg-zinc-950/50 border-zinc-800 text-white" 
                placeholder="Student Email" 
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
              <Input 
                type="password"
                value={formData.password} 
                onChange={(e) => setFormData({...formData, password: e.target.value})} 
                className="pl-9 bg-zinc-950/50 border-zinc-800 text-white" 
                placeholder="App Password" 
              />
            </div>
          </div>

          <Button 
            onClick={handleLogin} 
            disabled={loading}
            className="w-full bg-white text-black hover:bg-gray-200 font-medium h-10"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
            {loading ? "Connecting..." : "Connect & Login"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}