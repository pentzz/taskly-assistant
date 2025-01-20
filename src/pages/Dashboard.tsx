import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Add this import
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Calendar, Search, Filter, Edit, CheckSquare } from "lucide-react";
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

type Task = {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  status: string | null;
  user_id: string | null;
};

const statusTranslations = {
  pending: "בהמתנה",
  in_progress: "בביצוע",
  completed: "הושלם",
};

const Dashboard = () => {
  const navigate = useNavigate(); // Add this line
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });

    checkAuth();
    return () => subscription.unsubscribe();
  }, []);

  const { data: tasks, isLoading, error, refetch } = useQuery({
    queryKey: ["tasks", statusFilter, userId],
    queryFn: async () => {
      if (!userId) return [];

      let query = supabase
        .from("tasks")
        .select("*")
        .eq('user_id', userId)
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
    enabled: !!userId,
  });

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "completed":
        return "bg-emerald-500/20 text-emerald-500 border border-emerald-500/30";
      case "in_progress":
        return "bg-blue-500/20 text-blue-500 border border-blue-500/30";
      default:
        return "bg-amber-500/20 text-amber-500 border border-amber-500/30";
    }
  };

  const filteredTasks = tasks?.filter(task => 
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (task.description?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  const handleEditTask = async (taskId: string) => {
    navigate(`/tasks/${taskId}/edit`);
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
    } catch (error) {
      console.error('Error completing task:', error);
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: "אירעה שגיאה בעת עדכון המשימה",
      });
    }
  };

  useEffect(() => {
    const generateRecommendations = async () => {
      try {
        await supabase.functions.invoke('generate-recommendations')
      } catch (error) {
        console.error('Error generating recommendations:', error)
      }
    }

    if (userId) {
      generateRecommendations()
    }
  }, [userId]);

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
        <p className="text-sm text-gray-400">{(error as Error).message}</p>
        <Button onClick={() => window.location.reload()}>נסה שוב</Button>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-gradient-to-b from-white to-gray-50">
        <p className="text-primary font-semibold">אנא התחבר כדי לצפות במשימות</p>
        <Button onClick={() => window.location.href = "/login"}>התחבר</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl font-bold text-gray-700 mb-2 animate-scale-in">
            ניהול המשימות שלי
          </h1>
          <p className="text-gray-500 animate-fade-in">נהל את המשימות שלך בקלות ויעילות</p>
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks?.map((task) => (
            <Card 
              key={task.id} 
              className="hover:scale-102 transition-all duration-200 bg-white/80 backdrop-blur-sm border-gray-200 hover:border-violet-300 shadow-sm hover:shadow-md"
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-xl font-semibold text-gray-700 flex justify-between items-center">
                  {task.title}
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditTask(task.id)}
                      className="h-8 w-8 text-gray-400 hover:text-violet-600 hover:bg-violet-50"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCompleteTask(task.id)}
                      className="h-8 w-8 text-gray-400 hover:text-violet-600 hover:bg-violet-50"
                    >
                      <CheckSquare className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {task.description && (
                  <p className="text-gray-400 line-clamp-2">{task.description}</p>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Calendar className="h-4 w-4" />
                  {task.due_date ? (
                    new Date(task.due_date).toLocaleDateString('he-IL')
                  ) : (
                    "לא נקבע תאריך"
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      task.status
                    )}`}
                  >
                    {task.status
                      ? statusTranslations[task.status as keyof typeof statusTranslations]
                      : "בהמתנה"}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {(!filteredTasks || filteredTasks.length === 0) && (
          <div className="text-center py-12">
            <p className="text-gray-400">לא נמצאו משימות</p>
          </div>
        )}

        <Button
          className="fixed bottom-6 left-6 w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-gradient-to-r from-purple-600 to-blue-600 hover:scale-105 animate-bounce"
          onClick={() => setIsTaskFormOpen(true)}
        >
          <Plus className="h-6 w-6" />
        </Button>

        <TaskFormModal
          open={isTaskFormOpen}
          onOpenChange={setIsTaskFormOpen}
          onTaskCreated={() => {
            void refetch();
          }}
        />

        <AIAssistantModal 
          tasks={tasks} 
          onEditTask={handleEditTask}
          onCompleteTask={handleCompleteTask}
        />
      </div>
    </div>
  );
};

export default Dashboard;