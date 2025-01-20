import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Bot } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface AIAssistantModalProps {
  tasks?: any[]
}

export function AIAssistantModal({ tasks }: AIAssistantModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState("")
  const [response, setResponse] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async () => {
    if (!input.trim()) return

    setIsLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error("No session")

      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          prompt: input,
          type: 'general',
          taskData: tasks,
        },
      })

      if (error) throw error
      setResponse(data.response)
    } catch (error) {
      console.error('Error:', error)
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: "אירעה שגיאה בעת עיבוד הבקשה",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-gradient-to-r from-purple-600 to-blue-600 hover:scale-105"
          size="icon"
        >
          <Bot className="h-6 w-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-black/40 backdrop-blur-xl border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-right text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
            עוזר אישי חכם
          </DialogTitle>
          <DialogDescription className="text-right text-gray-400">
            אני כאן לעזור לך לנהל את המשימות שלך ביעילות
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 mt-4">
          <Textarea
            dir="rtl"
            placeholder="מה ברצונך לשאול?"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[100px] bg-black/20 border-gray-700 focus:border-purple-500 transition-colors"
          />
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !input.trim()}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "שלח"
            )}
          </Button>
          {response && (
            <div className="mt-4 p-4 rounded-lg bg-black/20 border border-gray-700">
              <p className="text-right whitespace-pre-wrap text-gray-200">{response}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}