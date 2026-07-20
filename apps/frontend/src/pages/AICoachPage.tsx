import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { Send, Sparkles, Trash2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RieChanAvatar } from '@/components/rie-chan/RieChanAvatar'
import { apiPost } from '@/lib/api'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

type CoachMessage = Pick<Message, 'role' | 'content'>

const CHAT_HISTORY_KEY = 'rie-chan-ai-coach-history'

const markdownComponents = {
  p: ({ children }: { children?: ReactNode }) => (
    <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>
  ),
  strong: ({ children }: { children?: ReactNode }) => <strong className="font-semibold text-white">{children}</strong>,
  em: ({ children }: { children?: ReactNode }) => <em className="italic">{children}</em>,
  ul: ({ children }: { children?: ReactNode }) => <ul className="my-3 ml-5 list-disc space-y-1">{children}</ul>,
  ol: ({ children }: { children?: ReactNode }) => <ol className="my-3 ml-5 list-decimal space-y-1">{children}</ol>,
  li: ({ children }: { children?: ReactNode }) => <li className="leading-relaxed">{children}</li>,
  h1: ({ children }: { children?: ReactNode }) => (
    <h1 className="mb-3 text-base font-semibold text-white">{children}</h1>
  ),
  h2: ({ children }: { children?: ReactNode }) => (
    <h2 className="mb-2 text-sm font-semibold text-white">{children}</h2>
  ),
  h3: ({ children }: { children?: ReactNode }) => (
    <h3 className="mb-2 text-sm font-semibold text-white">{children}</h3>
  ),
  blockquote: ({ children }: { children?: ReactNode }) => (
    <blockquote className="my-3 border-l-2 border-white/30 pl-3 italic text-white/80">{children}</blockquote>
  ),
  code: ({ children }: { children?: ReactNode }) => (
    <code className="rounded bg-black/30 px-1 py-0.5 font-mono text-[0.85em] text-white">{children}</code>
  ),
  pre: ({ children }: { children?: ReactNode }) => (
    <pre className="my-3 overflow-x-auto rounded-xl bg-black/40 p-3 text-xs leading-relaxed text-white">{children}</pre>
  ),
  a: ({ children, href }: { children?: ReactNode; href?: string }) => (
    <a className="text-cyan-200 underline underline-offset-2" href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  ),
}

function createWelcomeMessages(): Message[] {
  return [
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "Hi there! I'm Rie-chan, your personal fitness coach. Ask me about workouts, calories, BMI, body weight targets, recovery, or other non-medical healthy habits.",
      timestamp: new Date().toISOString(),
    },
  ]
}

function isMessageList(value: unknown): value is Message[] {
  if (!Array.isArray(value)) return false

  return value.every((item) => {
    if (!item || typeof item !== 'object') return false
    const message = item as Partial<Message>

    return (
      typeof message.id === 'string' &&
      (message.role === 'user' || message.role === 'assistant') &&
      typeof message.content === 'string' &&
      typeof message.timestamp === 'string'
    )
  })
}

function loadSavedMessages() {
  if (typeof window === 'undefined') {
    return createWelcomeMessages()
  }

  try {
    const raw = window.localStorage.getItem(CHAT_HISTORY_KEY)
    if (!raw) return createWelcomeMessages()

    const parsed = JSON.parse(raw) as unknown
    if (!isMessageList(parsed) || parsed.length === 0) return createWelcomeMessages()

    return parsed
  } catch {
    return createWelcomeMessages()
  }
}

export default function AICoachPage() {
  const [messages, setMessages] = useState<Message[]>(loadSavedMessages)
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages))
  }, [messages])

  const handleClearHistory = () => {
    const welcomeMessages = createWelcomeMessages()
    setMessages(welcomeMessages)

    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(CHAT_HISTORY_KEY)
    }
  }

  const sendPrompt = async (prompt: string) => {
    if (!prompt.trim() || isLoading) return

    const trimmedPrompt = prompt.trim()
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmedPrompt,
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      const conversation: CoachMessage[] = [...messages, userMessage].slice(-12).map((message) => ({
        role: message.role,
        content: message.content,
      }))

      const response = await apiPost<{ reply: string }>('/ai/chat', { prompt: trimmedPrompt, messages: conversation })
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now() + 1}`,
          role: 'assistant',
          content: response.reply,
          timestamp: new Date().toISOString(),
        },
      ])
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "I'm having trouble reaching the backend right now, but keep it up! For training, focus on progressive overload, good form, and enough recovery."

      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now() + 1}`,
          role: 'assistant',
          content: message,
          timestamp: new Date().toISOString(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSend = async () => {
    await sendPrompt(inputValue)
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
        <div className="flex items-center justify-between gap-3">
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

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleClearHistory}
            disabled={isLoading && messages.length <= 1}
            title="Clear chat history"
            aria-label="Clear chat history"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
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
                {message.role === 'assistant' ? (
                  <div className="text-sm whitespace-normal">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                      {message.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                )}
                <p className="text-xs opacity-70 mt-1">
                  {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
              <Button size="icon" onClick={handleSend} disabled={!inputValue.trim() || isLoading}>
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
