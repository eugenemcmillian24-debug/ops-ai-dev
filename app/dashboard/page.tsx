import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserCredits } from "@/lib/credits";
import { db, usageLogs, projects } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { CreditWallet } from "@/components/credit-wallet";
import { UsageForecast } from "@/components/usage-forecast";
import { BuyCreditsModal } from "@/components/buy-credits-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Terminal,
  Bot,
  Zap,
  LogOut,
  ExternalLink,
  Clock,
  FolderOpen,
} from "lucide-react";
import Link from "next/link";
import { signOut } from "@/lib/auth";

interface SearchParams {
  success?: string;
  credits?: string;
  canceled?: string;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const params = await searchParams;
  const userId = parseInt(session.user.id);
  const credits = await getUserCredits(userId);

  const recentLogs = await db
    .select()
    .from(usageLogs)
    .where(eq(usageLogs.userId, userId))
    .orderBy(desc(usageLogs.timestamp))
    .limit(10);

  const userProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.userId, userId))
    .orderBy(desc(projects.updatedAt))
    .limit(5);

  const ACTION_LABELS: Record<string, string> = {
    terminalMessage: "AI Terminal",
    agentRun: "Agent Run",
    webcontainerMinute: "WebContainer",
    deployment: "Deployment",
    mobileExport: "Mobile Export",
    securityScan: "Security Scan",
    projectSave: "Project Save",
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      <nav className="border-b border-zinc-900 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white">CodeCraft AI</span>
        </div>

        <div className="flex items-center gap-4">
          <CreditWallet initialCredits={credits} compact />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-lg hover:bg-zinc-900 p-1 transition-colors">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={session.user.image ?? undefined} />
                  <AvatarFallback className="bg-zinc-700 text-white text-xs">
                    {session.user.name?.[0] ?? "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-zinc-300 hidden sm:block">
                  {session.user.name}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-zinc-900 border-zinc-800"
            >
              <DropdownMenuItem className="text-zinc-400 text-xs px-3 py-2 cursor-default">
                {session.user.email}
              </DropdownMenuItem>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <DropdownMenuItem asChild>
                  <button
                    type="submit"
                    className="w-full flex items-center gap-2 text-red-400 hover:text-red-300 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </DropdownMenuItem>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {params.success && (
          <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
            ✅ Payment successful! {params.credits} credits added to your account.
          </div>
        )}
        {params.canceled && (
          <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm">
            Payment canceled. Your credits were not charged.
          </div>
        )}

        {credits === 0 && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-400 font-medium">⚠️ No Credits</p>
                <p className="text-sm text-red-400/70 mt-1">
                  All features are locked. Purchase credits to start building.
                </p>
              </div>
              <BuyCreditsModal open={false} onClose={() => {}} forceOpen={false} />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">
                Welcome back, {session.user.name?.split(" ")[0]} 👋
              </h1>
              <p className="text-zinc-500 text-sm">
                Your AI development workspace
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Link href="/ai-terminal">
                <div className="group p-5 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:border-blue-500/50 hover:bg-zinc-900 transition-all cursor-pointer">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center">
                      <Terminal className="w-5 h-5 text-blue-400" />
                    </div>
                    <Badge
                      variant="outline"
                      className="text-xs border-zinc-700 text-zinc-500"
                    >
                      50cr/msg
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-white mb-1">AI Terminal</h3>
                  <p className="text-sm text-zinc-500">
                    Chat with Llama 3.1 70B to build anything
                  </p>
                  <div className="mt-3 flex items-center gap-1 text-blue-400 text-xs group-hover:gap-2 transition-all">
                    <span>Open terminal</span>
                    <ExternalLink className="w-3 h-3" />
                  </div>
                </div>
              </Link>

              <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/50 opacity-70">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-purple-400" />
                  </div>
                  <Badge
                    variant="outline"
                    className="text-xs border-zinc-700 text-zinc-500"
                  >
                    2000cr/run
                  </Badge>
                </div>
                <h3 className="font-semibold text-white mb-1">
                  Agent Pipeline
                </h3>
                <p className="text-sm text-zinc-500">
                  Multi-agent Router→Coder→Critic orchestration
                </p>
                <div className="mt-3 text-xs text-zinc-600">
                  Available in terminal →
                </div>
              </div>
            </div>

            {userProjects.length > 0 && (
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium text-white flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-zinc-400" />
                    Recent Projects
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {userProjects.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50"
                    >
                      <div>
                        <p className="text-sm font-medium text-white">
                          {p.name}
                        </p>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {new Date(p.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs text-zinc-400"
                      >
                        Open
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {recentLogs.length > 0 && (
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-zinc-400" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {recentLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        <span className="text-zinc-400">
                          {ACTION_LABELS[log.action] ?? log.action}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-zinc-600 text-xs">
                          {new Date(log.timestamp).toLocaleDateString()}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-xs border-zinc-700 text-zinc-400"
                        >
                          -{log.creditsUsed}cr
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-4">
            <CreditWallet initialCredits={credits} />
            <UsageForecast currentCredits={credits} />
          </div>
        </div>
      </main>
    </div>
  );
}
