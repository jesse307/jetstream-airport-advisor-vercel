import { useState, useRef, useEffect } from "react";
import { Send, Bot, User as UserIcon, Sparkles, Trash2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { MessageContent } from "./MessageContent";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const STORAGE_KEY = "homepage-chatbot-messages";

const initialMessage: Message = {
  role: "assistant",
  content: "Hi! I'm your AI assistant powered by Claude. I can help you:\n\n• Create leads from natural language (e.g., 'Michael Morgan, 1/15 @ noon - 1/17 @ 3pm, 2 pax, TEB to LAX, light jet')\n• Search existing leads and data\n• Calculate flight times and distances\n• Answer questions about routes and airports\n\nWhat can I help you with?"
};

export function HomePageChatbot() {
  const [messages, setMessages] = useState<Message[]>(() => {
    // Load messages from localStorage on mount
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) && parsed.length > 0 ? parsed : [initialMessage];
      }
    } catch (error) {
      console.error("Failed to load saved messages:", error);
    }
    return [initialMessage];
  });
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (error) {
      console.error("Failed to save messages:", error);
    }
  }, [messages]);

  // Scroll to bottom whenever messages change or loading state changes
  useEffect(() => {
    const scrollToBottom = () => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    };

    // Use setTimeout to ensure DOM has updated
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [messages, isLoading]);

  const clearConversation = () => {
    setMessages([initialMessage]);
    localStorage.removeItem(STORAGE_KEY);
    toast.success("Conversation cleared");
  };

  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyMessage = (content: string, index: number) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Refocus input after sending
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);

    let assistantContent = "";

    const upsertAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: assistantContent } : m
          );
        }
        return [...prev, { role: "assistant", content: assistantContent }];
      });
    };

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/claude-autonomous-chat`;
      console.log("Sending message to:", CHAT_URL);
      console.log("Messages:", [...messages, userMessage]);

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMessage]
        }),
      });

      if (resp.status === 429) {
        toast.error("Rate limit exceeded. Please wait a moment.");
        setIsLoading(false);
        return;
      }

      if (resp.status === 402) {
        toast.error("AI credits depleted. Please add credits to continue.");
        setIsLoading(false);
        return;
      }

      if (!resp.ok || !resp.body) {
        const errorText = await resp.text();
        console.error("API Error:", {
          status: resp.status,
          statusText: resp.statusText,
          error: errorText
        });

        if (resp.status === 404) {
          toast.error("Edge Function not deployed. Please deploy claude-autonomous-chat function.");
        } else if (resp.status === 500) {
          toast.error(`Server error: ${errorText.slice(0, 100)}`);
        } else {
          toast.error(`API error (${resp.status}): ${errorText.slice(0, 100)}`);
        }

        setIsLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;

            if (content) {
              upsertAssistant(content);

              // Show toast for successful account creation
              if (content.includes("✅ Created account and opportunity")) {
                toast.success("Account and opportunity created successfully!");
              }
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Process any remaining buffer
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch { /* ignore */ }
        }
      }

    } catch (error) {
      console.error("Chat error:", error);
      toast.error("Failed to send message. Please try again.");
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    {
      label: "Create Lead",
      example: "Michael Morgan, 1/20 @ 9am - 1/22 @ 5pm, 4 pax, JFK to LAX, mid jet"
    },
    {
      label: "Search Leads",
      example: "Show me leads from last week"
    },
    {
      label: "Calculate Flight",
      example: "How long is the flight from TEB to MIA?"
    }
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                AI Assistant
                <Badge variant="secondary" className="text-xs">
                  Claude
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Autonomous natural language interface
              </CardDescription>
            </div>
          </div>
          {messages.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearConversation}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative h-80 overflow-hidden rounded-lg border">
          <div
            ref={scrollAreaRef}
            className="h-full overflow-y-auto pr-4 scroll-smooth"
            style={{ scrollBehavior: 'smooth' }}
          >
            {messages.length === 1 ? (
              <div className="space-y-4 p-4">
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="rounded-lg px-4 py-3 bg-muted text-foreground max-w-[90%]">
                    <div className="text-sm">
                      <MessageContent content={messages[0].content} />
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-2 mt-4">
                  <p className="text-xs text-muted-foreground font-medium px-2">Quick examples:</p>
                  {quickActions.map((action, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInput(action.example)}
                      className="w-full text-left p-3 rounded-lg border border-border hover:bg-accent hover:border-primary/50 transition-all text-sm group"
                    >
                      <div className="font-medium text-foreground group-hover:text-primary mb-1">
                        {action.label}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        "{action.example}"
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4 p-4">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-3 group ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role === "assistant" && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div className="flex flex-col max-w-[85%]">
                      <div
                        className={`rounded-lg px-4 py-3 ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground"
                        }`}
                      >
                        <div className="text-sm">
                          {msg.role === "assistant" ? (
                            <MessageContent content={msg.content} />
                          ) : (
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                          )}
                        </div>
                      </div>
                      {msg.role === "assistant" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyMessage(msg.content, idx)}
                          className="self-start mt-1 h-6 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          {copiedIndex === idx ? (
                            <>
                              <Check className="w-3 h-3 mr-1" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 mr-1" />
                              Copy
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                    {msg.role === "user" && (
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                        <UserIcon className="w-4 h-4 text-secondary-foreground" />
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-white animate-pulse" />
                    </div>
                    <div className="rounded-lg px-4 py-3 bg-muted text-foreground">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}
                {/* Invisible element to scroll to */}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="e.g., 'Create lead: John Smith, 2 pax, JFK to LAX on 1/20 @ 9am, light jet'"
            disabled={isLoading}
            className="flex-1"
          />
          <Button onClick={sendMessage} disabled={isLoading || !input.trim()} size="icon">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
