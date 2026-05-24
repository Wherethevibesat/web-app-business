# WTVA Business Web

Venue owner web portal — dashboard, browse talent, bookings, promotions.

**Also available on mobile** (Flutter: `c:\src\thisishtx`). Use web for desktop workflows; mobile for full onboarding and verification upload.

## Quick start

1. Copy env from admin project or `.env.example` → `.env.local`
2. `npm install` && `npm run dev` → http://localhost:3002

## Environment variables

| Variable | Required |
|----------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes |
| `NEXT_PUBLIC_SITE_URL` | Production URL |
| `NEXT_PUBLIC_CUSTOMER_APP_URL` | Link to customer web (optional) |

Register with **venue owner** role. An admin must assign your venue (`owner_id`) for bookings and promotions to work.

## Features (v1)

- Login / register (`venueOwner`)
- Dashboard stats, browse talent, create bookings
- Promotions list + create
- Settings, onboarding stub

## Deploy (Vercel)

Suggested URL: `business.wherethevibesat.com`

Set env vars for **Production** and **Preview**, then redeploy.

## Related

- Admin: `wtva-web-admin` (:3000)
- Customer web: `wtva-web-customer` (:3001)
