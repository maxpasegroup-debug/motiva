-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "admins" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" VARCHAR(32) NOT NULL DEFAULT 'admin',

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "mobile" VARCHAR(16),
    "email" VARCHAR(255),
    "username" VARCHAR(64),
    "phone" VARCHAR(64),
    "pin" TEXT,
    "role" VARCHAR(32) NOT NULL DEFAULT 'public',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "pin_reset_required" BOOLEAN NOT NULL DEFAULT false,
    "created_by" VARCHAR(255),
    "profile_data" JSONB,
    "password_hash" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unified_users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "mobile" VARCHAR(16) NOT NULL,
    "pin" TEXT NOT NULL,
    "role" VARCHAR(32) NOT NULL DEFAULT 'public',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "pin_reset_required" BOOLEAN NOT NULL DEFAULT false,
    "created_by" VARCHAR(255),
    "profile_data" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "unified_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pin_reset_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "mobile" VARCHAR(16) NOT NULL,
    "status" VARCHAR(16) NOT NULL DEFAULT 'pending',
    "requested_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMPTZ,
    "resolved_by" UUID,

    CONSTRAINT "pin_reset_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" VARCHAR(512) NOT NULL,
    "thumbnail" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "target_role" VARCHAR(32) NOT NULL,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" VARCHAR(32) NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_sections" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "course_id" UUID NOT NULL,
    "type" VARCHAR(16) NOT NULL,
    "section_title" VARCHAR(512) NOT NULL,
    "order" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_videos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "section_id" UUID NOT NULL,
    "video_title" VARCHAR(512) NOT NULL,
    "video_url" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_videos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_enrollments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "enrolled_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "progress" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "course_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teachers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "subject" VARCHAR(255) NOT NULL,
    "bio" TEXT,
    "photo" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "teachers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enquiries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "mobile" VARCHAR(32) NOT NULL,
    "program_interest" VARCHAR(128) NOT NULL,
    "message" TEXT,
    "status" VARCHAR(32) NOT NULL DEFAULT 'new',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enquiries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "programs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" VARCHAR(512) NOT NULL,
    "description" TEXT NOT NULL,
    "image_path" TEXT NOT NULL DEFAULT '',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admission_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "student_name" VARCHAR(255) NOT NULL,
    "parent_name" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(64) NOT NULL,
    "program_id" VARCHAR(64) NOT NULL,
    "status" VARCHAR(32) NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admission_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "batches" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(512) NOT NULL,
    "teacher_id" VARCHAR(255) NOT NULL,
    "duration" INTEGER NOT NULL,
    "start_date" DATE,
    "unlocked_day" INTEGER NOT NULL DEFAULT 1,
    "completed_days" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "batch_students" (
    "student_id" VARCHAR(255) NOT NULL,
    "batch_id" UUID NOT NULL,

    CONSTRAINT "batch_students_pkey" PRIMARY KEY ("student_id")
);

-- CreateTable
CREATE TABLE "batch_progress" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "batch_id" UUID NOT NULL,
    "current_day" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "batch_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "student_id" VARCHAR(255) NOT NULL,
    "batch_id" UUID NOT NULL,
    "day_number" INTEGER NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "marked_by" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parents" (
    "id" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(64) NOT NULL,
    "phone_normalized" VARCHAR(32) NOT NULL,
    "student_id" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parent_notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "parent_id" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_read" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "parent_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_payment_status" (
    "student_id" VARCHAR(255) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_payment_status_pkey" PRIMARY KEY ("student_id")
);

