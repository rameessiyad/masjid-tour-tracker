# Noorul islam masjid tour plan

നൂറുൽ ഇസ്‌ലാം മസ്ജിദ് — a small, mobile-first app to track tour participants and how much each has paid.

- **Data per participant:** `id`, `name`, `amount_paid` (₹, zero or more). Nothing else.
- **Dashboard:** total participants and total amount collected (both calculated by PostgreSQL).
- **Features:** add / edit / delete (with confirmation), search by name, downloadable A4 PDF report.
- **No login.** Anyone with the link can edit, so share the link only with organizers.
- **Stack:** React + Vite + Tailwind (JavaScript) · Node + Express · Neon PostgreSQL.

```
tour-management/
├── client/   React app (Vite, Tailwind)
└── server/   Express API + scripts
```

---

## 1. Prerequisites

- Node.js 18 or newer (`node -v`)
- A free Neon account (https://neon.tech)

## 2. Create the Neon database

1. Sign in to Neon and click **New Project** (any name, e.g. `masjid-tour`).
2. On the project dashboard click **Connect** and copy the **connection string**. It looks like
   `postgresql://user:password@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require`.

## 3. Configure `server/.env`

```bash
cd server
cp .env.example .env
```

Open `server/.env` and paste your string:

```
DATABASE_URL=postgresql://user:password@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require
PORT=5000
CLIENT_URL=http://localhost:5173
```

`.env` is git-ignored. **Never** put `DATABASE_URL` in the client.

## 4. Install dependencies

```bash
cd server && npm install
cd ../client && npm install
```

## 5. Create the database table

Nothing to run. The server creates the `participants` table automatically the first time it starts (and `npm run seed` does too).

## 6. Add the sample participants (once)

```bash
cd server
npm run seed
```

This inserts 10 sample participants. Running it again prints "Already seeded" and does nothing, so there are never duplicates. The sample list is in `server/src/utils/sampleParticipants.js`.

## 7. Run locally

Two terminals:

```bash
# terminal 1
cd server && npm run dev        # http://localhost:5000

# terminal 2
cd client && npm run dev        # http://localhost:5173
```

**Try it on your phone:** the dev server is reachable on your network. Connect the phone to the same Wi-Fi and open the "Network" address Vite prints (e.g. `http://192.168.1.20:5173`).

Quick check that the API reaches the database: open http://localhost:5000/api/health — it should say `"database":"connected"`.

## 8. Test every operation

| Action | How | Expected |
| --- | --- | --- |
| Add | Tap **Add participant**, enter a name and amount, save | Row appears, totals update |
| Validation | Save with an empty name | "Name is required" |
| Edit | Tap the pencil on a row, change name/amount, save | Row and totals update |
| Search | Type part of a name in the search box | List narrows; clear with ✕ |
| Delete | Tap the trash icon, then **Delete** | Row removed, totals update (Cancel keeps it) |
| Persistence | Refresh the page / restart the server | Data is still there |

## 9. Download the PDF

Tap **Download PDF Report**. You get an A4 file named `Noorul-Islam-Masjid-Tour-Report-YYYY-MM-DD.pdf` with the title, Malayalam heading, report date, a table of **every** participant (No., Name, Amount Paid ₹), the total participants and total collected, and "Made by Ramees Siyad" with the page number at the bottom of every page. The PDF always uses fresh data from the database, even if a search is active on screen.

Malayalam text (the heading and any Malayalam names) is drawn by the browser with the Noto Sans Malayalam font, because the PDF library cannot shape Malayalam itself. The first PDF may take a second while fonts load.

## 10. Remove the sample data before real use

```bash
cd server
npm run seed:clear
```

This deletes only rows whose name exactly matches a sample name. Real participants are untouched, and the samples will not come back on later `npm run seed` runs. You can also just delete them one by one in the app.

To use your own starting list instead, edit `server/src/utils/sampleParticipants.js` **before** the first `npm run seed`.

## 11. Deploy

**Database** — already on Neon.

**Backend** (Render, Railway, Fly.io, etc.)
- Root directory: `server` · Build: `npm install` · Start: `npm start`
- Environment variables:
  - `DATABASE_URL` — your Neon string
  - `CLIENT_URL` — your frontend's exact address, e.g. `https://masjid-tour.vercel.app` (no trailing path). Several addresses can be comma-separated.
  - `PORT` is usually set by the host.
- Check `https://YOUR-API/api/health`.
- Free hosts sleep when idle, so the first load after a while can take ~30 seconds.

**Frontend** (Vercel, Netlify, Cloudflare Pages)
- Root directory: `client` · Build: `npm run build` · Output: `dist`
- Environment variable: `VITE_API_URL=https://YOUR-API/api` (it is public, so it must hold only the API address)
- Set this **before** building; Vite bakes it in at build time.

**CORS:** the backend only accepts browsers from `CLIENT_URL`. If the app loads but shows "Cannot reach the server", the usual cause is `CLIENT_URL` not matching the frontend's address exactly.

## npm scripts

| Where | Script | What it does |
| --- | --- | --- |
| server | `npm run dev` | Start API with auto-restart |
| server | `npm start` | Start API (production) |
| server | `npm run seed` | Insert sample participants once |
| server | `npm run seed:clear` | Remove the sample participants |
| client | `npm run dev` | Dev server |
| client | `npm run build` | Production build into `dist/` |
| client | `npm run preview` | Preview the production build |

## API

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/health` | API + database check |
| GET | `/api/dashboard` | `{ total_participants, total_collected }` |
| GET | `/api/participants?search=` | List, optional name search |
| GET | `/api/participants/:id` | One participant |
| POST | `/api/participants` | Body `{ name, amount_paid }` |
| PUT | `/api/participants/:id` | Body `{ name, amount_paid }` |
| DELETE | `/api/participants/:id` | |

Responses are `{ success: true, data }` or `{ success: false, message, errors? }`. `amount_paid` must be `0` or more with at most 2 decimals; it is checked in the browser, in the API, and by a database `CHECK` constraint.
