"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AgentStage, AgentUpdate } from "@/lib/codecraft-graph";
import {
  Check,
  Loader2,
  AlertCircle,
  Router,
  Layout,
  Code2,
  Eye,
  Rocket,
} from "lucide-react";

const STAGES: { id: AgentStage; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "router", label: "Router", icon: Router },
  { id: "planner", label: "Planner", icon: Layout },
  { id: "coder", label: "Coder", icon: Code2 },
  { id: "critic", label: "Critic", icon: Eye },
  { id: "deployer", label: "Deploy", icon: Rocket },
];

interface AgentStatusProps {
  updates: AgentUpdate[];
  currentStage: AgentStage | null;
  isRunning: boolean;
}

export function AgentStatus({
  updates,
  currentStage,
  isRunning,
}: AgentStatusProps) {
  const getStageStatus = (stageId: AgentStage) => {
    if (currentStage === "error") return "idle";
    if (currentStage === "complete") return "done";
    if (stageId === currentStage && isRunning) return "active";

    const stageOrder: AgentStage[] = [
      "router",
      "planner",
      "coder",
      "critic",
      "deployer",
      "complete",
    ];
    const currentIdx = stageOrder.indexOf(currentStage ?? "router");
    const stageIdx = stageOrder.indexOf(stageId);

    if (stageIdx < currentIdx) return "done";
    return "idle";
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <h3 className="text-sm font-medium text-zinc-400 mb-4">
        Agent Pipeline
      </h3>

      <div className="flex items-center gap-2 mb-4">
        {STAGES.map((stage, i) => {
          const status = getStageStatus(stage.id);
          const Icon = stage.icon;

          return (
            <div key={stage.id} className="flex items-center">
              <div className="flex flex-col items-center gap-1">
                <motion.div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                    status === "done"
                      ? "border-green-500 bg-green-500/20 text-green-400"
                      : status === "active"
                        ? "border-blue-500 bg-blue-500/20 text-blue-400"
                        : "border-zinc-700 bg-zinc-800 text-zinc-600"
                  }`}
                  animate={status === "active" ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  {status === "done" ? (
                    <Check className="w-4 h-4" />
                  ) : status === "active" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </motion.div>
                <span className="text-xs text-zinc-500">{stage.label}</span>
              </div>
              {i < STAGES.length - 1 && (
                <div
                  className={`w-8 h-0.5 mx-1 mb-4 transition-colors ${
                    status === "done" ? "bg-green-500/50" : "bg-zinc-700"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="space-y-2 max-h-40 overflow-y-auto">
        <AnimatePresence>
          {updates.map((update, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2 text-xs"
            >
              {update.stage === "error" ? (
                <AlertCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
              ) : (
                <Check className="w-3.5 h-3.5 text-green-400 mt-0.5 shrink-0" />
              )}
              <span
                className={
                  update.stage === "error" ? "text-red-400" : "text-zinc-400"
                }
              >
                {update.message}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
