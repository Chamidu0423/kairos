import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "@/components/ui/button";
import { Check, Plus, RefreshCw } from "lucide-react";
import { useApp } from "@/context/AppContext";

interface AiTask { found_task: boolean; title: string; due_date: string; priority: string; }

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
    const apiKey = prompt("Please enter your OpenRouter API Key:");
    if (!apiKey) return;

    setAnalyzingId(mail.id);
    try {
      const result = await invoke<AiTask>("analyze_email_with_ai", {
        content: mail.body.substring(0, 4000), 
        apiKey: apiKey 
      });
      setAiResults(prev => ({ ...prev, [mail.id]: result }));
    } catch (e) {
      alert("AI Error: " + e);
    }
    setAnalyzingId(null);
  }

  async function handleSaveTask(mailId: number, task: AiTask) {
    try {
        await invoke("add_task", { title: task.title, dueDate: task.due_date });
        setSavedTasks(prev => ({ ...prev, [mailId]: true }));
        refreshTasks(); 
    } catch (e) {
        alert("Failed to save: " + e);
    }
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Inbox Scanner</h1>
            <p className="text-zinc-400 mt-1">AI-powered analysis of your recent university emails.</p>
        </div>
        
        <Button 
            onClick={refreshEmails} 
            disabled={loadingEmails} 
            variant="outline" 
            className="border-zinc-700 bg-white text-black hover:bg-zinc-800 hover:text-white transition-colors"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${loadingEmails ? "animate-spin" : ""}`} />
          {loadingEmails ? "Scanning..." : "Refresh Inbox"}
        </Button>
      </div>

      <div className="space-y-4">
          {emails.length === 0 && !loadingEmails && (
            <div className="text-zinc-500 text-center py-10">No emails found. Click Refresh.</div>
          )}

          {emails.map((mail) => (
              <div key={mail.id} className="p-5 rounded-lg border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-white text-lg line-clamp-1">{mail.subject}</h3>
                      <span className="text-xs text-zinc-500 whitespace-nowrap ml-4">{mail.date}</span>
                  </div>
                  <p className="text-xs text-zinc-400 mb-3 font-mono">{mail.from}</p>
                  
                  <div className="bg-black/50 p-3 rounded text-sm text-zinc-300 font-mono whitespace-pre-wrap max-h-40 overflow-hidden relative mb-3">
                      {mail.body ? mail.body.substring(0, 300) : "No plain text content found."}
                      {mail.body.length > 300 && "..."}
                  </div>

                  {aiResults[mail.id] ? (
                    <div className={`p-4 rounded border ${aiResults[mail.id].found_task ? "bg-green-900/10 border-green-900/50" : "bg-zinc-800 border-zinc-700"}`}>
                      {aiResults[mail.id].found_task ? (
                        <div className="flex flex-col gap-3">
                          <div>
                              <div className="flex justify-between items-center mb-1">
                              <span className="font-bold text-green-400 flex items-center gap-2">✅ Task Found</span>
                              <span className="text-xs px-2 py-1 bg-green-900/30 text-green-200 rounded border border-green-900/50">{aiResults[mail.id].priority} Priority</span>
                              </div>
                              <h4 className="font-semibold text-lg">{aiResults[mail.id].title}</h4>
                              <p className="text-sm text-zinc-400 mt-1">📅 Due: {aiResults[mail.id].due_date}</p>
                          </div>
                          <Button 
                              size="sm"
                              onClick={() => handleSaveTask(mail.id, aiResults[mail.id])}
                              disabled={savedTasks[mail.id]}
                              className={`w-fit ${savedTasks[mail.id] ? "bg-zinc-700 text-zinc-300" : "bg-green-600 hover:bg-green-700 text-white"}`}
                          >
                              {savedTasks[mail.id] ? <><Check className="w-4 h-4 mr-2" /> Saved</> : <><Plus className="w-4 h-4 mr-2" /> Save Task</>}
                          </Button>
                        </div>
                      ) : (
                        <div className="text-zinc-500 text-sm flex items-center gap-2">ℹ️ No actionable tasks found.</div>
                      )}
                    </div>
                  ) : (
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs border-zinc-700 bg-white text-black hover:bg-zinc-800 hover:text-white transition-colors"
                        onClick={() => analyzeEmail(mail)} 
                        disabled={analyzingId === mail.id}
                    >
                        {analyzingId === mail.id ? "✨ Analyzing..." : "✨ Analyze with AI"}
                    </Button>
                  )}
              </div>
          ))}
      </div>
    </div>
  );
}

export default Scanner;