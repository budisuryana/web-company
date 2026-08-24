CREATE TYPE "public"."product_status" AS ENUM('active', 'planned', 'retired');--> statement-breakpoint
CREATE TYPE "public"."publication_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TABLE "activity_logs" (
	"id" varchar(40) PRIMARY KEY NOT NULL,
	"actorOpenId" varchar(64) NOT NULL,
	"actorName" varchar(180),
	"eventType" varchar(80) NOT NULL,
	"resourceType" varchar(64) NOT NULL,
	"resourceId" varchar(190),
	"summary" varchar(500) NOT NULL,
	"detail" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_media" (
	"id" varchar(40) PRIMARY KEY NOT NULL,
	"productId" varchar(40) NOT NULL,
	"url" text NOT NULL,
	"storageKey" text NOT NULL,
	"alt" varchar(240),
	"displayOrder" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" varchar(40) PRIMARY KEY NOT NULL,
	"name" varchar(160) NOT NULL,
	"slug" varchar(180) NOT NULL,
	"shortDescription" text NOT NULL,
	"fullDescription" text NOT NULL,
	"heroHeadline" text NOT NULL,
	"problem" text NOT NULL,
	"solution" text NOT NULL,
	"outcome" text NOT NULL,
	"category" varchar(160) NOT NULL,
	"productStatus" "product_status" DEFAULT 'active' NOT NULL,
	"publicationStatus" "publication_status" DEFAULT 'draft' NOT NULL,
	"logoUrl" text,
	"logoKey" text,
	"coverUrl" text,
	"coverKey" text,
	"capabilities" jsonb NOT NULL,
	"targetUsers" text NOT NULL,
	"demoUrl" varchar(500),
	"workflowSteps" jsonb NOT NULL,
	"featured" integer DEFAULT 0 NOT NULL,
	"displayOrder" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "site_content" (
	"key" varchar(100) PRIMARY KEY NOT NULL,
	"label" varchar(180) NOT NULL,
	"value" text NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
--> statement-breakpoint
ALTER TABLE "product_media" ADD CONSTRAINT "product_media_productId_products_id_fk" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_logs_created_idx" ON "activity_logs" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "activity_logs_resource_idx" ON "activity_logs" USING btree ("resourceType","resourceId");--> statement-breakpoint
CREATE INDEX "product_media_order_idx" ON "product_media" USING btree ("productId","displayOrder");--> statement-breakpoint
CREATE INDEX "products_public_order_idx" ON "products" USING btree ("publicationStatus","displayOrder");