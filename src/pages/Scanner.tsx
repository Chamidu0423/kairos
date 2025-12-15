import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "@/components/ui/button";
import { Check, Plus, RefreshCw, Sparkles, AlertCircle } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";

interface AiTask {
  found_task: boolean;
  title: string;
  due_date: string;
  priority: string;
}

function Scanner() {
  const { emails, loadingEmails, refreshEmails, refreshTasks } = useApp();
  
  const [aiResults, setAiResults] = useState<Record<number, AiTask>>({});
  const [analyzingId, setAnalyzingId] = useState<number | null>(null);
  const [savedTasks, setSavedTasks] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (emails.length === 0) {
      refreshEmails();
    }
  }, []);

  async function analyzeEmail(mail: any) {
    const apiKey = localStorage.getItem("openrouter_api_key");

    if (!apiKey) {
        toast.error("API Key missing! Please go to Settings and configure your AI key.");
        return;
    }

    setAnalyzingId(mail.id);
    const toastId = toast.loading("Analyzing email content...");

    try {
      const result = await invoke<AiTask>("analyze_email_with_ai", {
        content: mail.body.substring(0, 4000), 
        apiKey: apiKey 
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
            <h1 className="text-3xl font-bold text-white tracking-tight">Inbox Scanner</h1>
            <p className="text-zinc-400 mt-1">AI-powered analysis of your recent university emails.</p>
        </div>
        
        <Button 
            onClick={() => {
                toast.promise(refreshEmails(), {
                    loading: 'Scanning inbox...',
                    success: 'Inbox refreshed successfully!',
                    error: 'Failed to refresh inbox',
                });
            }} 
            disabled={loadingEmails} 
            variant="outline" 
            className="border-zinc-700 bg-white text-black hover:bg-zinc-800 hover:text-white transition-colors"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${loadingEmails ? "animate-spin" : ""}`} />
          {loadingEmails ? "Scanning..." : "Refresh Inbox"}
        </Button>
      </div>

      {/* --- Email List Section --- */}
      <div className="space-y-4">
          {emails.length === 0 && !loadingEmails && (
            <div className="text-zinc-500 text-center py-20 bg-zinc-900/30 rounded-lg border border-zinc-800 border-dashed">
                <p>No emails found locally.</p>
                <p className="text-xs mt-1">Click "Refresh Inbox" to fetch from server.</p>
            </div>
          )}

          {emails.map((mail) => (
              <div key={mail.id} className="p-5 rounded-lg border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 transition-colors group">
                  
                  {/* Email Header */}
                  <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-white text-lg line-clamp-1 group-hover:text-purple-100 transition-colors">
                        {mail.subject}
                      </h3>
                      <span className="text-xs text-zinc-500 whitespace-nowrap ml-4 font-mono">{mail.date}</span>
                  </div>
                  <p className="text-xs text-zinc-400 mb-3 font-mono border-b border-zinc-800/50 pb-2">{mail.from}</p>
                  
                  {/* Email Body Preview */}
                  <div className="bg-black/40 p-3 rounded text-sm text-zinc-300 font-mono whitespace-pre-wrap max-h-40 overflow-hidden relative mb-4 border border-zinc-800/50">
                      {mail.body ? mail.body.substring(0, 300) : "No readable text content found."}
                      {mail.body.length > 300 && <span className="text-zinc-600">...</span>}
                      
                      <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-black/40 to-transparent"></div>
                  </div>

                  {/* --- AI Analysis ResultSection --- */}
                  {aiResults[mail.id] ? (
                    <div className={`p-4 rounded border transition-all duration-500 ${aiResults[mail.id].found_task ? "bg-green-950/20 border-green-900/50" : "bg-zinc-800/50 border-zinc-700"}`}>
                      {aiResults[mail.id].found_task ? (
                        <div className="flex flex-col gap-3">
                          <div>
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-bold text-green-400 flex items-center gap-2">
                                    <Check className="w-4 h-4" /> Task Found
                                </span>
                                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 bg-green-900/40 text-green-200 rounded border border-green-800">
                                    {aiResults[mail.id].priority} Priority
                                </span>
                              </div>
                              <h4 className="font-semibold text-lg text-white">{aiResults[mail.id].title}</h4>
                              <p className="text-sm text-zinc-400 mt-1 flex items-center gap-2">
                                📅 Due: <span className="text-zinc-200">{aiResults[mail.id].due_date}</span>
                              </p>
                          </div>
                          
                          <Button 
                              size="sm"
                              onClick={() => handleSaveTask(mail.id, aiResults[mail.id])}
                              disabled={savedTasks[mail.id]}
                              className={`w-fit font-medium transition-all ${
                                savedTasks[mail.id] 
                                ? "bg-zinc-800 text-zinc-400 cursor-not-allowed border border-zinc-700" 
                                : "bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/20"
                              }`}
                          >
                              {savedTasks[mail.id] ? <><Check className="w-4 h-4 mr-2" /> Saved to Tasks</> : <><Plus className="w-4 h-4 mr-2" /> Save Task</>}
                          </Button>
                        </div>
                      ) : (
                        <div className="text-zinc-500 text-sm flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" /> No actionable tasks found in this email.
                        </div>
                      )}
                    </div>
                  ) : (
                    // Analyze Button
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs font-medium border-zinc-700 bg-white text-black hover:bg-zinc-800 hover:text-white transition-all shadow-sm"
                        onClick={() => analyzeEmail(mail)} 
                        disabled={analyzingId === mail.id}
                    >
                        {analyzingId === mail.id ? (
                            <>
                                <RefreshCw className="mr-2 h-3 w-3 animate-spin" /> Analyzing...
                            </>
                        ) : (
                            <>
                                <Sparkles className="mr-2 h-3 w-3" /> Analyze with AI
                            </>
                        )}
                    </Button>
                  )}
              </div>
          ))}
      </div>
    </div>
  );
}

export default Scanner;