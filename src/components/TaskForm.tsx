import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

export function TaskForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState<Date>();
  const [status, setStatus] = useState("pending");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [titleError, setTitleError] = useState("");
  
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTitleError("");

    if (!title.trim()) {
      setTitleError("נא להזין כותרת למשימה");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("tasks").insert([
        {
          title: title.trim(),
          description: description.trim(),
          due_date: dueDate?.toISOString(),
          status,
        },
      ]);

      if (error) throw error;

      toast({
        title: "המשימה נוצרה בהצלחה",
        description: "המשימה החדשה נוספה לרשימת המשימות שלך",
      });
      
      navigate("/");
    } catch (error) {
      console.error("Error creating task:", error);
      toast({
        variant: "destructive",
        title: "שגיאה ביצירת המשימה",
        description: "אירעה שגיאה בעת יצירת המשימה. נא לנסות שוב.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <form 
          onSubmit={handleSubmit}
          className="glass-morphism rounded-lg p-6 space-y-6 rtl"
          dir="rtl"
        >
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white text-center mb-6">
              משימה חדשה
            </h2>
            
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-200">
                כותרת המשימה *
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-400"
                placeholder="הזן כותרת למשימה"
              />
              {titleError && (
                <p className="text-red-400 text-sm mt-1">{titleError}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-200">
                תיאור המשימה
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 min-h-[100px]"
                placeholder="הזן תיאור למשימה (אופציונלי)"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-200">
                תאריך יעד
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-right bg-gray-800/50 border-gray-700 text-white hover:bg-gray-700/50"
                  >
                    <Calendar className="ml-2 h-4 w-4" />
                    {dueDate ? (
                      format(dueDate, "P", { locale: he })
                    ) : (
                      <span className="text-gray-400">בחר תאריך</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    className="bg-gray-800 text-white"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-200">
                סטטוס המשימה
              </label>
              <Select
                value={status}
                onValueChange={setStatus}
              >
                <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="pending" className="text-white">בהמתנה</SelectItem>
                  <SelectItem value="completed" className="text-white">הושלם</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-4 justify-end mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/")}
              className="bg-gray-800/50 border-gray-700 text-white hover:bg-gray-700/50"
            >
              בטל
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? "שומר..." : "שמור"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}