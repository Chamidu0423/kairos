import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Key, Save, LogOut, Database, Server, Bell, Sparkles, Check, ExternalLink, Zap } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";

interface AiProvider {
  id: string;
  name: string;
  description: string;
  placeholder: string;
  website: string;
  free_tier: boolean;
}

const AI_PROVIDERS: AiProvider[] = [
  {
    id: "openrouter",
    name: "OpenRouter",
    description: "Access multiple AI models with one API key (Recommended)",
    placeholder: "sk-or-v1-...",
    website: "https://openrouter.ai/keys",
    free_tier: true
  },
  {
    id: "groq",
    name: "Groq",
    description: "Ultra-fast inference with Llama models",
    placeholder: "gsk_...",
    website: "https://console.groq.com/keys",
    free_tier: true
  },
  {
    id: "openai",
    name: "OpenAI",
    description: "GPT-4o and GPT-4o-mini models",
    placeholder: "sk-...",
    website: "https://platform.openai.com/api-keys",
    free_tier: false
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    description: "Cost-effective AI with strong reasoning",
    placeholder: "sk-...",
    website: "https://platform.deepseek.com/api_keys",
    free_tier: true
  },
  {
    id: "claude",
    name: "Claude (Anthropic)",
    description: "Advanced reasoning and analysis",
    placeholder: "sk-ant-...",
    website: "https://console.anthropic.com/",
    free_tier: false
  }
];

