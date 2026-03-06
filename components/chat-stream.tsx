"use client";

import { useChat } from "ai/react";
import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BuyCreditsModal } from "@/components/buy-credits-modal";
import { VoiceInput } from "@/components/voice-input";
import { CostPredictor } from "@/components/cost-predictor";
import { Send, Bot, User, Loader2, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface ChatStreamProps {
  currentCredits: number;
  onCreditsUpdate: (credits: number) => void;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-zinc-700"
    >
      {copied ? (
        <Check className="w-3 h-3 text-green-400" />
      ) : (
        <Copy className="w-3 h-3 text-zinc-500" />
      )}
    </button>
  );
}

function MessageContent({ content }: { content: string }) {
  const parts = content.split(/(```[\s\S]*?```)/g);
  return (
    <div className="space-y-2">
      {parts.map((part, i) => {
        if (part.startsWith("```")) {
          const lines = part.split("\n");
          const lang = lines[0].replace("```", "").trim();
          const code = lines.slice(1, -1).join("\n");
          return (
            <div key={i} className="relative group">
              <div className="flex items-center justify-between px-3 py-1 bg-zinc-900 rounded-t-lg border-b border-zinc-700">
                <span className="text-xs text-zinc-500">{lang || "code"}</span>
                <CopyButton text={code} />
              </div>
              <pre className="bg-zinc-900 p-3 rounded-b-lg overflow-x-auto text-sm font-mono text-zinc-300">
                <code>{code}</code>
              </pre>
            </div>
          );
        }
        return (
          <p key={i} className="text-sm leading-relaxed whitespace-pre-wrap">
            {part}
          </p>
        );
      })}
    </div>
  );
}

export function ChatStream({ currentCredits, onCreditsUpdate }: ChatStreamProps) {
  const [showBuyModal, setShowBuyModal] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading, error, setInput } =
    useChat({
      api: "/api/ai/stream",
      onResponse(response) {
        const remaining = response.headers.get("X-Credits-Remaining");
        if (remaining) onCreditsUpdate(parseInt(remaining));
      },
      onError(err) {
        if (err.message.includes("NO_CREDITS") || err.message.includes("402")) {
          setShowBuyModal(true);
        } else {
          toast.error(err.message || "Failed to get AI response");
        }
      },
    });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    if (currentCredits < 50) {
      setShowBuyModal(true);
      return;
    }
    handleSubmit(e);
  };

  return (
    <>
      <div className="flex flex-col h-full">
        <ScrollArea className="flex-1 p-4" ref={scrollRef as React.RefObject<HTMLDivElement>}>
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-48 text-zinc-600 gap-3">
                <Bot className="w-10 h-10 opacity-40" />
                <div className="text-center">
                  <p className="text-sm font-medium">CodeCraft AI Terminal</p>
                  <p className="text-xs mt-1 opacity-70">
                    Ask me to build anything • 50 credits per message
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2 w-full max-w-sm">
                  {[
                    "Build a REST API with Express",
                    "Create a React dashboard",
                    "Add authentication to my app",
                    "Optimize my database queries",
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setInput(suggestion)}
                      className="text-xs p-2 rounded-lg border border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-400 transition-colors text-left"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <AnimatePresence>
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${m.role === "assistant" ? "" : "flex-row-reverse"}`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                      m.role === "assistant"
                        ? "bg-blue-600"
                        : "bg-zinc-700"
                    }`}
                  >
                    {m.role === "assistant" ? (
                      <Bot className="w-4 h-4 text-white" />
                    ) : (
                      <User className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div
                    className={`group max-w-[85%] rounded-xl px-4 py-3 ${
                      m.role === "assistant"
                        ? "bg-zinc-800/80 text-zinc-100 border border-zinc-700/50"
                        : "bg-blue-600 text-white ml-auto"
                    }`}
                  >
                    <MessageContent content={m.content} />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isLoading && (
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-zinc-800/80 border border-zinc-700/50 rounded-xl px-4 py-3">
                  <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="border-t border-zinc-800 p-4">
          <form onSubmit={onSubmit} className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={handleInputChange}
                placeholder="Ask CodeCraft AI to build something..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 resize-none min-h-[52px] max-h-32"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    onSubmit(e as unknown as React.FormEvent);
                  }
                }}
              />
            </div>
            <VoiceInput
              onTranscript={(text) => setInput((prev) => prev + text)}
              disabled={isLoading}
            />
            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white shrink-0"
              size="icon"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>
          <div className="flex items-center justify-between mt-2 px-1">
            <CostPredictor action="terminalMessage" currentCredits={currentCredits} />
            <span className="text-xs text-zinc-600">⏎ Send • Shift+⏎ New line</span>
          </div>
        </div>
      </div>

      <BuyCreditsModal
        open={showBuyModal}
        onClose={() => setShowBuyModal(false)}
        forceOpen={currentCredits === 0}
      />
    </>
  );
}
