CREATE TABLE "class_group" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"grade_level" integer NOT NULL,
	"homeroom_teacher_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "class_group_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "class_member" (
	"student_id" text PRIMARY KEY NOT NULL,
	"class_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "class_group" ADD CONSTRAINT "class_group_homeroom_teacher_id_user_id_fk" FOREIGN KEY ("homeroom_teacher_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_member" ADD CONSTRAINT "class_member_student_id_student_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."student"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_member" ADD CONSTRAINT "class_member_class_id_class_group_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."class_group"("id") ON DELETE cascade ON UPDATE no action;