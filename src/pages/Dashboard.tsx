import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Calendar } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

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
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);

  // Check if user is authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log("Current session:", session);
      if (session?.user) {
        setUserId(session.user.id);
        console.log("User ID:", session.user.id);
      } else {
        console.log("No active session found");
      }
    };

    checkAuth();
  }, []);

  const { data: tasks, isLoading, error } = useQuery({
    queryKey: ["tasks", statusFilter, userId],
    queryFn: async () => {
      console.log("Starting to fetch tasks...");
      console.log("Current user ID:", userId);
      console.log("Status filter:", statusFilter);

      if (!userId) {
        console.log("No user ID available, cannot fetch tasks");
        return [];
      }

      let query = supabase
        .from("tasks")
        .select("*")
        .order("due_date", { ascending: true });

      if (statusFilter) {
        query = query.eq("status", statusFilter);
      }

      console.log("Executing Supabase query...");
      const { data, error } = await query;

      if (error) {
        console.error("Error fetching tasks:", error);
        toast({
          variant: "destructive",
          title: "שגיאה בטעינת המשימות",
          description: error.message,
        });
        throw error;
      }

      console.log("Tasks fetched successfully:", data);
      return data as Task[];
    },
    enabled: !!userId, // Only run query when we have a userId
  });

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "completed":
        return "bg-green-500/20 text-green-500";
      case "in_progress":
        return "bg-blue-500/20 text-blue-500";
      default:
        return "bg-yellow-500/20 text-yellow-500";
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show error state
  if (error) {
    console.error("Error in dashboard:", error);
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-red-500">שגיאה בטעינת המשימות</p>
        <p className="text-sm text-gray-400">{(error as Error).message}</p>
        <Button onClick={() => window.location.reload()}>נסה שוב</Button>
      </div>
    );
  }

  // Show not authenticated state
  if (!userId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-red-500">אנא התחבר כדי לצפות במשימות</p>
        <Button onClick={() => window.location.href = "/login"}>התחבר</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6 min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-white">משימות</h1>
        <div className="flex gap-4 w-full sm:w-auto">
          <Select onValueChange={(value) => setStatusFilter(value)}>
            <SelectTrigger className="w-full sm:w-[180px] glass-morphism">
              <SelectValue placeholder="סינון לפי סטטוס" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">הכל</SelectItem>
              <SelectItem value="pending">בהמתנה</SelectItem>
              <SelectItem value="in_progress">בביצוע</SelectItem>
              <SelectItem value="completed">הושלם</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tasks?.map((task) => (
          <Card 
            key={task.id} 
            className="hover:scale-105 transition-transform duration-200 overflow-hidden backdrop-blur-xl bg-white/5 border border-white/10 shadow-[0_4px_12px_-2px_rgba(0,0,0,0.3)]"
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-xl font-semibold text-white">
                {task.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {task.description && (
                <p className="text-gray-300 line-clamp-2">{task.description}</p>
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

      {(!tasks || tasks.length === 0) && (
        <div className="text-center py-12">
          <p className="text-gray-400">לא נמצאו משימות</p>
        </div>
      )}

      <Button
        className="fixed bottom-6 left-6 w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-shadow duration-200 backdrop-blur-xl bg-primary/80"
        onClick={() => {
          console.log("Add task clicked");
          toast({
            title: "בקרוב...",
            description: "אפשרות להוספת משימה תתווסף בקרוב",
          });
        }}
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  );
};

export default Dashboard;