"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChatStream } from "@/components/chat-stream";
import { WebContainerPreview } from "@/components/webcontainer-preview";
import { AgentStatus } from "@/components/agent-status";
import { BuyCreditsModal } from "@/components/buy-credits-modal";
import { CreditWallet } from "@/components/credit-wallet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AgentUpdate, AgentStage } from "@/lib/codecraft-graph";
import {
  Zap,
  ChevronLeft,
  Bot,
  Loader2,
  Terminal,
  Eye,
  PlayCircle,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

type Tab = "chat" | "preview" | "agent";

export default function AITerminalPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [credits, setCredits] = useState(0);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("chat");
  const [agentUpdates, setAgentUpdates] = useState<AgentUpdate[]>([]);
  const [agentStage, setAgentStage] = useState<AgentStage | null>(null);
  const [agentRunning, setAgentRunning] = useState(false);
  const [agentPrompt, setAgentPrompt] = useState("");
  const [generatedFiles, setGeneratedFiles] = useState<Record<string, string>>(
    {}
  );

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.credits !== undefined) {
      setCredits(session.user.credits);
    }
  }, [session]);

  useEffect(() => {
    const fetchCredits = async () => {
      const res = await fetch("/api/credits/balance");
      if (res.ok) {
        const data = await res.json();
        setCredits(data.credits);
      }
    };
    if (session?.user?.id) fetchCredits();
  }, [session]);

  const runAgentPipeline = async () => {
    if (!agentPrompt.trim()) {
      toast.error("Enter a prompt first");
      return;
    }
    if (credits < 2000) {
      setShowBuyModal(true);
      return;
    }

    setAgentRunning(true);
    setAgentUpdates([]);
    setAgentStage("router");

    try {
      const res = await fetch("/api/ai/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: agentPrompt }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (data.code === "NO_CREDITS") {
          setShowBuyModal(true);
        } else {
          toast.error(data.error ?? "Agent run failed");
        }
        setAgentRunning(false);
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error("No response body");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const lines = decoder.decode(value).split("\n").filter(Boolean);
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.type === "final") {
              const remaining = res.headers.get("X-Credits-Remaining");
              if (remaining) setCredits(parseInt(remaining));
              if (data.state?.code) {
                setGeneratedFiles(data.state.code);
              }
              toast.success("Agent run complete!");
            } else if (data.type === "error") {
              toast.error(data.message);
            } else {
              setAgentUpdates((prev) => [...prev, data as AgentUpdate]);
              setAgentStage(data.stage);
            }
          } catch {}
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Agent run failed");
    } finally {
      setAgentRunning(false);
      setAgentStage("complete");
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!session) return null;

  const TABS = [
    { id: "chat" as Tab, label: "Chat", icon: Terminal },
    { id: "preview" as Tab, label: "Preview", icon: Eye },
    { id: "agent" as Tab, label: "Agent", icon: Bot },
  ];

  return (
    <>
      <div className="h-screen bg-zinc-950 flex flex-col overflow-hidden">
        <header className="border-b border-zinc-900 px-4 py-3 flex items-center gap-4 shrink-0">
          <Link href="/dashboard">
            <Button
              variant="ghost"
              size="sm"
              className="text-zinc-500 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Dashboard
            </Button>
          </Link>

          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-white text-sm">
              AI Terminal
            </span>
          </div>

          <div className="flex items-center bg-zinc-900 rounded-lg p-1 gap-1 ml-4">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    activeTab === tab.id
                      ? "bg-zinc-800 text-white"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="ml-auto">
            <CreditWallet initialCredits={credits} compact />
          </div>
        </header>

        <div className="flex-1 overflow-hidden">
          {activeTab === "chat" && (
            <ChatStream
              currentCredits={credits}
              onCreditsUpdate={setCredits}
            />
          )}

          {activeTab === "preview" && (
            <div className="h-full p-4">
              <WebContainerPreview
                files={
                  Object.keys(generatedFiles).length > 0
                    ? generatedFiles
                    : undefined
                }
                currentCredits={credits}
                onCreditsUpdate={setCredits}
              />
            </div>
          )}

          {activeTab === "agent" && (
            <div className="h-full p-4 space-y-4 overflow-y-auto">
              <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-medium text-white">
                    Multi-Agent Pipeline
                  </h2>
                  <Badge
                    variant="outline"
                    className="text-xs border-zinc-700 text-zinc-500"
                  >
                    2000cr/run
                  </Badge>
                </div>
                <p className="text-xs text-zinc-500 mb-4">
                  Router → Planner → Coder → Critic → Deploy. Full app
                  scaffolding from a single prompt.
                </p>
                <textarea
                  value={agentPrompt}
                  onChange={(e) => setAgentPrompt(e.target.value)}
                  placeholder="Describe the app you want to build..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 resize-none min-h-[100px]"
                />
                <Button
                  onClick={runAgentPipeline}
                  disabled={agentRunning || !agentPrompt.trim()}
                  className="mt-3 w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {agentRunning ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Running Pipeline...
                    </>
                  ) : (
                    <>
                      <PlayCircle className="w-4 h-4 mr-2" />
                      Run Agent (2000cr)
                    </>
                  )}
                </Button>
              </div>

              {(agentUpdates.length > 0 || agentStage) && (
                <AgentStatus
                  updates={agentUpdates}
                  currentStage={agentStage}
                  isRunning={agentRunning}
                />
              )}

              {Object.keys(generatedFiles).length > 0 && (
                <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
                  <h3 className="text-sm font-medium text-white mb-3">
                    Generated Files
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(generatedFiles).map(([path, content]) => (
                      <details key={path} className="group">
                        <summary className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-zinc-800 text-sm">
                          <span className="text-zinc-400 font-mono">{path}</span>
                          <Badge
                            variant="outline"
                            className="text-xs border-zinc-700 text-zinc-600 ml-auto"
                          >
                            {content.split("\n").length} lines
                          </Badge>
                        </summary>
                        <pre className="mt-2 p-3 bg-zinc-950 rounded-lg text-xs font-mono text-zinc-400 overflow-x-auto max-h-64">
                          <code>{content}</code>
                        </pre>
                      </details>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <BuyCreditsModal
        open={showBuyModal}
        onClose={() => setShowBuyModal(false)}
        forceOpen={credits === 0}
      />
    </>
  );
}
