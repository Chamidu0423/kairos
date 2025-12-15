import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Key, Save, LogOut, Database, Server } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function Settings() {
  const navigate = useNavigate();
  const [apiKey, setApiKey] = useState("");
  const [creds, setCreds] = useState<{email: string, server: string} | null>(null);

  useEffect(() => {
    const savedKey = localStorage.getItem("openrouter_api_key");
    if (savedKey) setApiKey(savedKey);

    const savedCreds = localStorage.getItem("kairos_creds");
    if (savedCreds) setCreds(JSON.parse(savedCreds));
  }, []);

  function handleSaveKey() {
    if (!apiKey.trim()) {
      toast.error("Please enter a valid API Key");
      return;
    }
    localStorage.setItem("openrouter_api_key", apiKey);
    toast.success("API Key saved successfully!");
  }

  function handleLogout() {
    localStorage.removeItem("kairos_creds");
    navigate("/login");
    window.location.reload();
  }

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Settings</h1>
        <p className="text-zinc-400 mt-1">Manage your AI configuration and account preferences.</p>
      </div>

      {/*AI Configuration Section */}
      <Card className="bg-zinc-900/50 border-zinc-800 text-zinc-100">
        <CardHeader>
          <div className="flex items-center gap-2 mb-1">
            <Key className="w-5 h-5 text-purple-400" />
            <CardTitle className="text-lg">AI Configuration</CardTitle>
          </div>
          <CardDescription className="text-zinc-400">
            Configure the AI model used to analyze your emails.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="apikey" className="text-zinc-300">OpenRouter API Key</Label>
            <div className="flex gap-2">
              <Input 
                id="apikey" 
                type="password" 
                placeholder="sk-or-v1-..." 
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="bg-black/50 border-zinc-700 text-white font-mono"
              />
              <Button onClick={handleSaveKey} className="bg-purple-600 hover:bg-purple-700 text-white">
                <Save className="w-4 h-4 mr-2" /> Save
              </Button>
            </div>
            <p className="text-xs text-zinc-500">
              Your key is stored locally on your device. We never share it.
            </p>
          </div>
        </CardContent>
      </Card>

      {/*Account Section */}
      <Card className="bg-zinc-900/50 border-zinc-800 text-zinc-100">
        <CardHeader>
          <div className="flex items-center gap-2 mb-1">
            <Server className="w-5 h-5 text-blue-400" />
            <CardTitle className="text-lg">Account Connection</CardTitle>
          </div>
          <CardDescription className="text-zinc-400">
            Details about your connected university email.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-black/40 border border-zinc-800 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-zinc-300">Connected Email</p>
              <p className="text-lg font-mono text-white">{creds?.email || "Not connected"}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-zinc-300">IMAP Server</p>
              <p className="text-sm font-mono text-zinc-400">{creds?.server}</p>
            </div>
          </div>

          <Button variant="destructive" onClick={handleLogout} className="w-full sm:w-auto">
            <LogOut className="w-4 h-4 mr-2" /> Disconnect & Log out
          </Button>
        </CardContent>
      </Card>

      {/*Data Section */}
      <Card className="bg-zinc-900/50 border-zinc-800 text-zinc-100">
        <CardHeader>
          <div className="flex items-center gap-2 mb-1">
            <Database className="w-5 h-5 text-green-400" />
            <CardTitle className="text-lg">Data Storage</CardTitle>
          </div>
          <CardDescription className="text-zinc-400">
            Information about where your data is saved.
          </CardDescription>
        </CardHeader>
        <CardContent>
             <p className="text-sm text-zinc-500">
                All your tasks and settings are stored locally in your system's AppData folder. 
                Connecting directly to the database file is not recommended while the app is running.
             </p>
        </CardContent>
      </Card>
    </div>
  );
}