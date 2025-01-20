import { useState, useEffect } from "react";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

interface TaskFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId?: string | null;
  onTaskCreated?: () => void;
}

type RecurrencePattern = "daily" | "weekly" | "monthly";
type DueDateType = "date" | "unknown" | "urgent" | "asap";

export function TaskFormModal({ open, onOpenChange, taskId, onTaskCreated }: TaskFormModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState<Date>();
  const [dueDateType, setDueDateType] = useState<DueDateType>("date");
  const [status, setStatus] = useState("pending");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState<RecurrencePattern | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [titleError, setTitleError] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    const loadTask = async () => {
      if (!taskId) {
        resetForm();
        return;
      }

      try {
        const { data, error } = await supabase
          .from("tasks")
          .select("*")
          .eq("id", taskId)
          .single();

        if (error) throw error;

        if (data) {
          setTitle(data.title);
          setDescription(data.description || "");
          if (data.due_date_type === "date" && data.due_date) {
            setDueDate(new Date(data.due_date));
          }
          setDueDateType(data.due_date_type || "date");
          setStatus(data.status || "pending");
          setIsRecurring(data.is_recurring || false);
          setRecurrencePattern(data.recurrence_pattern || null);
        }
      } catch (error) {
        console.error("Error loading task:", error);
        toast({
          variant: "destructive",
          title: "שגיאה בטעינת המשימה",
          description: "אירעה שגיאה בעת טעינת פרטי המשימה",
        });
      }
    };

    loadTask();
  }, [taskId, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTitleError("");

    if (!title.trim()) {
      setTitleError("נא להזין כותרת למשימה");
      return;
    }

    setIsSubmitting(true);
    try {
      const taskData = {
        title: title.trim(),
        description: description.trim(),
        due_date: dueDateType === "date" ? dueDate?.toISOString() : null,
        due_date_type: dueDateType,
        status,
        is_recurring: isRecurring,
        recurrence_pattern: isRecurring ? recurrencePattern : null,
      };

      let error;
      if (taskId) {
        ({ error } = await supabase
          .from("tasks")
          .update(taskData)
          .eq("id", taskId));
      } else {
        ({ error } = await supabase.from("tasks").insert([taskData]));
      }

      if (error) throw error;

      toast({
        title: taskId ? "המשימה עודכנה בהצלחה" : "המשימה נוצרה בהצלחה",
        description: taskId
          ? "פרטי המשימה עודכנו בהצלחה"
          : "המשימה החדשה נוספה לרשימת המשימות שלך",
      });
      
      onTaskCreated?.();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error("Error saving task:", error);
      toast({
        variant: "destructive",
        title: taskId ? "שגיאה בעדכון המשימה" : "שגיאה ביצירת המשימה",
        description: "אירעה שגיאה בעת שמירת המשימה. נא לנסות שוב.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDueDate(undefined);
    setDueDateType("date");
    setStatus("pending");
    setIsRecurring(false);
    setRecurrencePattern(null);
    setTitleError("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-white/95 backdrop-blur-sm border-gray-200 shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-right">
            {taskId ? "עריכת משימה" : "משימה חדשה"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 mt-4 rtl" dir="rtl">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                כותרת המשימה *
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-white/50"
                placeholder="הזן כותרת למשימה"
              />
              {titleError && (
                <p className="text-red-500 text-sm">{titleError}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                תיאור המשימה
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-white/50 min-h-[100px]"
                placeholder="הזן תיאור למשימה (אופציונלי)"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                סוג תאריך יעד
              </label>
              <Select value={dueDateType} onValueChange={(value: DueDateType) => setDueDateType(value)}>
                <SelectTrigger className="bg-white/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">תאריך ספציפי</SelectItem>
                  <SelectItem value="unknown">לא ידוע</SelectItem>
                  <SelectItem value="urgent">דחוף</SelectItem>
                  <SelectItem value="asap">בהקדם האפשרי</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {dueDateType === "date" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  תאריך יעד
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-right bg-white/50"
                    >
                      <Calendar className="ml-2 h-4 w-4" />
                      {dueDate ? (
                        format(dueDate, "P", { locale: he })
                      ) : (
                        <span className="text-gray-500">בחר תאריך</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={dueDate}
                      onSelect={setDueDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  משימה חוזרת
                </label>
                <Switch
                  checked={isRecurring}
                  onCheckedChange={setIsRecurring}
                />
              </div>
            </div>

            {isRecurring && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  תדירות חזרה
                </label>
                <Select
                  value={recurrencePattern || ""}
                  onValueChange={(value: RecurrencePattern) => setRecurrencePattern(value)}
                >
                  <SelectTrigger className="bg-white/50">
                    <SelectValue placeholder="בחר תדירות" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">יומי</SelectItem>
                    <SelectItem value="weekly">שבועי</SelectItem>
                    <SelectItem value="monthly">חודשי</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                סטטוס המשימה
              </label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="bg-white/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">בהמתנה</SelectItem>
                  <SelectItem value="completed">הושלם</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="hover:bg-gray-100"
            >
              בטל
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? "שומר..." : taskId ? "עדכן" : "שמור"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}