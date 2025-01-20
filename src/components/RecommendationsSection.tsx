import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { RefreshCw, ChevronDown, ChevronUp, Info } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

interface Recommendation {
  id: string
  content: string
  reasoning?: string
  type: string
}

export function RecommendationsSection() {
  const [isOpen, setIsOpen] = useState(true)
  const [expandedRecommendations, setExpandedRecommendations] = useState<string[]>([])

  const { data: recommendations, refetch, isLoading } = useQuery({
    queryKey: ['recommendations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recommendations')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Recommendation[]
    },
  })

  const toggleRecommendation = (id: string) => {
    setExpandedRecommendations(prev =>
      prev.includes(id)
        ? prev.filter(recId => recId !== id)
        : [...prev, id]
    )
  }

  return (
    <Card className="p-6 mb-8 glass-morphism bg-gradient-to-br from-violet-50/90 to-indigo-50/90">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex justify-between items-center mb-4">
          <Button
            onClick={() => refetch()}
            variant="ghost"
            size="icon"
            className="hover:bg-violet-100"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 text-violet-600 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 text-lg font-semibold text-gray-700 hover:text-violet-700 transition-colors"
            >
              המלצות העוזר האישי
              {isOpen ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </Button>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent className="space-y-4 animate-accordion-down">
          {recommendations?.map((rec) => (
            <div
              key={rec.id}
              className="p-4 rounded-lg bg-white/50 border border-gray-200 hover:border-violet-200 transition-colors"
            >
              <div className="flex justify-between items-start gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="mt-1 hover:bg-violet-100"
                  onClick={() => toggleRecommendation(rec.id)}
                >
                  <Info className="h-4 w-4 text-violet-600" />
                </Button>
                <p className="text-right text-gray-700 leading-relaxed" style={{ direction: 'rtl' }}>
                  {rec.content}
                </p>
              </div>
              
              {expandedRecommendations.includes(rec.id) && rec.reasoning && (
                <div className="mt-4 p-3 rounded-lg bg-violet-50 border border-violet-100">
                  <p className="text-right text-gray-600 text-sm leading-relaxed" style={{ direction: 'rtl' }}>
                    {rec.reasoning}
                  </p>
                </div>
              )}
            </div>
          ))}

          {(!recommendations || recommendations.length === 0) && (
            <p className="text-center text-gray-500">אין המלצות חדשות כרגע</p>
          )}
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}