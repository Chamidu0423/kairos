import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [server, setServer] = useState("imap.gmail.com");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    setStatus("Connecting...");
    try {
      const response = await invoke("test_imap_connection", {
        email,
        password,
        server,
      });
      setStatus("✅ " + response);
    } catch (error) {
      setStatus("❌ Error: " + error);
    }
    setLoading(false);
  }

  return (
    <div className="h-screen w-full bg-black text-white flex items-center justify-center p-4">
      <Card className="w-[400px] bg-zinc-900 border-zinc-800 text-zinc-100">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">Kairos Login</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-zinc-400">IMAP Server</label>
            <Input 
              value={server} 
              onChange={(e) => setServer(e.target.value)} 
              className="bg-zinc-800 border-zinc-700 text-white" 
            />
            <p className="text-xs text-zinc-500">Gmail: imap.gmail.com | Outlook: outlook.office365.com</p>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm text-zinc-400">Email</label>
            <Input 
              placeholder="student@uni.ac.lk" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="bg-zinc-800 border-zinc-700 text-white" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-zinc-400">App Password</label>
            <Input 
              type="password" 
              placeholder="xxxx xxxx xxxx xxxx" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="bg-zinc-800 border-zinc-700 text-white" 
            />
          </div>

          <Button 
            onClick={handleLogin} 
            disabled={loading}
            className="w-full bg-white text-black hover:bg-gray-200"
          >
            {loading ? "Connecting..." : "Connect Email"}
          </Button>

          {status && (
            <div className={`p-3 rounded text-sm ${status.startsWith("❌") ? "bg-red-900/50 text-red-200" : "bg-green-900/50 text-green-200"}`}>
              {status}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default App;