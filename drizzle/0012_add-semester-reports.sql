CREATE TABLE "semester_report" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"class_id" text NOT NULL,
	"semester" integer NOT NULL,
	"year" integer NOT NULL,
	"subject_scores" jsonb NOT NULL,
	"personal_social_levels" jsonb NOT NULL,
	"general_comment" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "semester_report" ADD CONSTRAINT "semester_report_student_id_student_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."student"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "semester_report" ADD CONSTRAINT "semester_report_class_id_class_group_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."class_group"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "semester_report_student_period_idx" ON "semester_report" USING btree ("student_id","year","semester");
