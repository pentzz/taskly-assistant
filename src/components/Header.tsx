import { LogOut } from "lucide-react";
import { Button } from "./ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export function Header() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/login");
      toast({
        title: "התנתקת בהצלחה",
        description: "להתראות! מקווים לראותך שוב בקרוב",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "שגיאה בהתנתקות",
        description: "אנא נסה שוב מאוחר יותר",
      });
    }
  };

  return (
    <header className="glass-morphism fixed top-0 left-0 right-0 z-50 px-6 py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Button
          variant="ghost"
          className="button-hover text-gray-600 hover:text-gray-900"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5 ml-2 rtl-flip" />
          התנתק
        </Button>
        
        <div className="flex items-center">
          <h1 className="text-2xl font-rubik font-bold text-gray-800">
            Taskly Assistant
          </h1>
          <img
            src="/logo.svg"
            alt="Taskly Assistant Logo"
            className="h-8 w-8 mr-3"
          />
        </div>
      </div>
    </header>
  );
}