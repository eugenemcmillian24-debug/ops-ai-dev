"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CREDIT_PACKS } from "@/lib/credits";
import { Loader2, Zap, Crown, Star } from "lucide-react";
import { toast } from "sonner";

interface BuyCreditsModalProps {
  open: boolean;
  onClose: () => void;
  forceOpen?: boolean;
}

const PACK_ICONS = [Zap, Star, Crown, Crown, Crown];

export function BuyCreditsModal({
  open,
  onClose,
  forceOpen = false,
}: BuyCreditsModalProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleBuy = async (packId: string) => {
    setLoading(packId);
    try {
      const res = await fetch("/api/credits/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create checkout");

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start checkout");
      setLoading(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={forceOpen ? undefined : onClose}>
      <DialogContent className="sm:max-w-2xl bg-zinc-900 border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">
            {forceOpen ? "⚡ Credits Required" : "Buy Credits"}
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            {forceOpen
              ? "You need credits to use CodeCraft AI. Purchase a pack to continue building."
              : "Choose a credit pack to power your AI development workflow."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
          {CREDIT_PACKS.map((pack, i) => {
            const Icon = PACK_ICONS[i];
            const pricePerCredit = (pack.price / pack.credits) * 100;
            const isPopular = pack.id === "5k";

            return (
              <div
                key={pack.id}
                className={`relative rounded-xl border p-4 cursor-pointer transition-all hover:border-blue-500 ${
                  isPopular
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-zinc-700 bg-zinc-800/50"
                }`}
              >
                {isPopular && (
                  <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs">
                    Most Popular
                  </Badge>
                )}
                <div className="flex items-center gap-2 mb-3">
                  <Icon className="w-5 h-5 text-blue-400" />
                  <span className="font-semibold text-white">{pack.label}</span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">
                  ${pack.price}
                </div>
                <div className="text-zinc-400 text-sm mb-1">
                  {pack.credits.toLocaleString()} credits
                </div>
                <div className="text-zinc-500 text-xs mb-4">
                  ${pricePerCredit.toFixed(3)}/credit
                </div>
                <Button
                  onClick={() => handleBuy(pack.id)}
                  disabled={loading !== null}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  size="sm"
                >
                  {loading === pack.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    `Buy $${pack.price}`
                  )}
                </Button>
              </div>
            );
          })}
        </div>

        <div className="mt-4 p-3 rounded-lg bg-zinc-800/50 border border-zinc-700">
          <div className="text-xs text-zinc-500 text-center">
            💳 Secure payment via Stripe • No subscriptions • Credits never expire
          </div>
        </div>

        {!forceOpen && (
          <Button
            variant="ghost"
            onClick={onClose}
            className="mt-2 text-zinc-400 hover:text-white"
          >
            Cancel
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
