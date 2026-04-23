# Motiva Edus — Launch Checklist

## Railway Environment Variables (must be set before going live)
- DATABASE_URL — Railway Postgres connection string (auto-set if services are linked)
- JWT_SECRET — random string min 32 characters
- NEXTAUTH_SECRET — random string min 32 characters
- NEXTAUTH_URL — https://motivaedus.in or your Railway URL
- ADMIN_BOOT_EMAIL — first admin email
- ADMIN_BOOT_PASSWORD — first admin password
- CLOUDINARY_CLOUD_NAME — from cloudinary.com dashboard
- CLOUDINARY_API_KEY — from cloudinary.com dashboard
- CLOUDINARY_API_SECRET — from cloudinary.com dashboard
- RAZORPAY_KEY_ID — from razorpay.com dashboard (use live key for production)
- RAZORPAY_KEY_SECRET — from razorpay.com dashboard
- WHATSAPP_PHONE_NUMBER_ID — from Meta Business dashboard
- WHATSAPP_ACCESS_TOKEN — from Meta Business dashboard
- SENTRY_DSN — from sentry.io project settings
- NEXT_PUBLIC_SENTRY_DSN — same as SENTRY_DSN
- UPSTASH_REDIS_REST_URL — from upstash.com (optional but recommended)
- UPSTASH_REDIS_REST_TOKEN — from upstash.com (optional but recommended)

## Manual Steps Before Launch
- [ ] Add icon-192.png and icon-512.png to public/ folder for PWA
- [ ] Add a real hero image to public/ if available (currently using gradient fallback)
- [ ] Add founder photo to public/md.jpg if not already there
- [ ] Set up Razorpay live account and replace test keys with live keys
- [ ] Activate WhatsApp Business API on Meta Business dashboard
- [ ] Set up Upstash Redis for rate limiting
- [ ] Set up Sentry project and add DSN
- [ ] Configure Railway scheduled DB backup
- [ ] Set custom domain motivaedus.in in Railway settings
- [ ] Add at least one teacher in /admin/teachers before launch
- [ ] Add at least one published course in /admin/courses before launch
- [ ] Test Razorpay payment with a real card in test mode before switching to live

## Pre-Launch Test Checklist (run these on live site)
- [ ] / — landing page loads, all 6 sections visible, animations work
- [ ] /courses — public courses grid loads
- [ ] /auth/public/signup — can create a public account
- [ ] /auth/public/login — can login, redirects to /dashboard
- [ ] /login — internal login works for admin username+PIN
- [ ] /admin — admin dashboard loads
- [ ] /admin/leads — can create a new lead, advance through pipeline steps
- [ ] /admin/admissions/remedial — can create remedial admission
- [ ] /admin/teachers — can add a teacher, photo uploads to Cloudinary
- [ ] /admin/courses — can create a course with sections and videos
- [ ] /mentor — mentor dashboard loads with assigned students
- [ ] /student — student dashboard loads with attendance and courses
- [ ] /parent — parent dashboard loads with child info
- [ ] Enquiry form on landing page — submits successfully, appears in /admin/enquiries
- [ ] Razorpay payment flow — test payment completes, lead status updates
- [ ] WhatsApp credential delivery — sends message after account creation

## Database Tables (21 total)
admins, admission_requests, batches, batch_students, batch_progress,
attendance, parents, parent_notifications, student_payment_status,
leads, demos, admissions, programs, users, courses, course_sections,
course_videos, course_enrollments, teachers, enquiries, pin_reset_requests,
student_accounts, parent_accounts, learning_plans, class_schedules,
issues, messages, payment_transactions, audit_log, student_wellbeing

## Architecture Summary
- Framework: Next.js 14, TypeScript, Tailwind CSS
- Database: PostgreSQL via Prisma ORM
- Auth: JWT (RS256), bcrypt PIN hashing, dual auth system
- Payments: Razorpay
- Video: YouTube/Vimeo embed URLs
- Images: Cloudinary
- Notifications: WhatsApp Business API + in-app
- Deployment: Railway (auto-deploy from GitHub main branch)
- Error tracking: Sentry
- Rate limiting: Upstash Redis (optional)
