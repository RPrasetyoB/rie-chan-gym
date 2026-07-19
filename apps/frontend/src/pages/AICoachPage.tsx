import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import { Send, Sparkles } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RieChanAvatar } from '@/components/rie-chan/RieChanAvatar'
import { apiPost } from '@/lib/api'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function AICoachPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        "Hi there! I'm Rie-chan, your personal fitness coach! How can I help you today? Ask me anything about workouts, nutrition, or fitness tips!",
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return

    const prompt = inputValue
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: prompt,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      const response = await apiPost<{ reply: string }>('/ai/chat', { prompt })
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now() + 1}`,
          role: 'assistant',
          content: response.reply,
          timestamp: new Date(),
        },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now() + 1}`,
          role: 'assistant',
          content:
            "I'm having trouble reaching the backend right now, but keep it up! For training, focus on progressive overload, good form, and enough recovery.",
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="min-h-[calc(100dvh-5rem)] flex flex-col max-w-lg mx-auto">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <RieChanAvatar size={40} feature="coach" />
          <div>
            <h1 className="font-display font-bold">Rie-chan AI Coach</h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Your personal fitness assistant
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="min-h-full p-4 flex flex-col justify-end gap-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && <RieChanAvatar size={32} feature="coach" />}
              <div
                className={`max-w-[80%] rounded-2xl p-3 ${
                  message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <RieChanAvatar size={32} feature="coach" />
              <div className="bg-secondary rounded-2xl p-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                  <div
                    className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: '0.1s' }}
                  />
                  <div
                    className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: '0.2s' }}
                  />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="p-4 border-t border-border safe-area-bottom">
        <Card>
          <CardContent className="p-2">
            <div className="flex gap-2">
              <Input
                placeholder="Ask Rie-chan anything..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
        <p className="text-xs text-muted-foreground text-center mt-2">
          AI responses are for guidance only. Consult a healthcare professional for medical advice.
        </p>
      </div>
    </div>
  )
}