-- CreateTable
CREATE TABLE "payment_transactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "lead_id" UUID,
    "order_id" VARCHAR(255),
    "razorpay_payment_id" VARCHAR(255),
    "student_id" VARCHAR(255) NOT NULL,
    "student_name" VARCHAR(255) NOT NULL,
    "course_label" VARCHAR(255) NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "currency" VARCHAR(8) NOT NULL DEFAULT 'INR',
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "recorded_by" VARCHAR(255),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(64) NOT NULL,
    "type" VARCHAR(32) NOT NULL,
    "subjects" TEXT,
    "status" VARCHAR(32) NOT NULL DEFAULT 'new',
    "flow_type" VARCHAR(32) NOT NULL DEFAULT 'tuition',
    "assigned_to" VARCHAR(255),
    "assigned_mentor_id" UUID,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "student_name" VARCHAR(255) NOT NULL,
    "parent_name" VARCHAR(255) NOT NULL,
    "mobile" VARCHAR(16) NOT NULL,
    "email" VARCHAR(255),
    "username" VARCHAR(64) NOT NULL,
    "pin" TEXT NOT NULL,
    "pin_reset_required" BOOLEAN NOT NULL DEFAULT false,
    "role" VARCHAR(32) NOT NULL DEFAULT 'student',
    "batch_id" UUID,
    "mentor_id" UUID,
    "teacher_id" UUID,
    "program_type" VARCHAR(32) NOT NULL,
    "admission_status" VARCHAR(32) NOT NULL DEFAULT 'active',
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "student_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parent_accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "name" VARCHAR(255) NOT NULL,
    "mobile" VARCHAR(16) NOT NULL,
    "username" VARCHAR(64) NOT NULL,
    "pin" TEXT NOT NULL,
    "role" VARCHAR(32) NOT NULL DEFAULT 'parent',
    "student_id" UUID NOT NULL,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "parent_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_wellbeing" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "student_id" UUID NOT NULL,
    "rating" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_wellbeing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "lead_id" UUID NOT NULL,
    "demo_executive_id" VARCHAR(255) NOT NULL,
    "status" VARCHAR(32) NOT NULL DEFAULT 'pending',
    "result" VARCHAR(32),
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "demos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "lead_id" UUID NOT NULL,
    "student_name" VARCHAR(255) NOT NULL,
    "parent_name" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(64) NOT NULL,
    "type" VARCHAR(32) NOT NULL,
    "status" VARCHAR(32) NOT NULL DEFAULT 'pending',
    "fee_amount_cents" INTEGER,
    "fee_currency" VARCHAR(8) DEFAULT 'INR',
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "admissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "actor_id" VARCHAR(255),
    "actor_role" VARCHAR(32),
    "action" VARCHAR(128) NOT NULL,
    "entity_type" VARCHAR(64),
    "entity_id" VARCHAR(255),
    "meta" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentor_notes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "mentor_id" VARCHAR(255) NOT NULL,
    "student_id" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "mentor_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_plans" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "student_id" UUID NOT NULL,
    "title" VARCHAR(512) NOT NULL DEFAULT 'Learning Plan',
    "description" TEXT,
    "batch_id" UUID,
    "start_date" DATE,
    "end_date" DATE,
    "status" VARCHAR(32) NOT NULL DEFAULT 'active',
    "subjects" JSONB,
    "goals" TEXT,
    "revision_cycle" VARCHAR(32),
    "notes" TEXT,
    "created_by" VARCHAR(255),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "learning_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_schedules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "batch_id" UUID,
    "day_number" INTEGER,
    "scheduled_at" TIMESTAMPTZ,
    "topic" VARCHAR(512),
    "student_id" UUID,
    "teacher_id" UUID,
    "mentor_id" UUID,
    "subject" VARCHAR(255),
    "class_type" VARCHAR(32),
    "scheduled_date" DATE,
    "scheduled_time" VARCHAR(16),
    "duration_minutes" INTEGER NOT NULL DEFAULT 60,
    "notes" TEXT,
    "status" VARCHAR(32) NOT NULL DEFAULT 'scheduled',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "class_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "issues" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "reported_by" VARCHAR(255) NOT NULL,
    "assigned_to" VARCHAR(255),
    "student_id" UUID,
    "raised_by_id" UUID,
    "assigned_to_id" UUID,
    "entity_type" VARCHAR(64),
    "entity_id" VARCHAR(255),
    "title" VARCHAR(512) NOT NULL,
    "category" VARCHAR(32),
    "description" TEXT,
    "priority" VARCHAR(16) NOT NULL DEFAULT 'medium',
    "status" VARCHAR(32) NOT NULL DEFAULT 'open',
    "timeline" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "issues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sender_id" VARCHAR(255) NOT NULL,
    "receiver_id" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_mobile_idx" ON "users"("mobile");

-- CreateIndex
CREATE UNIQUE INDEX "unified_users_mobile_key" ON "unified_users"("mobile");

-- CreateIndex
CREATE INDEX "unified_users_mobile_idx" ON "unified_users"("mobile");

-- CreateIndex
CREATE INDEX "unified_users_role_idx" ON "unified_users"("role");

-- CreateIndex
CREATE INDEX "pin_reset_requests_status_requested_at_idx" ON "pin_reset_requests"("status", "requested_at" DESC);

-- CreateIndex
CREATE INDEX "pin_reset_requests_user_id_idx" ON "pin_reset_requests"("user_id");

-- CreateIndex
CREATE INDEX "courses_status_idx" ON "courses"("status");

