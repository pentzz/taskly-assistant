import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Clock, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";

interface Recommendation {
  id: string;
  content: string;
  type: string;
  reasoning: string | null;
}

const getRecommendationIcon = (type: string) => {
  switch (type) {
    case "urgent":
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    case "overdue":
      return <Clock className="h-5 w-5 text-orange-500" />;
    case "motivation":
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    default:
      return null;
  }
};

export function RecommendationsSection() {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const { toast } = useToast();

  const { data: recommendations, refetch } = useQuery({
    queryKey: ["recommendations"],
    queryFn: async () => {
      const { data: recommendations, error } = await supabase
        .from("recommendations")
        .select("*");

      if (error) {
        console.error("Error fetching recommendations:", error);
        throw error;
      }

      return recommendations as Recommendation[];
    },
    enabled: showRecommendations,
    staleTime: 0,
    gcTime: 0,
  });

  useEffect(() => {
    const cleanup = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.log("No active session found");
          return;
        }

        const { error: deleteError } = await supabase
          .from("recommendations")
          .delete()
          .eq("user_id", session.user.id);

        if (deleteError) {
          console.error("Error deleting recommendations:", deleteError);
          toast({
            variant: "destructive",
            title: "שגיאה במחיקת ההמלצות",
            description: "אנא נסה שוב מאוחר יותר",
          });
        }
      } catch (error) {
        console.error("Error in cleanup:", error);
        toast({
          variant: "destructive",
          title: "שגיאה",
          description: "אירעה שגיאה בעת ניקוי ההמלצות",
        });
      }
    };

    if (!showRecommendations) {
      cleanup();
    }

    return () => {
      setIsCollapsed(true);
    };
  }, [showRecommendations, toast]);

  const handleGetHelp = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          variant: "destructive",
          title: "שגיאה",
          description: "יש להתחבר כדי לקבל המלצות",
        });
        return;
      }

      await supabase.functions.invoke("generate-recommendations");
      setShowRecommendations(true);
      setIsCollapsed(false);
      refetch();
    } catch (error) {
      console.error("Error generating recommendations:", error);
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: "אירעה שגיאה בעת יצירת ההמלצות",
      });
    }
  };

  if (!showRecommendations) {
    return (
      <div className="flex justify-center mb-6">
        <Button 
          onClick={handleGetHelp}
          className="bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          עזור לי לתעדף משימות
        </Button>
      </div>
    );
  }

  if (!recommendations?.length) {
    return null;
  }

  return (
    <Card className="mb-6 bg-gradient-to-br from-purple-50 to-blue-50">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-bold">המלצות העוזר האישי</CardTitle>
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      {!isCollapsed && (
        <CardContent>
          <div className="space-y-4">
            {recommendations.map((recommendation) => (
              <div
                key={recommendation.id}
                className="flex items-start gap-3 p-4 rounded-lg bg-white/80 shadow-sm hover:shadow-md transition-all duration-200"
              >
                {getRecommendationIcon(recommendation.type)}
                <div className="flex-1">
                  {recommendation.content.split('המלצה:').map((part, index) => {
                    if (index === 0) return null;
                    const [recommendation, motivation] = part.split('מוטיבציה:');
                    return (
                      <div key={index} className="space-y-2">
                        <div className="space-y-1">
                          <h4 className="font-semibold text-purple-700">המלצה</h4>
                          <p className="text-gray-800">{recommendation.trim()}</p>
                        </div>
                        {motivation && (
                          <div className="space-y-1">
                            <h4 className="font-semibold text-blue-700">מוטיבציה</h4>
                            <p className="text-gray-800">{motivation.trim()}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}