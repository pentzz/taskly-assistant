import { CheckSquare, Calendar, Edit } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    description?: string | null;
    due_date?: string | null;
    status?: string | null;
  };
  onEdit: (id: string) => void;
  onComplete: (id: string) => void;
}

export function TaskCard({ task, onEdit, onComplete }: TaskCardProps) {
  const isCompleted = task.status === "completed";
  
  const getDueDate = () => {
    if (!task.due_date) return "לא ידוע";
    if (task.due_date === "urgent") return "דחוף";
    if (task.due_date === "asap") return "בהקדם האפשרי";
    return new Date(task.due_date).toLocaleDateString("he-IL");
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