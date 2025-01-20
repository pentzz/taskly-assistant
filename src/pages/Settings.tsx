import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function Settings() {
  const [language, setLanguage] = useState("he");
  const [theme, setTheme] = useState("light");
  const [notifications, setNotifications] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        const { data, error } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setLanguage(data.language || 'he');
          setTheme(data.theme || 'light');
          setNotifications(data.notifications ?? true);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        toast({
          variant: "destructive",
          title: "שגיאה בטעינת ההגדרות",
          description: "אנא נסה שוב מאוחר יותר",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [toast]);

  const handleSaveSettings = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      // First check if settings exist for this user
      const { data: existingSettings } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', session.user.id)
        .maybeSingle();

      let error;
      
      if (existingSettings) {
        // Update existing settings
        const { error: updateError } = await supabase
          .from('user_settings')
          .update({
            language,
            theme,
            notifications,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', session.user.id);
        error = updateError;
      } else {
        // Insert new settings
        const { error: insertError } = await supabase
          .from('user_settings')
          .insert({
            user_id: session.user.id,
            language,
            theme,
            notifications,
            updated_at: new Date().toISOString(),
          });
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: "ההגדרות נשמרו בהצלחה",
        description: "השינויים שביצעת נשמרו במערכת",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        variant: "destructive",
        title: "שגיאה בשמירת ההגדרות",
        description: "אנא נסה שוב מאוחר יותר",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Header />
      
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900">הגדרות</h1>
        </div>

        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="language" className="text-right">שפת ממשק</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="he">עברית</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="theme" className="text-right">מצב תצוגה</Label>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">בהיר</SelectItem>
                  <SelectItem value="dark">כהה</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="notifications" className="text-right">התראות</Label>
              <Switch
                id="notifications"
                checked={notifications}
                onCheckedChange={setNotifications}
              />
            </div>
          </div>

          <div className="pt-6 flex flex-col gap-4">
            <Button onClick={handleSaveSettings} className="w-full">
              שמור הגדרות
            </Button>
            
            <Button
              variant="outline"
              onClick={() => window.location.href = "mailto:support@taskly.com?subject=תמיכה%20ב-Taskly%20Assistant"}
              className="w-full"
            >
              <Mail className="ml-2 h-4 w-4" />
              צור קשר
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}