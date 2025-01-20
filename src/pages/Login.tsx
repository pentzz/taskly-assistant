import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Login = () => {
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        navigate("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">ברוכים הבאים</h1>
          <p className="text-muted-foreground">התחברו למערכת כדי להמשיך</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="bg-card p-6 rounded-lg border shadow-sm">
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: 'hsl(var(--primary))',
                    brandAccent: 'hsl(var(--primary))',
                  },
                },
              },
              className: {
                container: 'w-full',
                button: 'w-full',
                input: 'rounded-md text-right',
                label: 'text-right block',
              },
            }}
            localization={{
              variables: {
                sign_in: {
                  email_label: 'דואר אלקטרוני',
                  password_label: 'סיסמה',
                  button_label: 'התחברות',
                  loading_button_label: 'מתחבר...',
                  social_provider_text: 'התחבר באמצעות',
                  link_text: 'יש לך כבר חשבון? התחבר',
                },
                sign_up: {
                  email_label: 'דואר אלקטרוני',
                  password_label: 'סיסמה',
                  button_label: 'הרשמה',
                  loading_button_label: 'נרשם...',
                  social_provider_text: 'הירשם באמצעות',
                  link_text: 'אין לך חשבון? הירשם',
                },
              },
            }}
            theme="dark"
            providers={[]}
          />
        </div>
      </div>
    </div>
  );
};

export default Login;