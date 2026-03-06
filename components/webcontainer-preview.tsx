"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BuyCreditsModal } from "@/components/buy-credits-modal";
import {
  Play,
  Square,
  RefreshCw,
  ExternalLink,
  Terminal,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

interface WebContainerPreviewProps {
  files?: Record<string, string>;
  currentCredits: number;
  onCreditsUpdate?: (credits: number) => void;
}

export function WebContainerPreview({
  files,
  currentCredits,
  onCreditsUpdate,
}: WebContainerPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [status, setStatus] = useState<
    "idle" | "loading" | "running" | "error"
  >("idle");
  const [url, setUrl] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [minuteTimer, setMinuteTimer] = useState<ReturnType<typeof setInterval> | null>(null);
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  const addLog = useCallback((msg: string) => {
    setLogs((prev) => [...prev.slice(-50), msg]);
  }, []);

  const deductMinuteCredits = useCallback(async () => {
    const res = await fetch("/api/credits/deduct", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "webcontainerMinute" }),
    });

    const data = await res.json();

    if (!res.ok) {
      toast.error("Out of credits — WebContainer paused");
      setShowBuyModal(true);
      return false;
    }

    onCreditsUpdate?.(data.remaining);
    setElapsedMinutes((prev) => prev + 1);
    return true;
  }, [onCreditsUpdate]);

  const startPreview = async () => {
    if (currentCredits < 50) {
      setShowBuyModal(true);
      return;
    }

    setStatus("loading");
    setLogs([]);
    addLog("🚀 Starting WebContainer...");

    const ok = await deductMinuteCredits();
    if (!ok) {
      setStatus("error");
      return;
    }

    try {
      const { WebContainer } = await import("@webcontainer/api");
      addLog("✅ WebContainer API loaded");

      const wc = await WebContainer.boot();
      addLog("✅ WebContainer booted");

      const projectFiles = files ?? {
        "index.js": {
          file: {
            contents: `const http = require('http');
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end('<html><body style="background:#111;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><div style="text-align:center"><h1>⚡ CodeCraft AI</h1><p>WebContainer is running!</p><p style="color:#888">Deploy your code to see it live here</p></div></body></html>');
});
server.listen(3000, () => console.log('Server running on port 3000'));`,
          },
        },
        "package.json": {
          file: {
            contents: JSON.stringify({ name: "app", version: "1.0.0" }),
          },
        },
      };

      const wcFiles: Record<string, { file: { contents: string } }> = {};
      if (files) {
        for (const [path, content] of Object.entries(files)) {
          wcFiles[path] = { file: { contents: content } };
        }
      } else {
        Object.assign(wcFiles, projectFiles);
      }

      await wc.mount(wcFiles);
      addLog("✅ Files mounted");

      const installProcess = await wc.spawn("npm", ["install"]);
      installProcess.output.pipeTo(
        new WritableStream({
          write(data) {
            addLog(data);
          },
        })
      );
      await installProcess.exit;
      addLog("✅ Dependencies installed");

      const startProcess = await wc.spawn("node", ["index.js"]);
      startProcess.output.pipeTo(
        new WritableStream({
          write(data) {
            addLog(data);
          },
        })
      );

      wc.on("server-ready", (port, serverUrl) => {
        addLog(`✅ Server ready at ${serverUrl}`);
        setUrl(serverUrl);
        setStatus("running");
        if (iframeRef.current) {
          iframeRef.current.src = serverUrl;
        }
      });

      const timer = setInterval(async () => {
        const ok = await deductMinuteCredits();
        if (!ok) {
          clearInterval(timer);
          setStatus("error");
        }
      }, 60000);

      setMinuteTimer(timer);
    } catch (err) {
      addLog(`❌ Error: ${err instanceof Error ? err.message : "Unknown error"}`);
      setStatus("error");
    }
  };

  const stopPreview = () => {
    if (minuteTimer) {
      clearInterval(minuteTimer);
      setMinuteTimer(null);
    }
    setStatus("idle");
    setUrl(null);
    setElapsedMinutes(0);
    addLog("⏹ Preview stopped");
  };

  useEffect(() => {
    return () => {
      if (minuteTimer) clearInterval(minuteTimer);
    };
  }, [minuteTimer]);

  return (
    <>
      <div className="flex flex-col h-full bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-zinc-300">
              Live Preview
            </span>
            <Badge
              variant="outline"
              className={`text-xs ${
                status === "running"
                  ? "border-green-500/50 text-green-400"
                  : status === "loading"
                    ? "border-blue-500/50 text-blue-400"
                    : status === "error"
                      ? "border-red-500/50 text-red-400"
                      : "border-zinc-700 text-zinc-500"
              }`}
            >
              {status === "running"
                ? `Running • ${elapsedMinutes}min`
                : status === "loading"
                  ? "Starting..."
                  : status === "error"
                    ? "Error"
                    : "Idle"}
            </Badge>
            {status === "running" && (
              <span className="text-xs text-zinc-500">50cr/min</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {url && (
              <Button
                size="icon"
                variant="ghost"
                className="w-7 h-7 text-zinc-500 hover:text-white"
                onClick={() => window.open(url, "_blank")}
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            )}
            {status === "running" && (
              <Button
                size="icon"
                variant="ghost"
                className="w-7 h-7 text-zinc-500 hover:text-white"
                onClick={() => {
                  if (iframeRef.current) {
                    iframeRef.current.src = iframeRef.current.src;
                  }
                }}
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
            )}
            {status === "idle" || status === "error" ? (
              <Button
                size="sm"
                onClick={startPreview}
                disabled={status === "loading"}
                className="bg-green-600 hover:bg-green-700 text-white text-xs"
              >
                <Play className="w-3.5 h-3.5 mr-1" />
                Start (50cr/min)
              </Button>
            ) : (
              <Button
                size="sm"
                variant="destructive"
                onClick={stopPreview}
                className="text-xs"
              >
                <Square className="w-3.5 h-3.5 mr-1" />
                Stop
              </Button>
            )}
          </div>
        </div>

        <div className="flex-1 relative">
          {status === "idle" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600 gap-3">
              <Play className="w-12 h-12 opacity-30" />
              <p className="text-sm">Click Start to launch preview</p>
              <p className="text-xs opacity-60">50 credits / minute</p>
            </div>
          )}
          {status === "loading" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-400 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
              <p className="text-sm">Booting WebContainer...</p>
            </div>
          )}
          {status === "error" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-red-400 gap-3">
              <AlertCircle className="w-8 h-8" />
              <p className="text-sm">Preview failed</p>
            </div>
          )}
          <iframe
            ref={iframeRef}
            className={`w-full h-full border-0 ${status === "running" ? "opacity-100" : "opacity-0"}`}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            title="WebContainer Preview"
          />
        </div>

        {logs.length > 0 && (
          <div className="border-t border-zinc-800 bg-zinc-950">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-800">
              <Terminal className="w-3.5 h-3.5 text-zinc-500" />
              <span className="text-xs text-zinc-500">Console</span>
            </div>
            <div className="max-h-24 overflow-y-auto p-2 space-y-0.5">
              {logs.map((log, i) => (
                <div key={i} className="text-xs font-mono text-zinc-400">
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <BuyCreditsModal
        open={showBuyModal}
        onClose={() => setShowBuyModal(false)}
        forceOpen={currentCredits === 0}
      />
    </>
  );
}
