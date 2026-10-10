CREATE TYPE "public"."product_cta" AS ENUM('try', 'demo');--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "translations" jsonb;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "primaryCta" "product_cta";