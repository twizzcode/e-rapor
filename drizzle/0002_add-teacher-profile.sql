CREATE TABLE "teacher" (
	"user_id" text PRIMARY KEY NOT NULL,
	"nip" text,
	"nuptk" text,
	"gender" text,
	"ptk_type" text,
	"birth_date" date,
	"phone" text,
	"address" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "teacher_nip_unique" UNIQUE("nip"),
	CONSTRAINT "teacher_nuptk_unique" UNIQUE("nuptk")
);
--> statement-breakpoint
ALTER TABLE "teacher" ADD CONSTRAINT "teacher_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;