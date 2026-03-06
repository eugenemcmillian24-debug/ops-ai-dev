"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, TrendingUp, Zap, AlertTriangle } from "lucide-react";

interface UsageData {
  logs: Array<{ action: string; creditsUsed: number; timestamp: string }>;
  transactions: Array<{ credits: number; amountCents: number; createdAt: string }>;
  totalSpent: number;
  actionBreakdown: Record<string, number>;
}

interface UsageForecastProps {
  currentCredits: number;
}

export function UsageForecast({ currentCredits }: UsageForecastProps) {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/usage")
      .then((r) => r.json())
      .then((d) => {
        setUsage(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-zinc-800 rounded w-1/3" />
            <div className="h-8 bg-zinc-800 rounded" />
            <div className="h-4 bg-zinc-800 rounded w-2/3" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalBought =
    usage?.transactions.reduce((s, t) => s + t.credits, 0) ?? 0;
  const totalUsed = usage?.totalSpent ?? 0;
  const usageRate = totalBought > 0 ? (totalUsed / totalBought) * 100 : 0;

  const recentLogs = usage?.logs.slice(0, 7) ?? [];
  const avgDailyUsage =
    recentLogs.length > 0
      ? recentLogs.reduce((s, l) => s + l.creditsUsed, 0) / 7
      : 0;

  const daysRemaining =
    avgDailyUsage > 0 ? Math.floor(currentCredits / avgDailyUsage) : null;

  const isLowCredits = currentCredits < 200;

  return (
    <div className="space-y-4">
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            Usage Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-zinc-400">Credits used</span>
              <span className="text-white font-medium">
                {totalUsed.toLocaleString()} / {totalBought.toLocaleString()}
              </span>
            </div>
            <Progress value={usageRate} className="h-2 bg-zinc-800" />
          </div>

          {isLowCredits && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-sm text-amber-400">
                Low credits — consider topping up soon
              </span>
            </div>
          )}

          {daysRemaining !== null && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50 border border-zinc-700">
              <div>
                <div className="text-xs text-zinc-500">Estimated runway</div>
                <div className="text-sm font-medium text-white">
                  {daysRemaining === 0
                    ? "Less than 1 day"
                    : `~${daysRemaining} days`}
                </div>
              </div>
              {daysRemaining > 7 ? (
                <TrendingUp className="w-5 h-5 text-green-400" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-400" />
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium text-white">
            By Action
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {Object.entries(usage?.actionBreakdown ?? {}).map(
            ([action, credits]) => (
              <div key={action} className="flex items-center justify-between">
                <span className="text-sm text-zinc-400 capitalize">
                  {action.replace(/([A-Z])/g, " $1").trim()}
                </span>
                <Badge
                  variant="outline"
                  className="text-xs border-zinc-700 text-zinc-300"
                >
                  {credits.toLocaleString()} cr
                </Badge>
              </div>
            )
          )}
          {Object.keys(usage?.actionBreakdown ?? {}).length === 0 && (
            <p className="text-sm text-zinc-600 text-center py-2">
              No usage yet
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
