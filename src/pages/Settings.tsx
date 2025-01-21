import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Mail, Key, Info, Save, Check, AlertOctagon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function Settings() {
  const [language, setLanguage] = useState("he");
  const [theme, setTheme] = useState("light");
  const [notifications, setNotifications] = useState(true);
  const [openaiKey, setOpenaiKey] = useState("");
  const [isValidatingKey, setIsValidatingKey] = useState(false);
  const [isKeyValid, setIsKeyValid] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          setIsLoading(false);
          return;
        }

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
          setOpenaiKey(data.openai_api_key || '');
          setIsKeyValid(!!data.openai_api_key);
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

  const validateOpenAIKey = async () => {
    setIsValidatingKey(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data, error } = await supabase.functions.invoke('validate-openai-key', {
        body: { apiKey: openaiKey },
      });

      if (error) throw error;

      setIsKeyValid(data.isValid);
      if (data.isValid) {
        toast({
          title: "המפתח תקין",
          description: "מפתח ה-API אומת בהצלחה",
        });
      } else {
        toast({
          variant: "destructive",
          title: "מפתח לא תקין",
          description: "אנא בדוק את המפתח ונסה שוב",
        });
      }
    } catch (error) {
      console.error('Error validating OpenAI key:', error);
      setIsKeyValid(false);
      toast({
        variant: "destructive",
        title: "שגיאה באימות המפתח",
        description: "אנא נסה שוב מאוחר יותר",
      });
    } finally {
      setIsValidatingKey(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { error: upsertError } = await supabase
        .from('user_settings')
        .upsert({
          user_id: session.user.id,
          language,
          theme,
          notifications,
          openai_api_key: openaiKey,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (upsertError) throw upsertError;

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

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label htmlFor="openai-key" className="text-right">מפתח API אישי ל-OpenAI</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-gray-500" />
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        <p>המפתח האישי שלך נדרש להפעלת העוזר האישי. ניתן לקבל מפתח דרך חשבון OpenAI.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex items-center gap-2">
                  {isKeyValid === true && <Check className="h-4 w-4 text-green-500" />}
                  {isKeyValid === false && <AlertOctagon className="h-4 w-4 text-red-500" />}
                </div>
              </div>
              <div className="flex gap-2">
                <Input
                  id="openai-key"
                  type="password"
                  value={openaiKey}
                  onChange={(e) => {
                    setOpenaiKey(e.target.value);
                    setIsKeyValid(null);
                  }}
                  placeholder="הזן כאן את מפתח ה-API שלך"
                  className="text-right"
                />
                <Button
                  variant="outline"
                  onClick={validateOpenAIKey}
                  disabled={!openaiKey || isValidatingKey}
                >
                  {isValidatingKey ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                  ) : (
                    <Key className="h-4 w-4" />
                  )}
                  בדוק
                </Button>
              </div>
            </div>
          </div>

          <div className="pt-6 flex flex-col gap-4">
            <Button onClick={handleSaveSettings} className="w-full">
              <Save className="ml-2 h-4 w-4" />
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