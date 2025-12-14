import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Circle, CheckCircle2, Clock } from "lucide-react";

interface Task {
  id: number;
  title: string;
  due_date: string | null;
  is_completed: boolean;
}

function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadTasks() {
    try {
      const data = await invoke<Task[]>("get_all_tasks");
      setTasks(data);
    } catch (error) {
      console.error("Failed to load tasks:", error);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadTasks();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">My Tasks</h1>
            <p className="text-zinc-400 mt-1">Manage your deadlines extracted from emails.</p>
        </div>
        <div className="text-sm text-zinc-500 bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">
            {tasks.length} Active Tasks
        </div>
      </div>

      <Card className="bg-zinc-900/50 border-zinc-800 text-zinc-100 min-h-[500px]">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-zinc-300">Upcoming Deadlines</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center text-zinc-500 py-10 flex flex-col items-center gap-2">
                <Clock className="animate-spin text-zinc-600" />
                Loading tasks...
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-20">
                <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="text-zinc-600" size={32} />
                </div>
                <h3 className="text-lg font-medium text-white">All caught up!</h3>
                <p className="text-zinc-500 mt-2">No pending tasks found. Scan your emails to find new ones.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => (
                <div 
                    key={task.id} 
                    className="group flex items-center justify-between p-4 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all hover:bg-zinc-800/80"
                >
                  <div className="flex items-center gap-4">
                    <button className="text-zinc-500 hover:text-green-500 transition-colors">
                        <Circle size={20} />
                    </button>
                    <div>
                        <h4 className="font-medium text-zinc-200 group-hover:text-white transition-colors">{task.title}</h4>
                        {task.due_date && (
                            <div className="flex items-center gap-1 text-xs text-zinc-500 mt-1">
                                <Calendar size={12} />
                                <span className={`${task.due_date.includes("None") ? "text-zinc-600" : "text-zinc-400"}`}>
                                    {task.due_date.includes("None") ? "No Due Date" : `Due: ${task.due_date}`}
                                </span>
                            </div>
                        )}
                    </div>
                  </div>
                  
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs text-zinc-600 bg-zinc-950 px-2 py-1 rounded border border-zinc-900">
                        Pending
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default Tasks;