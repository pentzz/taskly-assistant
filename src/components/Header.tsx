import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { LogOut, Menu, X, Settings, Info, Home, Archive } from "lucide-react";
import { Button } from "./ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

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

  const menuItems = [
    { label: "לוח מחוונים", path: "/", icon: Home },
    { label: "ארכיון משימות", path: "/archive", icon: Archive },
    { label: "אודות", path: "/about", icon: Info },
    { label: "הגדרות", path: "/settings", icon: Settings },
  ];

  const NavLink = ({ item }: { item: typeof menuItems[0] }) => {
    const isActive = location.pathname === item.path;
    const Icon = item.icon;

    return (
      <Link
        to={item.path}
        className={`flex items-center px-4 py-2 rounded-md transition-colors ${
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-gray-600 hover:bg-gray-100"
        }`}
        onClick={() => setIsOpen(false)}
      >
        <Icon className="h-5 w-5 ml-2 rtl-flip" />
        {item.label}
      </Link>
    );
  };

  return (
    <header className="glass-morphism fixed top-0 left-0 right-0 z-50 px-6 py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-4">
          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <SheetHeader>
                <SheetTitle className="text-right">תפריט</SheetTitle>
              </SheetHeader>
              <nav className="mt-8 flex flex-col gap-2">
                {menuItems.map((item) => (
                  <NavLink key={item.path} item={item} />
                ))}
                <Button
                  variant="ghost"
                  className="flex items-center justify-start px-4 py-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={handleLogout}
                >
                  <LogOut className="h-5 w-5 ml-2 rtl-flip" />
                  התנתקות
                </Button>
              </nav>
            </SheetContent>
          </Sheet>

          {/* Desktop Menu */}
          <nav className="hidden lg:flex items-center gap-2">
            {menuItems.map((item) => (
              <NavLink key={item.path} item={item} />
            ))}
            <Button
              variant="ghost"
              className="text-gray-600 hover:text-gray-900"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5 ml-2 rtl-flip" />
              התנתקות
            </Button>
          </nav>
        </div>
        
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