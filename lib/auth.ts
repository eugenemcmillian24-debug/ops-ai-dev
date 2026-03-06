import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "github") return false;
      const githubId = account.providerAccountId;

      const existing = await db
        .select()
        .from(users)
        .where(eq(users.githubId, githubId))
        .limit(1);

      if (existing.length === 0) {
        const adminGithubIds = process.env.ADMIN_GITHUB_IDS?.split(",").map(id => id.trim()) || [];
        const isAdmin = adminGithubIds.includes(githubId);

        await db.insert(users).values({
          githubId,
          email: user.email ?? null,
          name: user.name ?? null,
          image: user.image ?? null,
          credits: 0,
          isAdmin,
        });
      } else {
        const adminGithubIds = process.env.ADMIN_GITHUB_IDS?.split(",").map(id => id.trim()) || [];
        const shouldBeAdmin = adminGithubIds.includes(githubId);

        if (existing[0].isAdmin !== shouldBeAdmin) {
          await db.update(users)
            .set({ isAdmin: shouldBeAdmin })
            .where(eq(users.githubId, githubId));
        }
      }

      return true;
    },
    async session({ session, token }) {
      if (token?.githubId) {
        const dbUser = await db
          .select()
          .from(users)
          .where(eq(users.githubId, token.githubId as string))
          .limit(1);

        if (dbUser.length > 0) {
          session.user.id = String(dbUser[0].id);
          session.user.credits = dbUser[0].credits;
          session.user.githubId = dbUser[0].githubId;
          session.user.isAdmin = dbUser[0].isAdmin;
        }
      }
      return session;
    },
    async jwt({ token, account }) {
      if (account?.provider === "github") {
        token.githubId = account.providerAccountId;
      }
      return token;
    },
  },
  pages: {
    signIn: "/",
  },
});

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      credits: number;
      githubId: string;
      isAdmin: boolean;
    };
  }
}
