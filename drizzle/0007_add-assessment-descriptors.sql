CREATE TABLE "assessment_descriptor" (
	"id" text PRIMARY KEY NOT NULL,
	"subject_id" text NOT NULL,
	"level" text NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "assessment_descriptor" ADD CONSTRAINT "assessment_descriptor_subject_id_subject_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subject"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "assessment_descriptor_subject_level_idx" ON "assessment_descriptor" USING btree ("subject_id","level");