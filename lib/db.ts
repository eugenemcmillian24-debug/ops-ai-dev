import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  jsonb,
  boolean,
} from "drizzle-orm/pg-core";

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  githubId: text("github_id").unique().notNull(),
  email: text("email"),
  name: text("name"),
  image: text("image"),
  credits: integer("credits").default(0).notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  credits: integer("credits").notNull(),
  amountCents: integer("amount_cents"),
  stripeSessionId: text("stripe_session_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  name: text("name").notNull(),
  files: jsonb("files").default({}).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const usageLogs = pgTable("usage_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  action: text("action").notNull(),
  creditsUsed: integer("credits_used").notNull(),
  metadata: jsonb("metadata"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type UsageLog = typeof usageLogs.$inferSelect;
