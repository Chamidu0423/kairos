import { useApp } from "@/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, CheckCircle2, Circle, Trash2, Clock, AlertTriangle } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

function Tasks() {
  const { tasks, loadingTasks, refreshTasks } = useApp();

  async function handleToggle(id: number, currentStatus: boolean) {
    try {
      await invoke("toggle_task", { id, isCompleted: currentStatus });
      refreshTasks();
      
      if (!currentStatus) {
        toast.success("Task marked as completed! 🎉");
      }
    } catch (e) {
      toast.error("Failed to update task");
    }
  }

  async function handleDelete(id: number) {
    try {
      await invoke("delete_task", { id });
      refreshTasks();
      toast.success("Task deleted successfully");
    } catch (e) {
      toast.error("Failed to delete task");
    }
  }

  const activeTasks = tasks.filter(t => !t.is_completed);
  const completedTasks = tasks.filter(t => t.is_completed);

  return (
    <div className="space-y-6 pb-10">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">My Tasks</h1>
            <p className="text-zinc-400 mt-1">Manage your deadlines and progress.</p>
        </div>
        <div className="text-sm text-zinc-500 bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">
            {activeTasks.length} Pending
        </div>
      </div>

      <Card className="bg-zinc-900/50 border-zinc-800 text-zinc-100 min-h-[500px]">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-zinc-300">Your List</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingTasks && tasks.length === 0 ? (
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
                <p className="text-zinc-500 mt-2">No pending tasks found.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activeTasks.map((task) => (
                <div key={task.id} className="group flex items-center justify-between p-4 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all hover:bg-zinc-800/80">
                  <div className="flex items-center gap-4">
                    <button 
                        onClick={() => handleToggle(task.id, task.is_completed)}
                        className="text-zinc-500 hover:text-green-500 transition-colors"
                    >
                        <Circle size={22} />
                    </button>
                    <div>
                        <h4 className="font-medium text-zinc-200 group-hover:text-white transition-colors">{task.title}</h4>
                        {task.due_date && (
                            <div className="flex items-center gap-1 text-xs text-zinc-500 mt-1">
                                <Calendar size={12} />
                                <span className={task.due_date.includes("None") ? "text-zinc-600" : "text-zinc-400"}>
                                    {task.due_date.includes("None") ? "No Due Date" : `Due: ${task.due_date}`}
                                </span>
                            </div>
                        )}
                    </div>
                  </div>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-500 hover:bg-red-950/30 transition-all"
                        >
                            <Trash2 size={18} />
                        </Button>
                    </AlertDialogTrigger>
                    
                    <AlertDialogContent className="bg-zinc-950 border-zinc-800 text-white">
                        <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-red-500">
                            <AlertTriangle className="h-5 w-5" /> Delete Task?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-zinc-400">
                            Are you sure you want to delete <b>"{task.title}"</b>? This action cannot be undone.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel className="bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-900 hover:text-white">Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={() => handleDelete(task.id)}
                            className="bg-red-600 text-white hover:bg-red-700 border-none"
                        >
                            Delete
                        </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}

              {completedTasks.length > 0 && (
                <>
                    <div className="py-4 text-xs font-bold text-zinc-600 uppercase tracking-widest">Completed</div>
                    {completedTasks.map((task) => (
                        <div key={task.id} className="flex items-center justify-between p-4 rounded-lg bg-zinc-950/30 border border-zinc-900 opacity-60 hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => handleToggle(task.id, task.is_completed)}
                                className="text-green-600 hover:text-zinc-500 transition-colors"
                            >
                                <CheckCircle2 size={22} />
                            </button>
                            <div>
                                <h4 className="font-medium text-zinc-500 line-through decoration-zinc-700">{task.title}</h4>
                            </div>
                        </div>
                        
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="text-zinc-700 hover:text-red-500 hover:bg-red-950/20"
                                >
                                    <Trash2 size={18} />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-zinc-950 border-zinc-800 text-white">
                                <AlertDialogHeader>
                                <AlertDialogTitle>Delete Completed Task?</AlertDialogTitle>
                                <AlertDialogDescription className="text-zinc-400">
                                    This will permanently remove this task from your history.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel className="bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-900 hover:text-white">Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(task.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                        </div>
                    ))}
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default Tasks;