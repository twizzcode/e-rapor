CREATE TABLE "personal_social_rubric" (
	"id" text PRIMARY KEY NOT NULL,
	"aspect" text NOT NULL,
	"exceeding" text NOT NULL,
	"meeting" text NOT NULL,
	"developing" text NOT NULL,
	"emerging" text NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "personal_social_rubric_aspect_unique" UNIQUE("aspect")
);
