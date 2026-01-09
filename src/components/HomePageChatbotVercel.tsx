import { useChat } from 'ai/react';
import { useEffect, useRef, useState } from 'react';
import { Send, Bot, User as UserIcon, Sparkles, Trash2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { MessageContent } from './MessageContent';

const STORAGE_KEY = 'homepage-chatbot-messages';

const initialMessage = {
  id: 'initial',
  role: 'assistant' as const,
  content: `Hi! I'm your AI assistant powered by Claude via Vercel AI SDK. I can help you:

• Create leads from natural language (e.g., 'Michael Morgan, 1/15 @ noon - 1/17 @ 3pm, 2 pax, TEB to LAX, light jet')
• Search existing leads and data
• Calculate flight times and distances
• Answer questions about routes and airports
• Find and send quote requests to operators

What can I help you with?`,
};

export function HomePageChatbotVercel() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages } = useChat({
    api: '/api/chat',
    initialMessages: [initialMessage],
    onResponse: (response) => {
      if (!response.ok) {
        if (response.status === 429) {
          toast.error('Rate limit exceeded. Please try again in a moment.');
        } else if (response.status === 402) {
          toast.error('AI credits depleted. Please contact support.');
        } else {
          toast.error('Something went wrong. Please try again.');
        }
      }
    },
    onError: (error) => {
      console.error('Chat error:', error);
      toast.error('Failed to send message. Please try again.');
    },
    onFinish: () => {
      // Refocus input after response completes
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    },
  });

  // Load messages from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      }
    } catch (error) {
      console.error('Failed to load saved messages:', error);
    }
  }, [setMessages]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
      } catch (error) {
        console.error('Failed to save messages:', error);
      }
    }
  }, [messages]);

  // Scroll to bottom whenever messages change or loading state changes
  useEffect(() => {
    const scrollToBottom = () => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    };

    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [messages, isLoading]);

  const clearConversation = () => {
    setMessages([initialMessage]);
    localStorage.removeItem(STORAGE_KEY);
    toast.success('Conversation cleared');
  };

  const copyMessage = (content: string, index: number) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    handleSubmit(e);
  };

  const quickActions = [
    {
      icon: Sparkles,
      label: 'Create Lead',
      example: 'Michael Morgan, 1/15 @ noon - 1/17 @ 3pm, 2 pax, TEB to LAX, light jet',
    },
    {
      icon: Bot,
      label: 'Search Leads',
      example: 'Show me all leads from last week',
    },
  ];

  return (
    <Card className="w-full shadow-lg border-2">
      <CardHeader className="pb-4 bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <Bot className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">AI Assistant</CardTitle>
              <CardDescription>Powered by Claude • Vercel AI SDK</CardDescription>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={clearConversation} className="gap-2">
            <Trash2 className="w-4 h-4" />
            Clear
          </Button>
        </div>

        <div className="flex gap-2 mt-4 flex-wrap">
          {quickActions.map((action, idx) => (
            <Badge
              key={idx}
              variant="secondary"
              className="cursor-pointer hover:bg-secondary/80 transition-colors gap-1.5 py-1.5"
              onClick={() => {
                const syntheticEvent = {
                  preventDefault: () => {},
                  currentTarget: document.createElement('form'),
                } as React.FormEvent<HTMLFormElement>;
                handleInputChange({
                  target: { value: action.example },
                } as React.ChangeEvent<HTMLInputElement>);
                setTimeout(() => handleSubmit(syntheticEvent), 0);
              }}
            >
              <action.icon className="w-3 h-3" />
              {action.label}
            </Badge>
          ))}
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Messages Area */}
        <div className="relative h-80 overflow-hidden rounded-lg border">
          <div
            className="h-full overflow-y-auto pr-4 scroll-smooth"
            style={{ scrollBehavior: 'smooth' }}
          >
            {messages.map((message, index) => (
              <div
                key={message.id || index}
                className={`flex gap-3 mb-4 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-primary" />
                  </div>
                )}

                <div
                  className={`flex flex-col gap-1 max-w-[80%] ${
                    message.role === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`rounded-lg px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <MessageContent content={message.content} />
                  </div>

                  {message.role === 'assistant' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs gap-1.5"
                      onClick={() => copyMessage(message.content, index)}
                    >
                      {copiedIndex === index ? (
                        <>
                          <Check className="w-3 h-3" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Copy
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {message.role === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-accent-foreground" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 mb-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
                <div className="bg-muted rounded-lg px-4 py-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <form onSubmit={handleFormSubmit} className="mt-4 flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            placeholder="Type your message... (e.g., 'John Smith, 1/20 @ 3pm, LAX to JFK, 4 pax')"
            disabled={isLoading}
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleFormSubmit(e as any);
              }
            }}
          />
          <Button type="submit" disabled={isLoading || !input.trim()} size="icon">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
