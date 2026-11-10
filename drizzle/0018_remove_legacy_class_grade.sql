ALTER TABLE "class_group" ALTER COLUMN "cohort_year" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "class_group" DROP COLUMN "grade_level";--> statement-breakpoint
ALTER TABLE "student" DROP COLUMN "grade_level";--> statement-breakpoint
ALTER TABLE "student" DROP COLUMN "class_name";