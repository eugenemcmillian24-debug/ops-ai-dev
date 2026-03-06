"use client";

import { Badge } from "@/components/ui/badge";
import { ACTION_COSTS, ActionType } from "@/lib/credits";
import { Zap } from "lucide-react";

interface CostPredictorProps {
  action: ActionType;
  currentCredits: number;
}

export function CostPredictor({ action, currentCredits }: CostPredictorProps) {
  const cost = ACTION_COSTS[action];
  const canAfford = currentCredits >= cost;

  return (
    <div className="flex items-center gap-2">
      <Zap className="w-3.5 h-3.5 text-yellow-400" />
      <Badge
        variant="outline"
        className={`text-xs ${
          canAfford
            ? "border-yellow-500/50 text-yellow-400 bg-yellow-500/10"
            : "border-red-500/50 text-red-400 bg-red-500/10"
        }`}
      >
        {cost.toLocaleString()} credits
      </Badge>
    </div>
  );
}
