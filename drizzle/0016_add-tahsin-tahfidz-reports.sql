CREATE TABLE "tahsin_tahfidz_report" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"class_id" text NOT NULL,
	"teacher_id" text NOT NULL,
	"semester" integer NOT NULL,
	"month" integer NOT NULL,
	"year" integer NOT NULL,
	"level_category" text NOT NULL,
	"weeks" jsonb NOT NULL,
	"target_achievement" text NOT NULL,
	"overall_performance" text NOT NULL,
	"teacher_notes" text NOT NULL,
	"report_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tahsin_tahfidz_report" ADD CONSTRAINT "tahsin_tahfidz_report_student_id_student_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."student"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tahsin_tahfidz_report" ADD CONSTRAINT "tahsin_tahfidz_report_class_id_class_group_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."class_group"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tahsin_tahfidz_report" ADD CONSTRAINT "tahsin_tahfidz_report_teacher_id_user_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "tahsin_tahfidz_report_student_period_teacher_idx" ON "tahsin_tahfidz_report" USING btree ("student_id","year","month","semester","teacher_id");