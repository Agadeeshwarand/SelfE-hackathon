# HackForge 2026 — Hackathon Management Platform

A production-style hackathon operations platform focused on the current Phase 1 scope:

- Student registration and authentication
- Team creation / joining
- Server-side team eligibility validation
- Mentor account management
- Manual mentor-to-team allocation
- Mentor dashboard and assigned-team view
- XLSX / CSV operational exports

## Stack

- Frontend: React + Vite + TypeScript + Tailwind CSS
- Backend: Node.js + Express + TypeScript
- Database: PostgreSQL + Prisma
- Authentication: JWT + bcrypt

## Team rules enforced by backend

1. Exactly 6 members
2. At least 1 female member
3. At least 3 different departments
4. All members must be registered
5. A student can belong to only one team
6. Mentor allocation is capped at 6 teams per mentor
7. A team has at most one guidance mentor

## Run locally

### 1. Database

From the project root:

```bash
docker compose up -d
```

The included compose file maps PostgreSQL to host port `5433`.

Create `backend/.env` using the local values used by your environment. Example:

```env
DATABASE_URL="postgresql://selfe:selfe@127.0.0.1:5433/selfe?schema=public"
JWT_SECRET="change-this-in-production"
PORT=4000
CORS_ORIGIN="http://localhost:5173"
S3_ENDPOINT=""
S3_BUCKET=""
S3_REGION="ap-south-1"
S3_ACCESS_KEY=""
S3_SECRET_KEY=""
```

Then from `backend`:

```bash
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

### 2. Frontend

From `frontend`:

```bash
npm install
npm run dev
```

Open:

`http://localhost:5173`

## Current UI

The frontend has been redesigned as a SaaS-style product UI with:

- Premium public landing page
- Professional authentication screens
- Responsive application shell
- Admin overview dashboard
- Student directory
- Team management
- Mentor management
- Mentor allocation workspace
- Export center
- Participant dashboard / team workspace
- Mentor dashboard / team workspace
- Responsive tables, cards, badges, empty states and loading states

The UI uses the existing REST APIs and real database data; it does not add mock operational records.

## Not included in this version

Evaluation, ranking, shortlisting, dynamic rounds, certificates, advanced notifications and audit-log workflows are intentionally outside the current implementation scope.
