CREATE TYPE "public"."content_locale" AS ENUM('en', 'id');--> statement-breakpoint
CREATE TABLE "page_content" (
	"key" varchar(160) NOT NULL,
	"locale" "content_locale" NOT NULL,
	"value" text NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedBy" varchar(64),
	CONSTRAINT "page_content_key_locale_pk" PRIMARY KEY("key","locale")
);
