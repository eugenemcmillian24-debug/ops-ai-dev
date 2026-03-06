import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Github,
  Zap,
  Code2,
  Rocket,
  Shield,
  Terminal,
  Bot,
  CreditCard,
} from "lucide-react";

const FEATURES = [
  {
    icon: Terminal,
    title: "AI Terminal",
    desc: "Stream code from Llama 3.1 70B",
    cost: "50cr/msg",
  },
  {
    icon: Bot,
    title: "Agent Pipeline",
    desc: "Router→Planner→Coder→Critic",
    cost: "2000cr/run",
  },
  {
    icon: Code2,
    title: "Live Preview",
    desc: "WebContainer in-browser runtime",
    cost: "50cr/min",
  },
  {
    icon: Rocket,
    title: "One-Click Deploy",
    desc: "GitHub + Vercel deployment",
    cost: "1000cr",
  },
  {
    icon: Shield,
    title: "Security Scan",
    desc: "AI-powered code auditing",
    cost: "1500cr",
  },
  {
    icon: CreditCard,
    title: "Pay Per Use",
    desc: "No subscriptions. Pure usage billing.",
    cost: "from $10",
  },
];

export default async function HomePage() {
  const session = await auth();
  if (session?.user?.id) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <nav className="border-b border-zinc-900 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-white text-lg">CodeCraft AI</span>
        </div>
        <Badge
          variant="outline"
          className="border-zinc-700 text-zinc-400 text-xs"
        >
          No free tier · Pure pay-per-use
        </Badge>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20">
        <div className="max-w-4xl w-full text-center">
          <Badge className="mb-6 bg-blue-500/10 text-blue-400 border-blue-500/30 text-sm px-4 py-1.5">
            ⚡ Production-ready AI Dev Platform
          </Badge>

          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Build apps with{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
              AI power
            </span>
          </h1>

          <p className="text-xl text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Groq Llama 3.1, WebContainer preview, multi-agent orchestration,
            and one-click Vercel deployment. Pay only for what you use.
          </p>

          <form
            action={async () => {
              "use server";
              await signIn("github", { redirectTo: "/dashboard" });
            }}
          >
            <Button
              type="submit"
              size="lg"
              className="bg-white text-zinc-900 hover:bg-zinc-100 font-semibold text-base px-8 py-6"
            >
              <Github className="w-5 h-5 mr-2" />
              Sign in with GitHub
            </Button>
          </form>

          <p className="text-zinc-600 text-sm mt-4">
            No free tier · Buy credits to start · Cancel anytime
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-20">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/50 text-left hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <Icon className="w-5 h-5 text-blue-400" />
                    <Badge
                      variant="outline"
                      className="text-xs border-zinc-700 text-zinc-500"
                    >
                      {f.cost}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-white mb-1">{f.title}</h3>
                  <p className="text-sm text-zinc-500">{f.desc}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-16 grid grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-white">Llama 3.1</div>
              <div className="text-zinc-500 text-sm mt-1">70B Primary Model</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">Edge</div>
              <div className="text-zinc-500 text-sm mt-1">Runtime & API</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">$0.01</div>
              <div className="text-zinc-500 text-sm mt-1">Per credit</div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-zinc-900 px-6 py-6 text-center text-zinc-600 text-sm">
        CodeCraft AI © 2024 · Pure pay-per-use · No subscriptions
      </footer>
    </div>
  );
}
