import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "@/components/ui/button";
import { Check, Plus, RefreshCw, Sparkles, AlertCircle, ChevronDown, ChevronUp, Mail, User, Calendar } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";

interface AiTask {
  found_task: boolean;
  title: string;
  due_date: string;
  priority: string;
}

// Email item component with expand/collapse
function EmailItem({ 
  mail, 
  isExpanded, 
  onToggle, 
  aiResult, 
  isAnalyzing, 
  isSaved,
  onAnalyze, 
  onSaveTask 
}: {
  mail: any;
  isExpanded: boolean;
  onToggle: () => void;
  aiResult?: AiTask;
  isAnalyzing: boolean;
  isSaved: boolean;
  onAnalyze: () => void;
  onSaveTask: () => void;
}) {
  // Function to safely render HTML email content
  function renderEmailBody(body: string) {
    // Check if the body contains HTML tags
    const hasHtml = /<[a-z][\s\S]*>/i.test(body);
    
    if (hasHtml) {
      return (
        <div 
          className="email-html-content prose prose-invert prose-sm max-w-none"
          dangerouslySetInnerHTML={{ 
            __html: sanitizeHtml(body) 
          }}
        />
      );
    }
    
    // Plain text - preserve whitespace and line breaks
    return (
      <div className="whitespace-pre-wrap text-zinc-300 text-sm leading-relaxed">
        {body}
      </div>
    );
  }

  // Basic HTML sanitization (removes scripts and dangerous attributes)
  function sanitizeHtml(html: string): string {
    // Remove script tags
    let clean = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    // Remove onclick, onerror, etc.
    clean = clean.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
    // Remove javascript: links
    clean = clean.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href="#"');
    return clean;
  }

  // Format date nicely
  function formatDate(dateStr: string) {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { 
        weekday: 'short',
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  }

  // Extract sender name from email format
  function extractSenderName(from: string) {
    const match = from.match(/^"?([^"<]+)"?\s*<?/);
    return match ? match[1].trim() : from;
  }

  return (
    <div className={`rounded-xl border transition-all duration-200 overflow-hidden ${
      isExpanded 
        ? "border-[rgb(93,138,255)]/40 bg-zinc-900" 
        : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
    }`}>
      {/* Email Header - Always visible */}
      <div 
        className="p-4 cursor-pointer select-none"
        onClick={onToggle}
      >
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
            <img 
              src="/icons/mail-profile-icon.jpg" 
              alt="Mail" 
              className="w-full h-full object-cover"
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="font-medium text-white truncate">
                {extractSenderName(mail.from)}
              </span>
              <span className="text-xs text-zinc-500 whitespace-nowrap flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(mail.date)}
              </span>
            </div>
            <h3 className={`font-semibold truncate transition-colors ${
              isExpanded ? "text-[rgb(140,170,255)]" : "text-zinc-200"
            }`}>
              {mail.subject}
            </h3>
            {!isExpanded && (
              <p className="text-sm text-zinc-500 mt-1 line-clamp-1">
                {mail.body?.replace(/<[^>]*>/g, '').substring(0, 100) || "No preview available"}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Analyze AI button - only show if not analyzed yet */}
            {!aiResult && (
              <button
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                  isAnalyzing 
                    ? "bg-[rgb(93,138,255)]/30 text-[rgb(93,138,255)]" 
                    : "bg-[rgb(93,138,255)] text-white hover:bg-[rgb(120,160,255)] shadow-lg shadow-[rgb(93,138,255)]/20"
                }`}
                onClick={(e) => { e.stopPropagation(); onAnalyze(); }}
                disabled={isAnalyzing}
                title="Analyze with AI"
              >
                {isAnalyzing 
                  ? <RefreshCw className="w-4 h-4 animate-spin" /> 
                  : <Sparkles className="w-4 h-4" />
                }
              </button>
            )}
            {/* Show check if analyzed */}
            {aiResult && (
              <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                aiResult.found_task 
                  ? "bg-green-500/20 text-green-400" 
                  : "bg-zinc-700 text-zinc-400"
              }`}>
                {aiResult.found_task ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              </div>
            )}
            
            {/* Expand/Collapse button */}
            <button className={`p-2 rounded-lg transition-colors ${
              isExpanded 
                ? "bg-[rgb(93,138,255)]/20 text-[rgb(93,138,255)]" 
                : "bg-zinc-800 text-zinc-400 hover:bg-[rgb(93,138,255)]/20 hover:text-[rgb(93,138,255)]"
            }`}>
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-zinc-800">
          {/* Email metadata */}
          <div className="px-4 py-3 bg-zinc-800/30 text-xs text-zinc-400 space-y-1">
            <div className="flex items-center gap-2">
              <User className="w-3 h-3" />
              <span className="text-zinc-500">From:</span>
              <span className="text-zinc-300">{mail.from}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-3 h-3" />
              <span className="text-zinc-500">Subject:</span>
              <span className="text-zinc-300">{mail.subject}</span>
            </div>
          </div>

          {/* Email Body */}
          <div className="p-4 max-h-[400px] overflow-y-auto">
            <div className="bg-white/5 rounded-lg p-4 border border-zinc-800">
              {renderEmailBody(mail.body || "No content")}
            </div>
          </div>

          {/* Actions - AI Analysis Result */}
          {aiResult && (
            <div className="px-4 pb-4">
              <div className={`p-4 rounded-lg border transition-all duration-500 ${
                aiResult.found_task 
                  ? "bg-green-950/30 border-green-800/50" 
                  : "bg-zinc-800/50 border-zinc-700"
              }`}>
                {aiResult.found_task ? (
                  <div className="flex flex-col gap-3">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-green-400 flex items-center gap-2">
                          <Check className="w-4 h-4" /> Task Detected
                        </span>
                        <span className="text-[10px] uppercase tracking-wider px-2 py-1 bg-green-900/40 text-green-200 rounded-full border border-green-800">
                          {aiResult.priority} Priority
                        </span>
                      </div>
                      <h4 className="font-semibold text-lg text-white">{aiResult.title}</h4>
                      <p className="text-sm text-zinc-400 mt-1 flex items-center gap-2">
                        📅 Due: <span className="text-zinc-200">{aiResult.due_date}</span>
                      </p>
                    </div>
                    
                    <Button 
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); onSaveTask(); }}
                      disabled={isSaved}
                      className={`w-fit font-medium transition-all ${
                        isSaved 
                          ? "bg-zinc-800 text-zinc-400 cursor-not-allowed border border-zinc-700" 
                          : "bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/20"
                      }`}
                    >
                      {isSaved 
                        ? <><Check className="w-4 h-4 mr-2" /> Saved to Tasks</> 
                        : <><Plus className="w-4 h-4 mr-2" /> Save Task</>
                      }
                    </Button>
                  </div>
                ) : (
                  <div className="text-zinc-500 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> No actionable tasks found in this email.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Scanner() {
  const { emails, loadingEmails, refreshEmails, refreshTasks } = useApp();
  
  const [aiResults, setAiResults] = useState<Record<number, AiTask>>({});
  const [analyzingId, setAnalyzingId] = useState<number | null>(null);
  const [savedTasks, setSavedTasks] = useState<Record<number, boolean>>({});
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    if (emails.length === 0) {
      refreshEmails();
    }
  }, []);

  async function analyzeEmail(mail: any) {
    // Get the selected provider and its API key from DB
    let apiKey: string | null = null;
    let provider = "openrouter";
    
    try {
      const dbProvider = await invoke<string | null>("get_app_setting", { key: "ai_provider" });
      provider = dbProvider || "openrouter";
      
      // Get provider-specific API key
      apiKey = await invoke<string | null>("get_app_setting", { key: `api_key_${provider}` });
      
      // Fallback to generic api_key
      if (!apiKey) {
        apiKey = await invoke<string | null>("get_app_setting", { key: "api_key" });
      }
    } catch {
      // Legacy fallback to localStorage
      apiKey = localStorage.getItem("openrouter_api_key");
    }

    if (!apiKey) {
        toast.error("API Key missing! Please go to Settings and configure your AI key.");
        return;
    }

    setAnalyzingId(mail.id);
    const toastId = toast.loading(`Analyzing with ${provider}...`);

    try {
      const result = await invoke<AiTask>("analyze_email_with_ai", {
        content: mail.body.substring(0, 4000), 
        apiKey: apiKey,
        provider: provider
      });
      
      setAiResults(prev => ({ ...prev, [mail.id]: result }));
      
      if(result.found_task) {
        toast.success("Actionable task found!", { id: toastId });
      } else {
        toast.info("Analysis complete. No tasks detected.", { id: toastId });
      }

    } catch (e) {
      toast.error(`Analysis failed: ${e}`, { id: toastId });
    }
    setAnalyzingId(null);
  }

  async function handleSaveTask(mailId: number, task: AiTask) {
    try {
        await invoke("add_task", { title: task.title, dueDate: task.due_date });
        setSavedTasks(prev => ({ ...prev, [mailId]: true }));
        
        refreshTasks(); 
        
        toast.success("Task saved successfully to database!");
    } catch (e) {
        toast.error("Failed to save task: " + e);
    }
  }

  return (
    <div className="space-y-6 pb-10">
      {/* --- Header Section --- */}
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Inbox</h1>
            <p className="text-zinc-400 mt-1">AI-powered analysis of your recent university emails.</p>
        </div>
        
        <Button 
            onClick={async () => {
                toast.promise(
                    (async () => {
                        await refreshEmails();
                    })(),
                    {
                        loading: 'Scanning inbox...',
                        success: 'Inbox refreshed successfully!',
                        error: 'Failed to refresh inbox',
                    }
                );
            }} 
            disabled={loadingEmails} 
            variant="outline" 
            className="border-zinc-700 bg-white text-black hover:bg-zinc-800 hover:text-white transition-colors"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${loadingEmails ? "animate-spin" : ""}`} />
          {loadingEmails ? "Scanning..." : "Refresh"}
        </Button>
      </div>

      {/* --- Email List Section --- */}
      <div className="space-y-3">
          {emails.length === 0 && !loadingEmails && (
            <div className="text-zinc-500 text-center py-20 bg-zinc-900/30 rounded-lg border border-zinc-800 border-dashed">
                <Mail className="w-12 h-12 mx-auto mb-3 text-zinc-600" />
                <p>No emails found locally.</p>
                <p className="text-xs mt-1">Click "Refresh Inbox" to fetch from server.</p>
            </div>
          )}

          {emails.map((mail) => (
            <EmailItem
              key={mail.id}
              mail={mail}
              isExpanded={expandedId === mail.id}
              onToggle={() => setExpandedId(expandedId === mail.id ? null : mail.id)}
              aiResult={aiResults[mail.id]}
              isAnalyzing={analyzingId === mail.id}
              isSaved={savedTasks[mail.id] || false}
              onAnalyze={() => analyzeEmail(mail)}
              onSaveTask={() => handleSaveTask(mail.id, aiResults[mail.id])}
            />
          ))}
      </div>
    </div>
  );
}

export default Scanner;