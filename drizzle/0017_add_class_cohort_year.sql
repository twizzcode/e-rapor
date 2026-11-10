ALTER TABLE "class_group" ADD COLUMN "cohort_year" integer;
--> statement-breakpoint
UPDATE "class_group"
SET "cohort_year" = (
  CASE
    WHEN EXTRACT(MONTH FROM CURRENT_DATE) >= 7
      THEN EXTRACT(YEAR FROM CURRENT_DATE)
    ELSE EXTRACT(YEAR FROM CURRENT_DATE) - 1
  END
)::integer - ("grade_level" - 1);
