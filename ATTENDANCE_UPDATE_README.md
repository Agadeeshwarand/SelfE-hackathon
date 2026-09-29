# SelfE Hackathon - Attendance Update

This ZIP is based on the uploaded SelfE Hackathon project and keeps the existing project features.

Added:
- Mentor Attendance page
- Mentor assigned-student attendance marking
- Save draft attendance
- Submit to Coordinator
- Locked attendance after submission
- Admin Attendance page
- Admin filters by date, mentor and status
- Admin attendance detail view
- Admin attendance XLSX/CSV export
- Attendance item in Admin Export Center
- Attendance items in Mentor/Admin sidebars
- Admin notification when a mentor submits attendance
- Fixed the existing mentor-team export `teamCode` build error

Existing student create/delete, mentor management, allocation, team management, contact details and other existing pages were preserved.

## After extracting

Backend:
```powershell
cd backend
npm install
npm run build
npm run dev
```

Frontend:
```powershell
cd frontend
npm install
npm run build
npm run dev
```

The `npm run build` command will update Prisma from the existing schema using the project's current build script.

## New routes

Mentor:
- `/mentor/attendance`

Admin:
- `/admin/attendance`

Export:
- `/api/exports/attendance`
