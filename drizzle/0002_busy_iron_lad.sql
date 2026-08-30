-- Guarded with IF NOT EXISTS because page_views and the users.username / users.passwordHash
-- columns already exist in some environments: they were applied outside the migration journal,
-- so drizzle regenerated them here. The statements stay in place so a fresh database still
-- gets them, but they no longer abort an existing one.

DO $$ BEGIN
	CREATE TYPE "public"."submission_status" AS ENUM('new', 'read', 'archived');
EXCEPTION
	WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "contact_submissions" (
	"id" varchar(40) PRIMARY KEY NOT NULL,
	"name" varchar(180) NOT NULL,
	"email" varchar(320) NOT NULL,
	"company" varchar(180),
	"message" text NOT NULL,
	"status" "submission_status" DEFAULT 'new' NOT NULL,
	"ip" varchar(45),
	"userAgent" varchar(500),
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"handledAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "page_views" (
	"id" serial PRIMARY KEY NOT NULL,
	"path" varchar(255) NOT NULL,
	"referrer" varchar(500),
	"visitorHash" varchar(64) NOT NULL,
	"ip" varchar(45),
	"city" varchar(100),
	"region" varchar(100),
	"country" varchar(100),
	"countryCode" varchar(10),
	"deviceType" varchar(50),
	"browser" varchar(50),
	"os" varchar(50),
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "username" varchar(80);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "passwordHash" text;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contact_submissions_created_idx" ON "contact_submissions" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contact_submissions_status_idx" ON "contact_submissions" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "page_views_created_at_idx" ON "page_views" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "page_views_path_idx" ON "page_views" USING btree ("path");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "page_views_city_idx" ON "page_views" USING btree ("city");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "page_views_country_idx" ON "page_views" USING btree ("countryCode");
