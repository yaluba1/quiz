-- ==============================================================================
-- Open Quiz Platform - Complete Database Schema
-- ==============================================================================

DO $$ BEGIN
 CREATE TYPE "public"."question_type" AS ENUM('MULTIPLE_CHOICE', 'TRUE_FALSE');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "public"."game_session_status" AS ENUM('LOBBY', 'IN_PROGRESS', 'FINISHED', 'ABORTED', 'EXPIRED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "public"."media_type" AS ENUM('IMAGE', 'AUDIO', 'VIDEO');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "professors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"display_name" varchar(100) NOT NULL,
	"locale" varchar(10) DEFAULT 'en' NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"verification_token" varchar(255),
	"verification_token_expires_at" timestamp with time zone,
	"reset_token" varchar(255),
	"reset_token_expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "themes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"professor_id" uuid,
	"name" varchar(100) NOT NULL,
	"is_system_preset" boolean DEFAULT false NOT NULL,
	"logo_url" varchar(500),
	"primary_color" varchar(20) DEFAULT '#93C572' NOT NULL,
	"secondary_color" varchar(20) DEFAULT '#FF7518' NOT NULL,
	"background_color" varchar(20) DEFAULT '#F7F9F6' NOT NULL,
	"font_family" varchar(100) DEFAULT 'Inter' NOT NULL,
	"custom_css_vars" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "quizzes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"professor_id" uuid NOT NULL,
	"theme_id" uuid,
	"title" varchar(255) NOT NULL,
	"description" text,
	"cover_image_url" varchar(500),
	"is_public" boolean DEFAULT false NOT NULL,
	"session_duration_minutes" integer DEFAULT 60 NOT NULL,
	"default_question_time_limit_seconds" integer DEFAULT 20 NOT NULL,
	"default_execution_mode" varchar(20) DEFAULT 'MANUAL' NOT NULL,
	"level" varchar(100),
	"subject" varchar(100),
	"folder" varchar(150),
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quiz_id" uuid NOT NULL,
	"order_index" integer NOT NULL,
	"question_text" text NOT NULL,
	"question_type" "question_type" DEFAULT 'MULTIPLE_CHOICE' NOT NULL,
	"time_limit_seconds" integer DEFAULT 20 NOT NULL,
	"points_multiplier" numeric(3, 2) DEFAULT '1.00' NOT NULL,
	"media_url" varchar(500),
	"media_type" "media_type",
	"show_answers_on_device" boolean DEFAULT false NOT NULL
);

CREATE TABLE IF NOT EXISTS "answer_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_id" uuid NOT NULL,
	"order_index" integer NOT NULL,
	"option_text" text NOT NULL,
	"is_correct" boolean DEFAULT false NOT NULL,
	"color_shape_index" integer NOT NULL
);

CREATE TABLE IF NOT EXISTS "game_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quiz_id" uuid NOT NULL,
	"professor_id" uuid NOT NULL,
	"title" varchar(255),
	"class_group" varchar(100),
	"pin" varchar(6) NOT NULL,
	"status" "game_session_status" DEFAULT 'LOBBY' NOT NULL,
	"execution_mode" varchar(20) DEFAULT 'MANUAL' NOT NULL,
	"total_participants" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"expires_at" timestamp with time zone
);

CREATE TABLE IF NOT EXISTS "game_session_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"nickname" varchar(50) NOT NULL,
	"final_score" integer DEFAULT 0 NOT NULL,
	"final_rank" integer NOT NULL,
	"correct_answers_count" integer DEFAULT 0 NOT NULL,
	"total_questions_count" integer DEFAULT 0 NOT NULL,
	"answer_details" jsonb DEFAULT '[]'::jsonb NOT NULL
);

