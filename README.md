# Purrfect Match 🐾
A playful, portfolio-grade cat rescue and adoption platform concept for Mumbai and nearby areas.

## Stage 1 — UI prototype
- Responsive homepage and navigation
- Cat listing with search, neighbourhood and status filters
- Rescue report form with client-side validation
- Demo admin dashboard that can display the current browser session's latest report
- Tailwind styling and reusable cat cards

**Important:** All cat profiles and dashboard metrics are sample data. The report form is a prototype only; it does not contact rescue organizations. The admin page is not authenticated. Do not deploy this prototype as a real rescue intake system before Stage 2 security and backend work.

## Requirements
- Node.js 20.9 or later
- npm

## Run locally
```bash
npm install
npm run dev
```
Open http://localhost:3000

Routes:
- `/` — home
- `/adopt` — cat listing and filters
- `/report-rescue` — demo rescue intake form
- `/admin` — demo operations dashboard (not secured)

## Stage 2 plan — Supabase backend
1. Create Supabase project and configure `.env.local` from `.env.example`.
2. Add SQL schema for `profiles`, `cats`, `adoption_applications`, `rescue_reports`, `rescue_updates` and `volunteer_applications`.
3. Enable Row Level Security (RLS) policies for public read-only adoptable cat profiles, private applicant records, and authorized staff-only case access.
4. Add Supabase Auth, server-side role checks, secure image uploads and form rate limiting.
5. Add rescue case history, assignment, adoption review, email notifications and tests.

## Security notes
- Never put a Supabase service-role key in a `NEXT_PUBLIC_` variable.
- Admin pages must be protected server-side; hiding a link is not authorization.
- Do not publicly expose a reporter's phone number, exact home address, or sensitive animal location.
