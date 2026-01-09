import { useState, useRef, useEffect } from "react";
import { Send, Bot, User as UserIcon, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function HomePageChatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm your AI assistant powered by Claude. I can help you:\n\n• Create leads from natural language (e.g., 'Michael Morgan, 1/15 @ noon - 1/17 @ 3pm, 2 pax, TEB to LAX, light jet')\n• Search existing leads and data\n• Calculate flight times and distances\n• Answer questions about routes and airports\n\nWhat can I help you with?"
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

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

              // Show toast for successful lead creation
              if (content.includes("✅ Created lead")) {
                toast.success("Lead created successfully!");
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
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea className="h-80 pr-4" ref={scrollRef}>
          {messages.length === 1 ? (
            <div className="space-y-4">
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="rounded-lg px-4 py-3 bg-muted text-foreground max-w-[90%]">
                  <p className="text-sm whitespace-pre-wrap">{messages[0].content}</p>
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
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div
                    className={`rounded-lg px-4 py-3 max-w-[85%] ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
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
            </div>
          )}
        </ScrollArea>

        <div className="flex gap-2">
          <Input
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
