"use client";

import { useState, useRef, useEffect } from "react";
import { mockChatMessages } from "@/lib/data/chat-messages";
import { GlassCard } from "@/components/ui/GlassCard";
import { cn } from "@/lib/utils/cn";
import { Bot, Send, User } from "lucide-react";
import type { ChatMessage } from "@/lib/types";

const suggestedPrompts = [
  "How do I file a property tax appeal?",
  "What's my potential savings?",
  "Explain comparable sales analysis",
  "When is the appeal deadline?",
];

const mockAiResponses = [
  "Based on comparable properties in your area, your assessment appears to be 15-20% above market value. This suggests a strong case for appeal with potential savings of $1,800-$2,400 annually.",
  "The deadline to file a property tax appeal varies by county. In most Texas counties, you must file by May 15th or within 30 days of receiving your notice, whichever is later.",
  "A comparable sales analysis involves finding 3-5 similar properties that sold recently near your property. We look at square footage, lot size, condition, and location to determine fair market value.",
  "To strengthen your appeal, gather evidence of any property issues: needed repairs, neighborhood factors affecting value, or errors in the assessor's property description.",
  "Our success rate for property tax appeals is 92%. The average savings for our clients is $2,375 per property per year.",
];

function formatMessageTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function AiAssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(mockChatMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const responseIndexRef = useRef(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  function autoResizeTextarea() {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const maxHeight = 4 * 24; // 4 lines approx
      textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
    }
  }

  function sendMessage(text: string) {
    if (!text.trim() || isTyping) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: text.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    // Simulate AI response after delay
    const delay = 1000 + Math.random() * 1000;
    setTimeout(() => {
      const response = mockAiResponses[responseIndexRef.current % mockAiResponses.length];
      responseIndexRef.current += 1;

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        role: "assistant",
        content: response,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);
    }, delay);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  return (
    <div className="mx-auto max-w-4xl flex flex-col h-[calc(100vh-theme(spacing.16))] pt-10 lg:pt-0">
      {/* Header */}
      <GlassCard padding="md" className="flex-shrink-0 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/20">
            <Bot className="h-5 w-5 text-teal-400" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">
              AI Tax Appeal Assistant
            </h1>
            <p className="text-sm text-white/50">
              Ask questions about property tax appeals, assessment analysis, and
              more
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-2 space-y-4 mb-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex gap-3 max-w-[85%]",
              message.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
            )}
          >
            {/* Avatar */}
            {message.role === "assistant" && (
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-teal-500/20 border border-teal-400/30">
                <Bot className="h-4 w-4 text-teal-400" />
              </div>
            )}
            {message.role === "user" && (
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-500/40 to-emerald-500/40 border border-[rgba(255,255,255,0.2)]">
                <User className="h-4 w-4 text-white" />
              </div>
            )}

            {/* Bubble */}
            <div
              className={cn(
                "px-4 py-3",
                message.role === "user"
                  ? "bg-teal-500/20 backdrop-blur-[12px] rounded-2xl rounded-br-md border border-teal-400/20"
                  : "bg-[rgba(255,255,255,0.12)] backdrop-blur-[12px] rounded-2xl rounded-bl-md border border-[rgba(255,255,255,0.1)]"
              )}
            >
              <p className="text-sm text-white/90 whitespace-pre-wrap leading-relaxed">
                {message.content}
              </p>
              <p className="mt-1.5 text-[10px] text-white/30">
                {formatMessageTime(message.timestamp)}
              </p>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex gap-3 mr-auto max-w-[85%]">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-teal-500/20 border border-teal-400/30">
              <Bot className="h-4 w-4 text-teal-400" />
            </div>
            <div className="bg-[rgba(255,255,255,0.12)] backdrop-blur-[12px] rounded-2xl rounded-bl-md border border-[rgba(255,255,255,0.1)] px-4 py-3">
              <div className="flex gap-1">
                <span className="h-2 w-2 rounded-full bg-white/40 animate-bounce [animation-delay:0ms]" />
                <span className="h-2 w-2 rounded-full bg-white/40 animate-bounce [animation-delay:150ms]" />
                <span className="h-2 w-2 rounded-full bg-white/40 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts */}
      <div className="flex-shrink-0 mb-3 flex flex-wrap gap-2 px-2">
        {suggestedPrompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => sendMessage(prompt)}
            disabled={isTyping}
            className="px-3 py-1.5 text-xs font-medium text-white/70 bg-[rgba(255,255,255,0.08)] backdrop-blur-[12px] border border-[rgba(255,255,255,0.1)] rounded-full hover:bg-[rgba(255,255,255,0.15)] hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0">
        <GlassCard padding="sm" className="flex items-end gap-3">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              autoResizeTextarea();
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ask about property tax appeals..."
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm text-white placeholder-white/40 outline-none min-h-[40px] py-2"
            style={{ maxHeight: `${4 * 24}px` }}
          />
          <button
            type="button"
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isTyping}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-r from-teal-500/40 to-emerald-500/40 border border-[rgba(255,255,255,0.2)] text-white hover:from-teal-500/60 hover:to-emerald-500/60 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Send className="h-4 w-4" />
          </button>
        </GlassCard>

        {/* Disclaimer */}
        <p className="mt-2 text-center text-[11px] text-white/30 px-4">
          AI responses are for informational purposes only and do not constitute
          legal or tax advice.
        </p>
      </div>
    </div>
  );
}
