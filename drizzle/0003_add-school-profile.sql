CREATE TABLE "school_profile" (
	"id" text PRIMARY KEY NOT NULL,
	"logo_key" text,
	"name" text NOT NULL,
	"education_level" text NOT NULL,
	"nss" text,
	"npsn" text,
	"street" text,
	"village" text,
	"district" text,
	"regency" text,
	"province" text,
	"postal_code" text,
	"phone_fax" text,
	"email" text,
	"website" text,
	"principal_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "school_profile" ADD CONSTRAINT "school_profile_principal_user_id_user_id_fk" FOREIGN KEY ("principal_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;