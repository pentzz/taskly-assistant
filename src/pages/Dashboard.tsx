import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

type Task = {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  status: string | null;
  user_id: string | null;
};

const statusTranslations = {
  pending: "ממתין",
  in_progress: "בביצוע",
  completed: "הושלם",
};

const Dashboard = () => {
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const { toast } = useToast();

  const { data: tasks, isLoading } = useQuery({
    queryKey: ["tasks", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("tasks")
        .select("*")
        .order("due_date", { ascending: true });

      if (statusFilter) {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;

      if (error) {
        toast({
          variant: "destructive",
          title: "שגיאה בטעינת המשימות",
          description: error.message,
        });
        throw error;
      }

      return data as Task[];
    },
  });

  const handleAddTask = () => {
    console.log("Add task clicked");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">משימות</h1>
        <div className="flex gap-4 w-full sm:w-auto">
          <Select onValueChange={(value) => setStatusFilter(value)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="סינון לפי סטטוס" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">הכל</SelectItem>
              <SelectItem value="pending">ממתין</SelectItem>
              <SelectItem value="in_progress">בביצוע</SelectItem>
              <SelectItem value="completed">הושלם</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleAddTask}>
            <Plus className="ml-2 rtl-flip" />
            הוסף משימה
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tasks?.map((task) => (
          <Card key={task.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-xl">{task.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {task.description && (
                <p className="text-muted-foreground">{task.description}</p>
              )}
              {task.due_date && (
                <p className="text-sm">
                  תאריך יעד: {new Date(task.due_date).toLocaleDateString('he-IL')}
                </p>
              )}
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    task.status === "completed"
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                      : task.status === "in_progress"
                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
                      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
                  }`}
                >
                  {task.status ? statusTranslations[task.status as keyof typeof statusTranslations] : "ממתין"}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {tasks?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">לא נמצאו משימות</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;