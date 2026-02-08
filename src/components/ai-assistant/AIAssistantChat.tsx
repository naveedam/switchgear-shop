import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Trash2, Bot, User, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useAIAssistant } from '@/hooks/useAIAssistant';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

interface AIAssistantChatProps {
  onClose: () => void;
}

const QUICK_PROMPTS = {
  buyer: [
    "How do I upload a BOM?",
    "Help me find circuit breakers",
    "Explain the RFQ process",
    "How does multi-seller ordering work?",
  ],
  seller: [
    "How do I add products?",
    "Explain the settlement process",
    "How do I respond to RFQs?",
    "What are bulk upload requirements?",
  ],
  guest: [
    "What is SwitchgearShop?",
    "How do I register as a seller?",
    "What products do you offer?",
    "How does the platform work?",
  ],
};

const AIAssistantChat: React.FC<AIAssistantChatProps> = ({ onClose }) => {
  const [input, setInput] = useState('');
  const { user } = useAuth();
  const { messages, isLoading, sendMessage, clearMessages } = useAIAssistant();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const userRole = user?.role || 'guest';
  const prompts = QUICK_PROMPTS[userRole as keyof typeof QUICK_PROMPTS] || QUICK_PROMPTS.guest;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim());
    setInput('');
  };

  const handleQuickPrompt = (prompt: string) => {
    sendMessage(prompt);
  };

  const getRoleBadge = () => {
    if (!user) return <Badge variant="secondary">Guest</Badge>;
    if (user.role === 'seller') return <Badge variant="default" className="bg-emerald-600">Seller</Badge>;
    if (user.role === 'buyer') return <Badge variant="default">Buyer</Badge>;
    if (user.role === 'admin') return <Badge variant="default" className="bg-violet-600">Admin</Badge>;
    return <Badge variant="secondary">User</Badge>;
  };

  return (
    <Card className="shadow-2xl border-2 border-border/50 overflow-hidden">
      {/* Header */}
      <CardHeader className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">AI Assistant</CardTitle>
              <p className="text-xs text-muted-foreground">SwitchgearShop Helper</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getRoleBadge()}
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={clearMessages}
                title="Clear chat"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Messages Area */}
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]" ref={scrollRef}>
          <div className="p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="space-y-4">
                <div className="text-center py-6">
                  <Bot className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Hi{user?.name ? `, ${user.name}` : ''}! I'm here to help you with SwitchgearShop.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {userRole === 'seller'
                      ? 'Ask me about inventory, RFQs, or settlements'
                      : userRole === 'buyer'
                      ? 'Ask me about products, BOMs, or orders'
                      : 'Ask me about our platform or how to get started'}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Quick questions:</p>
                  <div className="flex flex-wrap gap-2">
                    {prompts.map((prompt) => (
                      <Button
                        key={prompt}
                        variant="outline"
                        size="sm"
                        className="text-xs h-auto py-1.5 px-3"
                        onClick={() => handleQuickPrompt(prompt)}
                        disabled={isLoading}
                      >
                        {prompt}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex gap-3",
                    message.role === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  {message.role === 'assistant' && (
                    <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                      message.role === 'user'
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    {message.role === 'assistant' ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                            ul: ({ children }) => <ul className="mb-2 ml-4 list-disc">{children}</ul>,
                            ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal">{children}</ol>,
                            li: ({ children }) => <li className="mb-1">{children}</li>,
                            strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                            a: ({ href, children }) => (
                              <a href={href} className="text-primary underline" target="_blank" rel="noopener noreferrer">
                                {children}
                              </a>
                            ),
                            code: ({ children }) => (
                              <code className="bg-background/50 px-1 py-0.5 rounded text-xs">{children}</code>
                            ),
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      message.content
                    )}
                  </div>
                  {message.role === 'user' && (
                    <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))
            )}

            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex gap-3">
                <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-muted rounded-lg px-3 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 border-t bg-background">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your question..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={!input.trim() || isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIAssistantChat;