DO $$ BEGIN
 ALTER TABLE "themes" ADD CONSTRAINT "themes_professor_id_professors_id_fk" FOREIGN KEY ("professor_id") REFERENCES "public"."professors"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_professor_id_professors_id_fk" FOREIGN KEY ("professor_id") REFERENCES "public"."professors"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_theme_id_themes_id_fk" FOREIGN KEY ("theme_id") REFERENCES "public"."themes"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "questions" ADD CONSTRAINT "questions_quiz_id_quizzes_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "answer_options" ADD CONSTRAINT "answer_options_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_quiz_id_quizzes_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_professor_id_professors_id_fk" FOREIGN KEY ("professor_id") REFERENCES "public"."professors"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "game_session_results" ADD CONSTRAINT "game_session_results_session_id_game_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."game_sessions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "idx_professors_email" ON "professors" USING btree ("email");
CREATE INDEX IF NOT EXISTS "idx_professors_verification_token" ON "professors" ("verification_token") WHERE "verification_token" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_professors_reset_token" ON "professors" USING btree ("reset_token") WHERE "professors"."reset_token" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_themes_professor_id" ON "themes" USING btree ("professor_id");
CREATE INDEX IF NOT EXISTS "idx_themes_system_preset" ON "themes" USING btree ("is_system_preset");
CREATE INDEX IF NOT EXISTS "idx_quizzes_professor_id" ON "quizzes" USING btree ("professor_id");
CREATE INDEX IF NOT EXISTS "idx_quizzes_theme_id" ON "quizzes" USING btree ("theme_id");
CREATE INDEX IF NOT EXISTS "idx_quizzes_title" ON "quizzes" USING btree ("title");
CREATE INDEX IF NOT EXISTS "idx_quizzes_public" ON "quizzes" USING btree ("is_public");
CREATE INDEX IF NOT EXISTS "idx_quizzes_level" ON "quizzes" USING btree ("level");
CREATE INDEX IF NOT EXISTS "idx_quizzes_subject" ON "quizzes" USING btree ("subject");
CREATE INDEX IF NOT EXISTS "idx_quizzes_folder" ON "quizzes" USING btree ("folder");
CREATE INDEX IF NOT EXISTS "idx_quizzes_tags" ON "quizzes" USING gin ("tags");
CREATE INDEX IF NOT EXISTS "idx_questions_quiz_id" ON "questions" USING btree ("quiz_id");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_questions_quiz_order" ON "questions" USING btree ("quiz_id","order_index");
CREATE INDEX IF NOT EXISTS "idx_answer_options_question_id" ON "answer_options" USING btree ("question_id");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_answer_options_question_order" ON "answer_options" USING btree ("question_id","order_index");
CREATE INDEX IF NOT EXISTS "idx_game_sessions_quiz_id" ON "game_sessions" USING btree ("quiz_id");
CREATE INDEX IF NOT EXISTS "idx_game_sessions_professor" ON "game_sessions" USING btree ("professor_id","started_at");
CREATE INDEX IF NOT EXISTS "idx_game_sessions_pin" ON "game_sessions" USING btree ("pin");
CREATE INDEX IF NOT EXISTS "idx_game_sessions_active_pin" ON "game_sessions" USING btree ("pin") WHERE "game_sessions"."status" IN ('LOBBY', 'IN_PROGRESS');
CREATE INDEX IF NOT EXISTS "idx_game_sessions_ended_at" ON "game_sessions" USING btree ("ended_at") WHERE "game_sessions"."status" = 'FINISHED';
CREATE INDEX IF NOT EXISTS "idx_game_sessions_status_expires" ON "game_sessions" USING btree ("status","expires_at");
CREATE INDEX IF NOT EXISTS "idx_game_sessions_class_group" ON "game_sessions" USING btree ("class_group");
CREATE INDEX IF NOT EXISTS "idx_game_session_results_session_id" ON "game_session_results" USING btree ("session_id");
CREATE INDEX IF NOT EXISTS "idx_game_session_results_rank" ON "game_session_results" USING btree ("session_id","final_rank");
