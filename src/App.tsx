import { Button } from "@/components/ui/button";
import { useState } from "react";

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="h-screen w-full bg-black text-white flex flex-col items-center justify-center space-y-8 font-sans">
      {/* Header Section */}
      <div className="text-center space-y-2">
        <h1 className="text-6xl font-bold tracking-tighter bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">
          Kairos
        </h1>
        <p className="text-gray-400 text-lg">Your AI-Powered Second Brain</p>
      </div>

      {/* Interactive Section */}
      <div className="flex flex-col items-center gap-4">
        <div className="p-6 border border-gray-800 rounded-xl bg-zinc-950/50 backdrop-blur-sm shadow-2xl">
          <p className="mb-4 text-zinc-300">System Status: <span className="text-green-500 font-mono">ONLINE</span></p>
          
          <Button 
            onClick={() => setCount((c) => c + 1)}
            variant="outline" 
            className="text-white border-gray-700 hover:bg-white hover:text-black transition-all duration-300"
          >
            Test Button Clicked: {count}
          </Button>
        </div>
      </div>

      <p className="text-xs text-gray-600 fixed bottom-4">v1.0.0 • Powered by Tauri & Rust</p>
    </div>
  );
}

export default App;