-- CreateIndex
CREATE INDEX "courses_target_role_idx" ON "courses"("target_role");

-- CreateIndex
CREATE INDEX "course_sections_course_id_order_idx" ON "course_sections"("course_id", "order");

-- CreateIndex
CREATE INDEX "course_videos_section_id_order_idx" ON "course_videos"("section_id", "order");

-- CreateIndex
CREATE INDEX "course_enrollments_user_id_idx" ON "course_enrollments"("user_id");

-- CreateIndex
CREATE INDEX "course_enrollments_course_id_idx" ON "course_enrollments"("course_id");

-- CreateIndex
CREATE UNIQUE INDEX "course_enrollments_user_id_course_id_key" ON "course_enrollments"("user_id", "course_id");

-- CreateIndex
CREATE INDEX "teachers_display_order_created_at_idx" ON "teachers"("display_order", "created_at");

-- CreateIndex
CREATE INDEX "enquiries_status_created_at_idx" ON "enquiries"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "admission_requests_status_idx" ON "admission_requests"("status");

-- CreateIndex
CREATE INDEX "admission_requests_created_at_idx" ON "admission_requests"("created_at" DESC);

-- CreateIndex
CREATE INDEX "batches_teacher_id_idx" ON "batches"("teacher_id");

-- CreateIndex
CREATE INDEX "batch_students_batch_id_idx" ON "batch_students"("batch_id");

-- CreateIndex
CREATE UNIQUE INDEX "batch_progress_batch_id_key" ON "batch_progress"("batch_id");

-- CreateIndex
CREATE INDEX "batch_progress_batch_id_idx" ON "batch_progress"("batch_id");

-- CreateIndex
CREATE INDEX "attendance_batch_id_day_number_idx" ON "attendance"("batch_id", "day_number");

-- CreateIndex
CREATE INDEX "attendance_batch_id_idx" ON "attendance"("batch_id");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_student_id_batch_id_day_number_key" ON "attendance"("student_id", "batch_id", "day_number");

-- CreateIndex
CREATE UNIQUE INDEX "parents_student_id_key" ON "parents"("student_id");

-- CreateIndex
CREATE INDEX "parents_phone_normalized_idx" ON "parents"("phone_normalized");

