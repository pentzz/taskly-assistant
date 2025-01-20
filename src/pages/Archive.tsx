import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { TaskCard } from "@/components/TaskCard";

type Task = {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  status: string | null;
  user_id: string | null;
  is_archived?: boolean;
};

const Archive = () => {
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const { data: tasks, isLoading, error, refetch } = useQuery({
    queryKey: ["archived-tasks", statusFilter],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      let query = supabase
        .from("tasks")
        .select("*")
        .eq('user_id', user.id)
        .eq('is_archived', true)
        .order("due_date", { ascending: true });

      if (statusFilter && statusFilter !== "all") {
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

  const handleRestoreTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ is_archived: false })
        .eq('id', taskId);

      if (error) throw error;

      toast({
        title: "המשימה שוחזרה בהצלחה",
        description: "המשימה הוחזרה לרשימת המשימות הפעילות",
      });
      
      refetch();
    } catch (error) {
      console.error('Error restoring task:', error);
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: "אירעה שגיאה בעת שחזור המשימה",
      });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      toast({
        title: "המשימה נמחקה בהצלחה",
      });
      
      refetch();
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: "אירעה שגיאה בעת מחיקת המשימה",
      });
    }
  };

  const filteredTasks = tasks?.filter(task => 
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (task.description?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-white to-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-gradient-to-b from-white to-gray-50">
        <p className="text-red-500 font-semibold">שגיאה בטעינת המשימות</p>
        <Button onClick={() => window.location.reload()}>נסה שוב</Button>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-20 pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-4xl font-bold text-gray-700 mb-2 animate-scale-in">
              ארכיון משימות
            </h1>
            <p className="text-gray-500 animate-fade-in">
              צפה במשימות שהועברו לארכיון
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="חיפוש משימות..."
                className="pl-10 bg-black/20 border-gray-700 focus:border-purple-500 transition-colors"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-4 w-full sm:w-auto">
              <Select onValueChange={(value) => setStatusFilter(value)}>
                <SelectTrigger className="w-full sm:w-[180px] bg-black/20 border-gray-700">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="סינון לפי סטטוס" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">הכל</SelectItem>
                  <SelectItem value="pending">בהמתנה</SelectItem>
                  <SelectItem value="in_progress">בביצוע</SelectItem>
                  <SelectItem value="completed">הושלם</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTasks?.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onDelete={handleDeleteTask}
                onRestore={handleRestoreTask}
              />
            ))}
          </div>

          {(!filteredTasks || filteredTasks.length === 0) && (
            <div className="text-center py-12">
              <p className="text-gray-400">אין משימות בארכיון</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Archive;