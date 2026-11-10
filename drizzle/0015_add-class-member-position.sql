ALTER TABLE "class_member" ADD COLUMN "position" integer;--> statement-breakpoint
WITH "ranked_members" AS (
	SELECT
		"student_id",
		row_number() OVER (
			PARTITION BY "class_id"
			ORDER BY "created_at", "student_id"
		)::integer AS "position"
	FROM "class_member"
)
UPDATE "class_member"
SET "position" = "ranked_members"."position"
FROM "ranked_members"
WHERE "class_member"."student_id" = "ranked_members"."student_id";--> statement-breakpoint
ALTER TABLE "class_member" ALTER COLUMN "position" SET NOT NULL;
