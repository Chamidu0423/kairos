import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { LogIn, Server, Lock, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { invoke } from "@tauri-apps/api/core";

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [server, setServer] = useState("imap.gmail.com");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    if(!email || !password || !server) {
        toast.error("Please fill in all fields");
        setLoading(false);
        return;
    }

    try {
        // Connection Test
        await invoke("test_imap_connection", { email, password, server });
        
        // Save to LocalStorage
        localStorage.setItem("kairos_creds", JSON.stringify({ email, password, server }));
        
        await invoke("save_app_setting", { key: "email", value: email });
        await invoke("save_app_setting", { key: "password", value: password });
        await invoke("save_app_setting", { key: "server", value: server });

        toast.success("Login successful! Background monitor started.");
        
        navigate("/");
        window.location.reload();

    } catch (error) {
        console.error(error);
        toast.error("Connection failed! Check your credentials.");
    } finally {
        setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-800 via-black to-black opacity-40 z-0"></div>
      
      <Card className="w-full max-w-md bg-zinc-900/80 border-zinc-800 relative z-10 backdrop-blur-sm">
        <CardHeader className="text-center space-y-2">
          <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mx-auto mb-2">
            <LogIn className="text-black w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-white">Welcome back</CardTitle>
          <CardDescription className="text-zinc-400">
            Enter your university IMAP credentials to connect.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
                <Label className="text-zinc-300">Email Address</Label>
                <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                    <Input 
                        placeholder="s220000@ousl.lk" 
                        className="pl-9 bg-black/50 border-zinc-700 text-white"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
            </div>
            
            <div className="space-y-2">
                <Label className="text-zinc-300">App Password</Label>
                <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                    <Input 
                        type="password" 
                        placeholder="xxxx xxxx xxxx xxxx" 
                        className="pl-9 bg-black/50 border-zinc-700 text-white"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                <p className="text-[10px] text-zinc-500">Use a generated App Password, not your login password.</p>
            </div>

            <div className="space-y-2">
                <Label className="text-zinc-300">IMAP Server</Label>
                <div className="relative">
                    <Server className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                    <Input 
                        placeholder="imap.gmail.com" 
                        className="pl-9 bg-black/50 border-zinc-700 text-white"
                        value={server}
                        onChange={(e) => setServer(e.target.value)}
                    />
                </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-white text-black hover:bg-zinc-200 mt-2">
                {loading ? "Connecting..." : "Connect Account"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}