-- CreateIndex
CREATE INDEX "parent_notifications_parent_id_created_at_idx" ON "parent_notifications"("parent_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "payment_transactions_lead_id_idx" ON "payment_transactions"("lead_id");

-- CreateIndex
CREATE INDEX "payment_transactions_student_id_idx" ON "payment_transactions"("student_id");

-- CreateIndex
CREATE INDEX "payment_transactions_order_id_idx" ON "payment_transactions"("order_id");

-- CreateIndex
CREATE INDEX "payment_transactions_razorpay_payment_id_idx" ON "payment_transactions"("razorpay_payment_id");

-- CreateIndex
CREATE INDEX "payment_transactions_status_idx" ON "payment_transactions"("status");

-- CreateIndex
CREATE INDEX "leads_status_idx" ON "leads"("status");

-- CreateIndex
CREATE INDEX "leads_assigned_to_idx" ON "leads"("assigned_to");

-- CreateIndex
CREATE INDEX "leads_flow_type_idx" ON "leads"("flow_type");

-- CreateIndex
CREATE INDEX "leads_assigned_mentor_id_idx" ON "leads"("assigned_mentor_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_accounts_user_id_key" ON "student_accounts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_accounts_mobile_key" ON "student_accounts"("mobile");

-- CreateIndex
CREATE UNIQUE INDEX "student_accounts_username_key" ON "student_accounts"("username");

-- CreateIndex
CREATE INDEX "student_accounts_batch_id_idx" ON "student_accounts"("batch_id");

-- CreateIndex
CREATE INDEX "student_accounts_mentor_id_idx" ON "student_accounts"("mentor_id");

-- CreateIndex
CREATE INDEX "student_accounts_teacher_id_idx" ON "student_accounts"("teacher_id");

-- CreateIndex
CREATE INDEX "student_accounts_created_by_idx" ON "student_accounts"("created_by");

-- CreateIndex
CREATE INDEX "student_accounts_program_type_idx" ON "student_accounts"("program_type");

-- CreateIndex
CREATE UNIQUE INDEX "parent_accounts_user_id_key" ON "parent_accounts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "parent_accounts_mobile_key" ON "parent_accounts"("mobile");

-- CreateIndex
CREATE UNIQUE INDEX "parent_accounts_username_key" ON "parent_accounts"("username");

-- CreateIndex
CREATE INDEX "parent_accounts_student_id_idx" ON "parent_accounts"("student_id");

-- CreateIndex
CREATE INDEX "parent_accounts_created_by_idx" ON "parent_accounts"("created_by");

-- CreateIndex
CREATE INDEX "student_wellbeing_student_id_date_idx" ON "student_wellbeing"("student_id", "date" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "student_wellbeing_student_id_date_key" ON "student_wellbeing"("student_id", "date");

-- CreateIndex
CREATE INDEX "demos_lead_id_idx" ON "demos"("lead_id");

-- CreateIndex
CREATE INDEX "demos_demo_executive_id_idx" ON "demos"("demo_executive_id");

-- CreateIndex
CREATE INDEX "admissions_lead_id_idx" ON "admissions"("lead_id");

-- CreateIndex
CREATE INDEX "admissions_status_idx" ON "admissions"("status");

-- CreateIndex
CREATE INDEX "audit_log_actor_id_idx" ON "audit_log"("actor_id");

-- CreateIndex
CREATE INDEX "audit_log_entity_type_entity_id_idx" ON "audit_log"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_log_created_at_idx" ON "audit_log"("created_at" DESC);

-- CreateIndex
CREATE INDEX "mentor_notes_mentor_id_idx" ON "mentor_notes"("mentor_id");

-- CreateIndex
CREATE INDEX "mentor_notes_student_id_idx" ON "mentor_notes"("student_id");

-- CreateIndex
CREATE INDEX "learning_plans_student_id_idx" ON "learning_plans"("student_id");

-- CreateIndex
CREATE INDEX "class_schedules_student_id_idx" ON "class_schedules"("student_id");

-- CreateIndex
CREATE INDEX "class_schedules_teacher_id_idx" ON "class_schedules"("teacher_id");

-- CreateIndex
CREATE INDEX "class_schedules_mentor_id_idx" ON "class_schedules"("mentor_id");

-- CreateIndex
CREATE INDEX "class_schedules_scheduled_date_idx" ON "class_schedules"("scheduled_date");

-- CreateIndex
CREATE INDEX "class_schedules_batch_id_idx" ON "class_schedules"("batch_id");

-- CreateIndex
CREATE INDEX "issues_reported_by_idx" ON "issues"("reported_by");

-- CreateIndex
CREATE INDEX "issues_assigned_to_idx" ON "issues"("assigned_to");

-- CreateIndex
CREATE INDEX "issues_student_id_idx" ON "issues"("student_id");

-- CreateIndex
CREATE INDEX "issues_raised_by_id_idx" ON "issues"("raised_by_id");

-- CreateIndex
CREATE INDEX "issues_assigned_to_id_idx" ON "issues"("assigned_to_id");

-- CreateIndex
CREATE INDEX "issues_status_idx" ON "issues"("status");

-- CreateIndex
CREATE INDEX "messages_sender_id_idx" ON "messages"("sender_id");

-- CreateIndex
CREATE INDEX "messages_receiver_id_idx" ON "messages"("receiver_id");

-- CreateIndex
CREATE INDEX "messages_sender_id_receiver_id_created_at_idx" ON "messages"("sender_id", "receiver_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "pin_reset_requests" ADD CONSTRAINT "pin_reset_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_sections" ADD CONSTRAINT "course_sections_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_videos" ADD CONSTRAINT "course_videos_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "course_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch_students" ADD CONSTRAINT "batch_students_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch_progress" ADD CONSTRAINT "batch_progress_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_notifications" ADD CONSTRAINT "parent_notifications_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "parents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_assigned_mentor_id_fkey" FOREIGN KEY ("assigned_mentor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_accounts" ADD CONSTRAINT "student_accounts_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_accounts" ADD CONSTRAINT "student_accounts_mentor_id_fkey" FOREIGN KEY ("mentor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_accounts" ADD CONSTRAINT "student_accounts_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_accounts" ADD CONSTRAINT "student_accounts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_accounts" ADD CONSTRAINT "student_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_accounts" ADD CONSTRAINT "parent_accounts_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_accounts" ADD CONSTRAINT "parent_accounts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_accounts" ADD CONSTRAINT "parent_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_wellbeing" ADD CONSTRAINT "student_wellbeing_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demos" ADD CONSTRAINT "demos_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admissions" ADD CONSTRAINT "admissions_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_plans" ADD CONSTRAINT "learning_plans_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_schedules" ADD CONSTRAINT "class_schedules_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_schedules" ADD CONSTRAINT "class_schedules_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issues" ADD CONSTRAINT "issues_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

