import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Clock, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { Button } from "./ui/button";

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
    staleTime: 0, // Don't cache the data
    cacheTime: 0, // Remove data from cache immediately
  });

  // Cleanup recommendations when component unmounts or when showRecommendations changes to false
  useEffect(() => {
    const cleanup = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await supabase
            .from("recommendations")
            .delete()
            .eq("user_id", session.user.id);
        }
      } catch (error) {
        console.error("Error cleaning up recommendations:", error);
      }
    };

    // Run cleanup when component unmounts or when showRecommendations becomes false
    if (!showRecommendations) {
      cleanup();
    }

    // Also run cleanup when component unmounts
    return () => {
      cleanup();
      setIsCollapsed(true);
    };
  }, [showRecommendations]);

  const handleGetHelp = async () => {
    try {
      await supabase.functions.invoke("generate-recommendations");
      setShowRecommendations(true);
      setIsCollapsed(false);
      refetch();
    } catch (error) {
      console.error("Error generating recommendations:", error);
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
                className="flex items-start gap-3 p-3 rounded-lg bg-white/80"
              >
                {getRecommendationIcon(recommendation.type)}
                <div>
                  <p className="text-gray-800">{recommendation.content}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}