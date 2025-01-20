import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Clock } from "lucide-react";

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
  });

  useEffect(() => {
    const generateRecommendations = async () => {
      try {
        await supabase.functions.invoke("generate-recommendations");
        refetch();
      } catch (error) {
        console.error("Error generating recommendations:", error);
      }
    };

    generateRecommendations();
  }, [refetch]);

  if (!recommendations?.length) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-xl font-bold">המלצות העוזר האישי</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recommendations.map((recommendation) => (
            <div
              key={recommendation.id}
              className="flex items-start gap-3 p-3 rounded-lg bg-gray-50"
            >
              {getRecommendationIcon(recommendation.type)}
              <div>
                <p className="text-gray-800">{recommendation.content}</p>
                {recommendation.reasoning && (
                  <p className="text-sm text-gray-500 mt-1">
                    {recommendation.reasoning}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}