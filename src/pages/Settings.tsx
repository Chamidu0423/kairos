import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Key, Save, LogOut, Database, Server, Bell } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";

export default function Settings() {
  const navigate = useNavigate();
  const [apiKey, setApiKey] = useState("");
  const [creds, setCreds] = useState<{email: string, server: string} | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notificationStyle, setNotificationStyle] = useState("custom");
  const [notificationDuration, setNotificationDuration] = useState("10");

  useEffect(() => {
    async function loadSettings() {
      const savedKey = localStorage.getItem("openrouter_api_key");
      if (savedKey) setApiKey(savedKey);

      const savedCreds = localStorage.getItem("kairos_creds");
      if (savedCreds) setCreds(JSON.parse(savedCreds));

      const savedNotifSetting = localStorage.getItem("notifications_enabled");
      if (savedNotifSetting !== null) setNotificationsEnabled(savedNotifSetting === "true");

      const savedStyle = localStorage.getItem("notification_style") || "custom";
      setNotificationStyle(savedStyle);

      // Load duration from DB
      try {
        const dbDuration = await invoke<string | null>("get_app_setting", { key: "notification_duration" });
        if (dbDuration) {
          setNotificationDuration(dbDuration);
          localStorage.setItem("notification_duration", dbDuration);
        } else {
          const savedDuration = localStorage.getItem("notification_duration") || "10";
          setNotificationDuration(savedDuration);
        }
      } catch {
        const savedDuration = localStorage.getItem("notification_duration") || "10";
        setNotificationDuration(savedDuration);
      }
    }
    loadSettings();
  }, []);

  async function handleSaveKey() {
    if (!apiKey.trim()) {
      toast.error("Please enter a valid API Key");
      return;
    }
    localStorage.setItem("openrouter_api_key", apiKey);
    await invoke("save_app_setting", { key: "api_key", value: apiKey });
    toast.success("API Key saved successfully!");
  }

  async function handleToggleNotifications() {
    const newValue = !notificationsEnabled;
    setNotificationsEnabled(newValue);
    localStorage.setItem("notifications_enabled", String(newValue));
    await invoke("save_app_setting", { key: "notifications_enabled", value: String(newValue) });
    toast.success(newValue ? "Notifications enabled" : "Notifications disabled");
  }

  async function handleStyleChange(style: string) {
    setNotificationStyle(style);
    localStorage.setItem("notification_style", style);
    await invoke("save_app_setting", { key: "notification_style", value: style });
    toast.success(style === "custom" ? "Using custom notifications" : "Using Windows notifications");
  }

  async function handleDurationChange(duration: string) {
    setNotificationDuration(duration);
    localStorage.setItem("notification_duration", duration);
    await invoke("save_app_setting", { key: "notification_duration", value: duration });
    toast.success(duration === "0" ? "Notifications stay until closed" : `Auto-dismiss: ${duration}s`);
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

      {/*Notification Section */}
      <Card className="bg-zinc-900/50 border-zinc-800 text-zinc-100">
        <CardHeader>
          <div className="flex items-center gap-2 mb-1">
            <Bell className="w-5 h-5 text-yellow-400" />
            <CardTitle className="text-lg">Notifications</CardTitle>
          </div>
          <CardDescription className="text-zinc-400">
            Control how you receive alerts for new emails and tasks.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Enable/Disable */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-black/40 border border-zinc-800">
            <div>
              <p className="text-sm font-medium text-zinc-300">Desktop Notifications</p>
              <p className="text-xs text-zinc-500">Get notified when new emails arrive or tasks are auto-created</p>
            </div>
            <Switch 
              checked={notificationsEnabled}
              onCheckedChange={handleToggleNotifications}
            />
          </div>

          {notificationsEnabled && (
            <>
              {/* Notification Style */}
              <div className="p-4 rounded-lg bg-black/40 border border-zinc-800">
                <p className="text-sm font-medium text-zinc-300 mb-3">Notification Style</p>
                <div className="flex gap-2">
                  <Button 
                    variant={notificationStyle === "custom" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleStyleChange("custom")}
                    className={notificationStyle === "custom" ? "bg-purple-600 hover:bg-purple-700" : "border-zinc-600 bg-white text-black hover:bg-zinc-200"}
                  >
                    ✨ Custom (Kairos)
                  </Button>
                  <Button 
                    variant={notificationStyle === "windows" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleStyleChange("windows")}
                    className={notificationStyle === "windows" ? "bg-blue-600 hover:bg-blue-700" : "border-zinc-600 bg-white text-black hover:bg-zinc-200"}
                  >
                    🪟 Windows Toast
                  </Button>
                </div>
                <p className="text-xs text-zinc-500 mt-2">
                  {notificationStyle === "custom" 
                    ? "Beautiful in-app notification with full control over duration" 
                    : "Standard Windows notification (duration controlled by Windows Settings)"}
                </p>
              </div>

              {notificationStyle === "custom" && (
                <div className="p-4 rounded-lg bg-black/40 border border-zinc-800">
                  <p className="text-sm font-medium text-zinc-300 mb-3">Auto-dismiss After</p>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { value: "5", label: "5s" },
                      { value: "10", label: "10s" },
                      { value: "30", label: "30s" },
                      { value: "60", label: "1 min" },
                      { value: "0", label: "Never" }
                    ].map((opt) => (
                      <Button 
                        key={opt.value}
                        variant={notificationDuration === opt.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleDurationChange(opt.value)}
                        className={notificationDuration === opt.value ? "bg-zinc-600" : "border-zinc-600 bg-white text-black hover:bg-zinc-200"}
                      >
                        {opt.label}
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-zinc-500 mt-2">
                    {notificationDuration === "0" 
                      ? "Notifications will stay until you manually dismiss them" 
                      : `Notifications will auto-hide after ${notificationDuration} seconds`}
                  </p>
                </div>
              )}

              {/* Test Button */}
              <div className="p-4 rounded-lg bg-black/40 border border-zinc-800">
                <p className="text-sm font-medium text-zinc-300 mb-3">Test Notification</p>
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => invoke("test_notification")}
                  className="border-zinc-700 hover:bg-zinc-800"
                >
                  🔔 Send Test Notification
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}