import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Email {
  id: number;
  subject: string;
  from: string;
  date: string;
  body: string; 
}

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [server, setServer] = useState("imap.gmail.com");
  
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [emails, setEmails] = useState<Email[]>([]);

  async function handleScan() {
    setLoading(true);
    setStatus("Scanning Inbox (Fetching full content)...");
    try {
      const data = await invoke<Email[]>("fetch_recent_emails", {
        email,
        password,
        server,
      });
      setEmails(data);
      setStatus(`Found ${data.length} emails!`);
    } catch (error) {
      setStatus("Error: " + error);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen w-full bg-black text-white flex flex-col items-center p-8 gap-8 overflow-y-auto">
      
      {/* Login Card */}
      <Card className="w-[400px] bg-zinc-900 border-zinc-800 text-zinc-100 shrink-0">
        <CardHeader>
          <CardTitle className="text-center">Kairos Scanner</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input value={server} onChange={(e) => setServer(e.target.value)} className="bg-zinc-800 border-zinc-700" placeholder="Server" />
          <Input value={email} onChange={(e) => setEmail(e.target.value)} className="bg-zinc-800 border-zinc-700" placeholder="Email" />
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-zinc-800 border-zinc-700" placeholder="App Password" />
          
          <Button onClick={handleScan} disabled={loading} className="w-full bg-white text-black hover:bg-gray-200">
            {loading ? "Scanning..." : "Scan Inbox for Tasks"}
          </Button>

          {status && <div className="text-sm text-center text-zinc-400">{status}</div>}
        </CardContent>
      </Card>

      {/* Results List */}
      {emails.length > 0 && (
        <div className="w-full max-w-2xl space-y-4 pb-10">
            <h2 className="text-xl font-bold mb-4">Recent Emails</h2>
            {emails.map((mail) => (
                <div key={mail.id} className="p-5 rounded-lg border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-white text-lg">{mail.subject}</h3>
                        <span className="text-xs text-zinc-500 whitespace-nowrap ml-4">{mail.date}</span>
                    </div>
                    <p className="text-xs text-zinc-400 mb-3 font-mono">{mail.from}</p>
                    
                    {/* Body Preview Area */}
                    <div className="bg-black/50 p-3 rounded text-sm text-zinc-300 font-mono whitespace-pre-wrap max-h-40 overflow-hidden relative">
                        {mail.body ? mail.body.substring(0, 300) : "No plain text content found."}
                        {mail.body.length > 300 && "..."}
                    </div>
                </div>
            ))}
        </div>
      )}
    </div>
  );
}

export default App;