export default function Settings() {
  const navigate = useNavigate();
  const [selectedProvider, setSelectedProvider] = useState("openrouter");
  const [apiKey, setApiKey] = useState("");
  const [maskedKey, setMaskedKey] = useState(""); // Shows dots when key exists
  const [isConfigured, setIsConfigured] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // Track if user is editing
  const [configuredProviders, setConfiguredProviders] = useState<Set<string>>(new Set()); // Track which providers have keys
  const [creds, setCreds] = useState<{email: string, server: string} | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notificationStyle, setNotificationStyle] = useState("custom");
  const [notificationDuration, setNotificationDuration] = useState("10");

  // Load API key for a specific provider
  async function loadApiKeyForProvider(providerId: string) {
    try {
      const dbApiKey = await invoke<string | null>("get_app_setting", { key: `api_key_${providerId}` });
      if (dbApiKey) {
        setApiKey(dbApiKey);
        setMaskedKey("•".repeat(Math.min(dbApiKey.length, 40))); // Show dots
        setIsConfigured(true);
        setIsEditing(false);
      } else {
        setApiKey("");
        setMaskedKey("");
        setIsConfigured(false);
        setIsEditing(true);
      }
    } catch {
      setApiKey("");
      setMaskedKey("");
      setIsConfigured(false);
      setIsEditing(true);
    }
  }

  // Check which providers have saved API keys
  async function loadConfiguredProviders() {
    const configured = new Set<string>();
    for (const provider of AI_PROVIDERS) {
      try {
        const key = await invoke<string | null>("get_app_setting", { key: `api_key_${provider.id}` });
        if (key) configured.add(provider.id);
      } catch {
        // Ignore errors
      }
    }
    setConfiguredProviders(configured);
  }

  useEffect(() => {
    async function loadSettings() {
      // Load all configured providers
      await loadConfiguredProviders();
      
      // Load AI provider settings
      try {
        const dbProvider = await invoke<string | null>("get_app_setting", { key: "ai_provider" });
        const provider = dbProvider || "openrouter";
        setSelectedProvider(provider);
        
        // Load API key for this provider
        await loadApiKeyForProvider(provider);
      } catch {
        // Fallback to localStorage
        const savedProvider = localStorage.getItem("ai_provider") || "openrouter";
        setSelectedProvider(savedProvider);
        setIsEditing(true);
      }

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

  async function handleSelectProvider(providerId: string) {
    setSelectedProvider(providerId);
    setIsEditing(false);
    // Load existing API key for this provider
    await loadApiKeyForProvider(providerId);
    // Save selected provider
    await invoke("save_app_setting", { key: "ai_provider", value: providerId });
  }

  async function handleSaveAiConfig() {
    if (!apiKey.trim()) {
      toast.error("Please enter a valid API Key");
      return;
    }
    
    // Save provider-specific API key
    await invoke("save_app_setting", { key: `api_key_${selectedProvider}`, value: apiKey });
    // Also save as current active key (for backend monitor)
    await invoke("save_app_setting", { key: "api_key", value: apiKey });
    await invoke("save_app_setting", { key: "ai_provider", value: selectedProvider });
    
    // Update localStorage for backwards compatibility
    localStorage.setItem("ai_provider", selectedProvider);
    
    // Add to configured providers set
    setConfiguredProviders(prev => new Set([...prev, selectedProvider]));
    
    setMaskedKey("•".repeat(Math.min(apiKey.length, 40)));
    setIsConfigured(true);
    setIsEditing(false);
    toast.success(`${AI_PROVIDERS.find(p => p.id === selectedProvider)?.name} configured successfully!`);
  }

  function handleEditKey() {
    setIsEditing(true);
    setApiKey(""); // Clear to enter new key
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

  const currentProvider = AI_PROVIDERS.find(p => p.id === selectedProvider);

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Settings</h1>
        <p className="text-zinc-400 mt-1">Manage your AI configuration and account preferences.</p>
      </div>

      {/* AI Configuration Section */}
      <Card className="bg-zinc-900/50 border-zinc-800 text-zinc-100">
        <CardHeader>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <CardTitle className="text-lg">AI Configuration</CardTitle>
            {isConfigured && (
              <span className="ml-auto flex items-center gap-1 text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                <Check className="w-3 h-3" /> Configured
              </span>
            )}
          </div>
          <CardDescription className="text-zinc-400">
            Choose your AI provider and configure the API key to analyze emails.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Provider Selection */}
          <div>
            <Label className="text-zinc-300 mb-3 block">Select AI Provider</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {AI_PROVIDERS.map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => handleSelectProvider(provider.id)}
                  className={`p-4 rounded-lg border text-left transition-all ${
                    selectedProvider === provider.id
                      ? "border-purple-500 bg-purple-500/10"
                      : "border-zinc-700 bg-black/30 hover:border-zinc-600 hover:bg-black/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-white">{provider.name}</span>
                    <div className="flex items-center gap-2">
                      {/* Show green dot if this provider has a saved key */}
                      {configuredProviders.has(provider.id) && selectedProvider !== provider.id && (
                        <div className="w-2 h-2 rounded-full bg-green-500" title="API key configured" />
                      )}
                      {selectedProvider === provider.id && (
                        <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-zinc-500 line-clamp-2">{provider.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* API Key Input */}
          <div className="p-4 rounded-lg bg-black/40 border border-zinc-800">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-zinc-300 flex items-center gap-2">
                <Key className="w-4 h-4" />
                {currentProvider?.name} API Key
              </Label>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-purple-400 hover:text-purple-300 h-auto py-1"
                onClick={() => currentProvider && window.open(currentProvider.website, "_blank")}
              >
                Get API Key <ExternalLink className="w-3 h-3 ml-1" />
              </Button>
            </div>
            
            <div className="flex gap-2">
              {isConfigured && !isEditing ? (
                // Show masked key with Edit button
                <>
                  <div className="flex-1 bg-black/50 border border-zinc-700 rounded-md px-3 py-2 text-zinc-400 font-mono text-sm flex items-center">
                    <span>{maskedKey}</span>
                    <Check className="w-4 h-4 ml-2 text-green-500" />
                  </div>
                  <Button 
                    onClick={handleEditKey} 
                    className="bg-zinc-700 hover:bg-zinc-600 text-white border-none"
                  >
                    Edit
                  </Button>
                </>
              ) : (
                // Show input for entering/editing key
                <>
                  <Input 
                    type="password" 
                    placeholder={currentProvider?.placeholder}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="bg-black/50 border-zinc-700 text-white font-mono"
                  />
                  <Button 
                    onClick={handleSaveAiConfig} 
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Save className="w-4 h-4 mr-2" /> Save
                  </Button>
                  {isConfigured && (
                    <Button 
                      onClick={() => { setIsEditing(false); setApiKey(""); }} 
                      variant="outline"
                      className="border-zinc-700 text-white hover:bg-zinc-800"
                    >
                      Cancel
                    </Button>
                  )}
                </>
              )}
            </div>
            
            <p className="text-xs text-zinc-500 mt-2">
              Your API key is stored securely on your device. We never share it with anyone.
            </p>
          </div>

          {/* Quick Info */}
          {currentProvider && (
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <Zap className="w-3 h-3" />
              {currentProvider.id === "openrouter" && "Uses free Mistral model by default"}
              {currentProvider.id === "groq" && "Uses Llama 3.3 70B - ultra fast inference"}
              {currentProvider.id === "openai" && "Uses GPT-4o-mini for cost efficiency"}
              {currentProvider.id === "deepseek" && "Uses DeepSeek Chat model"}
              {currentProvider.id === "claude" && "Uses Claude 3 Haiku for speed"}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Section */}
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

      {/* Data Section */}
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

      {/* Notification Section */}
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
                  className="border-zinc-600 bg-white text-black hover:bg-zinc-200"
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
