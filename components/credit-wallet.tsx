"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BuyCreditsModal } from "@/components/buy-credits-modal";
import { Zap, RefreshCw } from "lucide-react";

interface CreditWalletProps {
  initialCredits?: number;
  compact?: boolean;
}

export function CreditWallet({
  initialCredits = 0,
  compact = false,
}: CreditWalletProps) {
  const [credits, setCredits] = useState(initialCredits);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const refreshCredits = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/credits/balance");
      const data = await res.json();
      if (res.ok) setCredits(data.credits);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setCredits(initialCredits);
  }, [initialCredits]);

  if (compact) {
    return (
      <>
        <button
          onClick={() => setShowBuyModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 hover:border-blue-500 transition-colors"
        >
          <Zap className="w-3.5 h-3.5 text-yellow-400" />
          <span className="text-sm font-medium text-white">
            {credits.toLocaleString()}
          </span>
          <span className="text-xs text-zinc-500">cr</span>
        </button>
        <BuyCreditsModal
          open={showBuyModal}
          onClose={() => setShowBuyModal(false)}
        />
      </>
    );
  }

  return (
    <>
      <div className="flex items-center gap-3 p-4 rounded-xl bg-zinc-900 border border-zinc-800">
        <div className="flex-1">
          <div className="text-xs text-zinc-500 mb-1">Credit Balance</div>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            <span className="text-2xl font-bold text-white">
              {credits.toLocaleString()}
            </span>
            <span className="text-zinc-500 text-sm">credits</span>
          </div>
          {credits === 0 && (
            <Badge className="mt-2 bg-red-500/20 text-red-400 border-red-500/30">
              No credits — features locked
            </Badge>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Button
            onClick={() => setShowBuyModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            size="sm"
          >
            Buy Credits
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshCredits}
            disabled={refreshing}
            className="text-zinc-500 hover:text-white"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </div>
      <BuyCreditsModal
        open={showBuyModal}
        onClose={() => setShowBuyModal(false)}
      />
    </>
  );
}
