import { useState, useEffect } from "react"
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
import { Loader2, Bot, Send } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Message {
  role: 'assistant' | 'user'
  content: string
}

interface AIAssistantModalProps {
  tasks?: any[]
  onEditTask?: (taskId: string) => void
  onCompleteTask?: (taskId: string) => void
}

export function AIAssistantModal({ tasks, onEditTask, onCompleteTask }: AIAssistantModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [userName, setUserName] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const storedName = localStorage.getItem('userName')
    setUserName(storedName)

    if (!storedName && isOpen) {
      handleInitialGreeting()
    }
  }, [isOpen])

  const handleInitialGreeting = async () => {
    setIsLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error("No session")

      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          prompt: "הצג את עצמך ושאל את המשתמש מה שמו",
          type: 'initial',
        },
      })

      if (error) throw error
      setMessages([{ role: 'assistant', content: data.response }])
    } catch (error) {
      console.error('Error:', error)
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: "אירעה שגיאה בעת יצירת הקשר עם העוזר האישי",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!input.trim()) return

    const userMessage = input
    setInput("")
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error("No session")

      if (!userName && messages.length === 1) {
        const name = userMessage.replace(/[^א-ת\sa-zA-Z]/g, '').trim()
        if (name) {
          localStorage.setItem('userName', name)
          setUserName(name)
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: `נעים מאוד ${name}! אני כאן כדי לעזור לך עם המשימות שלך. מה תרצה לדעת?` 
          }])
          setIsLoading(false)
          return
        }
      }

      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          prompt: userMessage,
          type: 'tasks',
          taskData: tasks,
          userName,
        },
      })

      if (error) throw error
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-gradient-to-r from-violet-300 to-indigo-300 hover:scale-105"
          size="icon"
        >
          <Bot className="h-6 w-6 text-gray-700" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-gradient-to-br from-violet-50/90 to-indigo-50/90 backdrop-blur-xl border-gray-200">
        <DialogHeader>
          <DialogTitle className="text-right text-xl font-bold text-gray-700">
            עוזר אישי חכם
          </DialogTitle>
          <DialogDescription className="text-right text-gray-600">
            {userName ? `שלום ${userName}! ` : ''}אני כאן לעזור לך לנהל את המשימות שלך ביעילות
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 mt-4">
          <ScrollArea className="h-[300px] pl-4">
            <div className="flex flex-col gap-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-violet-100 border border-violet-200'
                        : 'bg-indigo-100 border border-indigo-200'
                    }`}
                  >
                    <p
                      className="text-right whitespace-pre-wrap text-gray-700 leading-relaxed"
                      style={{ direction: 'rtl' }}
                      dangerouslySetInnerHTML={{ 
                        __html: message.content
                          .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
                          .replace(/([!?:.])/g, '$1&lrm;')
                      }}
                    />
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-indigo-100 border border-indigo-200 p-3 rounded-lg">
                    <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="flex gap-2">
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !input.trim()}
              className="px-3 bg-gradient-to-r from-violet-400 to-indigo-400 hover:from-violet-500 hover:to-indigo-500 text-white"
            >
              <Send className="h-4 w-4" />
            </Button>
            <Textarea
              dir="rtl"
              placeholder="מה ברצונך לשאול?"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="min-h-[80px] bg-white/50 border-gray-200 focus:border-violet-400 transition-colors"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}