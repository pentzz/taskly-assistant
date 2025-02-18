import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Search, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { TaskFormModal } from "@/components/TaskFormModal";
import { AIAssistantModal } from "@/components/AIAssistantModal";
import { RecommendationsSection } from "@/components/RecommendationsSection";
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

const Dashboard = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error("Session error:", sessionError);
        navigate("/login");
        return;
      }
      setUserId(session?.user?.id ?? null);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
      if (!session) {
        navigate("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const { data: tasks, isLoading, error, refetch } = useQuery({
    queryKey: ["tasks", statusFilter, userId],
    queryFn: async () => {
      if (!userId) return [];

      try {
        let query = supabase
          .from("tasks")
          .select("*")
          .eq('user_id', userId)
          .eq('is_archived', false);

        if (statusFilter && statusFilter !== "all") {
          query = query.eq("status", statusFilter);
        }

        const { data, error: fetchError } = await query.order("due_date", { ascending: true });

        if (fetchError) {
          console.error("Error fetching tasks:", fetchError);
          toast({
            variant: "destructive",
            title: "שגיאה בטעינת המשימות",
            description: "אירעה שגיאה בעת טעינת המשימות. נא לנסות שוב.",
          });
          throw fetchError;
        }

        return data as Task[];
      } catch (error) {
        console.error("Error in queryFn:", error);
        throw error;
      }
    },
    enabled: !!userId,
    retry: 2,
    retryDelay: 1000,
  });

  const handleEditTask = (taskId: string) => {
    setSelectedTaskId(taskId);
    setIsTaskFormOpen(true);
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'completed' })
        .eq('id', taskId);

      if (error) throw error;

      toast({
        title: "המשימה הושלמה בהצלחה",
        description: "כל הכבוד! המשכ/י כך",
      });
      
      refetch();
    } catch (error) {
      console.error('Error completing task:', error);
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: "אירעה שגיאה בעת עדכון המשימה",
      });
    }
  };

  const handleArchiveTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ is_archived: true })
        .eq('id', taskId);

      if (error) throw error;

      toast({
        title: "המשימה הועברה לארכיון",
        description: "המשימה נשמרה בארכיון בהצלחה",
      });
      
      refetch();
    } catch (error) {
      console.error('Error archiving task:', error);
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: "אירעה שגיאה בעת העברת המשימה לארכיון",
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

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-gradient-to-b from-white to-gray-50">
        <p className="text-red-500 font-semibold">שגיאה בטעינת המשימות</p>
        <Button onClick={() => refetch()}>נסה שוב</Button>
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
              ניהול המשימות שלי
            </h1>
            <p className="text-gray-500 animate-fade-in">
              נהל את המשימות שלך בקלות ויעילות
            </p>
          </div>

          <RecommendationsSection />

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

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTasks?.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={handleEditTask}
                  onComplete={handleCompleteTask}
                  onDelete={handleDeleteTask}
                  onArchive={handleArchiveTask}
                />
              ))}
            </div>
          )}

          {(!filteredTasks || filteredTasks.length === 0) && !isLoading && (
            <div className="text-center py-12">
              <p className="text-gray-400">לא נמצאו משימות</p>
            </div>
          )}

          <Button
            className="fixed bottom-6 left-6 w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-gradient-to-r from-purple-600 to-blue-600 hover:scale-105"
            onClick={() => {
              setSelectedTaskId(null);
              setIsTaskFormOpen(true);
            }}
          >
            <Plus className="h-6 w-6" />
          </Button>

          <TaskFormModal
            open={isTaskFormOpen}
            onOpenChange={setIsTaskFormOpen}
            taskId={selectedTaskId}
            onTaskCreated={() => {
              void refetch();
              setSelectedTaskId(null);
            }}
          />

          <AIAssistantModal 
            tasks={tasks} 
            onEditTask={handleEditTask}
            onCompleteTask={handleCompleteTask}
          />
        </div>
      </div>
    </>
  );
};

export default Dashboard;