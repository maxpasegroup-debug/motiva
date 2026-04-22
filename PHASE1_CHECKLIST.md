# Phase 1 Checklist

## Infrastructure and Database
- [x] Added Prisma client singleton at `src/lib/prisma.ts`
- [x] Updated `prisma/schema.prisma` with:
  - [x] `User` auth fields for dual PIN auth (`username`, `mobile`, `pin`, `pinResetRequired`)
  - [x] `PinResetRequest` model for forgot-PIN workflow
- [x] Prisma schema validated (`npx prisma validate`)

## Environment and Config
- [x] Updated `.env.example` with all referenced env vars
- [x] Verified env usage across codebase matches `.env.example`

## Auth APIs
- [x] Existing auth route retained: `POST /api/auth/login`
- [x] Added public user auth:
  - [x] `POST /api/auth/public/signup`
  - [x] `POST /api/auth/public/login`
- [x] Added internal user auth:
  - [x] `POST /api/auth/internal/login`

## Forgot PIN Flow
- [x] Added `POST /api/auth/forgot-pin`
- [x] Added `POST /api/auth/set-new-pin`
- [x] Added admin request management APIs:
  - [x] `GET /api/admin/pin-reset-requests`
  - [x] `POST /api/admin/pin-reset-requests/[id]/approve`

## Middleware and Role Handling
- [x] Updated `src/middleware.ts` for dual token/cookie handling
- [x] Kept `/api/auth/*` public
- [x] Added route guards for role prefixes (`/admin`, `/mentor`, `/teacher`, `/student`, `/parent`)
- [x] Added authenticated guard for `/courses/*`
- [x] Extended role typing with `public` in `src/lib/roles.ts`

## Admin UI
- [x] Added page: `src/app/admin/pin-reset-requests/page.tsx`
- [x] Pending requests table (name, mobile, requested time)
- [x] Approve action with one-time PIN reveal modal

## Validation
- [x] Local production build passes (`npm run build`)
