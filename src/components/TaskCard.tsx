import { CheckSquare, Calendar, Edit, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    description?: string | null;
    due_date?: string | null;
    due_date_type?: "date" | "unknown" | "urgent" | "asap" | null;
    status?: string | null;
    is_recurring?: boolean;
    recurrence_pattern?: "daily" | "weekly" | "monthly" | null;
  };
  onEdit: (id: string) => void;
  onComplete: (id: string) => void;
}

export function TaskCard({ task, onEdit, onComplete }: TaskCardProps) {
  const isCompleted = task.status === "completed";
  
  const getDueDate = () => {
    if (!task.due_date_type || task.due_date_type === "date") {
      return task.due_date ? new Date(task.due_date).toLocaleDateString("he-IL") : "לא ידוע";
    }
    
    switch (task.due_date_type) {
      case "unknown":
        return "לא ידוע";
      case "urgent":
        return "דחוף";
      case "asap":
        return "בהקדם האפשרי";
      default:
        return "לא ידוע";
    }
  };

  const getRecurrenceText = () => {
    if (!task.is_recurring || !task.recurrence_pattern) return null;
    
    switch (task.recurrence_pattern) {
      case "daily":
        return "חוזר מדי יום";
      case "weekly":
        return "חוזר מדי שבוע";
      case "monthly":
        return "חוזר מדי חודש";
      default:
        return null;
    }
  };

  return (
    <div className={cn(
      "task-card",
      isCompleted && "completed-task"
    )}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(task.id)}
            className="h-8 w-8 text-gray-400 hover:text-violet-600 hover:bg-violet-50"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onComplete(task.id)}
            className={cn(
              "h-8 w-8",
              isCompleted
                ? "text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50"
                : "text-gray-400 hover:text-violet-600 hover:bg-violet-50"
            )}
          >
            <CheckSquare className="h-4 w-4" />
          </Button>
        </div>
        <h3 className="text-xl font-medium text-gray-800">{task.title}</h3>
      </div>
      
      {task.description && (
        <p className="text-gray-600 mb-4">{task.description}</p>
      )}
      
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Calendar className="h-4 w-4" />
        {getDueDate()}
      </div>
      
      {task.is_recurring && (
        <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
          <RefreshCw className="h-4 w-4" />
          {getRecurrenceText()}
        </div>
      )}
      
      <div className="mt-4">
        <span className={cn(
          "px-3 py-1 rounded-full text-xs font-medium",
          isCompleted
            ? "bg-emerald-500/20 text-emerald-500 border border-emerald-500/30"
            : "bg-amber-500/20 text-amber-500 border border-amber-500/30"
        )}>
          {isCompleted ? "הושלם" : "בהמתנה"}
        </span>
      </div>
    </div>
  );
}