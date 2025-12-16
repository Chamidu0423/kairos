import { useEffect, useState, useRef } from "react";
import { CheckCircle, Mail, X } from "lucide-react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";

interface NotificationData {
  notif_type: string;
  title: string;
  body: string;
  duration: number;
}

export default function NotificationPopup() {
  const [data, setData] = useState<NotificationData | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const timerIdRef = useRef<number>(0);

  //Hide the notification window
  async function hideWindow() {
    console.log("🚪 Hiding window...");
    setIsVisible(false);
    setData(null);
    try {
      await invoke("hide_notification");
      console.log("✅ Window hidden successfully");
    } catch (e) {
      console.error("❌ Failed to hide:", e);
    }
  }

  useEffect(() => {
    console.log("🔔 NotificationPopup mounted!");

    const setupListener = async () => {
      const unlisten = await listen<NotificationData>("notification-data", (event) => {
        console.log("📬 Event received:", event.payload);
        
        // Cancel any existing timer
        if (timerIdRef.current) {
          console.log("🧹 Clearing previous timer:", timerIdRef.current);
          window.clearTimeout(timerIdRef.current);
          timerIdRef.current = 0;
        }

        // Show notification
        setData(event.payload);
        setIsVisible(true);

        // Set auto-hide timer
        const durationSec = event.payload.duration;
        if (durationSec > 0) {
          const ms = durationSec * 1000;
          console.log(`⏱️ Setting timer for ${durationSec}s (${ms}ms)`);
          
          timerIdRef.current = window.setTimeout(() => {
            console.log("⏰ Timer fired! Hiding...");
            hideWindow();
          }, ms);
          
          console.log("⏱️ Timer ID:", timerIdRef.current);
        }
      });

      return unlisten;
    };

    const unlistenPromise = setupListener();

    return () => {
      console.log("🧹 Cleanup...");
      if (timerIdRef.current) {
        window.clearTimeout(timerIdRef.current);
      }
      unlistenPromise.then(fn => fn());
    };
  }, []);

  // Loading state
  if (!data) {
    return (
      <div className="h-screen w-screen bg-zinc-900 flex items-center justify-center">
        <span className="text-zinc-600 text-xs">Ready</span>
      </div>
    );
  }

  const isTask = data.notif_type === "task";

  return (
    <div className="h-screen w-screen bg-zinc-900 overflow-hidden">
      <div
        className={`h-full w-full flex flex-col transition-all duration-300 ${
          isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        {/* Header */}
        <div className={`px-4 py-3 flex items-center justify-between shrink-0 ${
          isTask
            ? "bg-gradient-to-r from-green-800 to-green-700"
            : "bg-gradient-to-r from-blue-800 to-blue-700"
        }`}>
          <div className="flex items-center gap-2">
            {isTask ? (
              <CheckCircle className="w-5 h-5 text-green-400" />
            ) : (
              <Mail className="w-5 h-5 text-blue-400" />
            )}
            <span className="text-sm font-semibold text-white uppercase tracking-wider">
              {isTask ? "Task Created" : "New Email"}
            </span>
          </div>
          <button
            onClick={hideWindow}
            className="text-zinc-300 hover:text-white transition-colors p-1 hover:bg-white/20 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 overflow-hidden bg-zinc-900">
          <h3 className="font-semibold text-white text-base mb-2 truncate">{data.title}</h3>
          <p className="text-sm text-zinc-400 line-clamp-3 leading-relaxed whitespace-pre-line">{data.body}</p>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-black/50 border-t border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full animate-pulse ${isTask ? "bg-green-500" : "bg-blue-500"}`}></div>
            <span className="text-xs text-zinc-500 font-medium tracking-wide">KAIROS</span>
          </div>
          <button
            onClick={hideWindow}
            className="text-xs text-zinc-500 hover:text-white transition-colors px-3 py-1 hover:bg-white/10 rounded"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
