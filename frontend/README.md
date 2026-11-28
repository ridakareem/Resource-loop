# ResourceLoop Frontend

React (Vite) + Tailwind CSS v4. Covers all 6 features from the plan: sign up / log in, profile, add / edit / delete a resource, browse + search + category filter, requests (accept / decline), and basic mentorship.

## Run it

```bash
npm install
cp .env.example .env     # already done if you got the zip with .env
npm run dev              # http://localhost:3000
```

Port 3000 matches `CORS_ORIGIN` in the backend `.env.example`.

Demo login in sample-data mode: `demo@student.edu` / `demo1234` (the login page has a "Fill in the demo account" button).

## Two modes (one env variable)

| `VITE_USE_MOCK` | What happens |
|---|---|
| `true` (default) | Runs on sample data stored in the browser. No backend needed. Use this for the "build pages with sample data" phase (by 24 Oct). |
| `false` | Calls the real Express API at `VITE_API_URL` (`/api`, proxied to `http://localhost:5000` by Vite). Use this for the "switch to the real API" phase (25 to 28 Oct). |

Pages never call `fetch` directly. They only use `src/lib/api.js`, so switching modes needs **no page changes**.
To reset sample data, clear `rl_mock_db_v1` in the browser's local storage.

## Folder map

```
src/
  lib/
    api.js          switch between mock and real
    realApi.js      real API client + the endpoint list to agree with backend (top comment)
    mockApi.js      sample data + fake backend (same method names and shapes)
    constants.js    categories, conditions, departments, helpers
  context/          AuthContext (JWT in localStorage), ToastContext
  components/       Navbar, Footer, ResourceCard, Modal, Field, StatusBadge, CategoryArt ...
  pages/
    Home, Login, Signup            -> Frontend 1 (login + profile)
    Profile                        -> Frontend 1 (profile) + 4 (requests, mentorship tabs)
    ResourceForm, ResourceDetail   -> Frontend 2 (add / edit) 
    Browse                         -> Frontend 3 (browse + search)
    Mentors, Profile tabs          -> Frontend 4 (requests + mentorship)
```

## What the backend must return (data shapes)

```
user      {id, name, email, department, year, bio}
resource  {id, title, description, category, condition, photo_url, created_at, owner:{id,name,department,year}}
request   {id, message, status: "pending"|"accepted"|"declined", created_at,
           resource:{id,title,category,photo_url}, requester:{...}, owner:{...}}
mentor    {id, subject, bio, availability, created_at, user:{id,name,department,year}}
mentorship request {id, message, status, created_at, mentor:{id,subject,user}, requester:{...}}
```

- Categories are the ids `textbooks, lab, drafting, electronics, notes, other`. Conditions: `New, Like new, Good, Fair`.
- Photo upload is `multipart/form-data` with field name `photo` (matches `multer` in the backend).
- Errors: return JSON `{ "message": "..." }`. The UI shows that text to the user.
- Once a request is accepted, include `email` on the other person's object so they can arrange pickup.
- If the backend wraps responses as `{ data: ... }`, that is unwrapped automatically.

## Deploy (Vercel)

Build command `npm run build`, output `dist`. Set `VITE_USE_MOCK=false` and `VITE_API_URL=https://<your-render-app>/api`.
Add a `vercel.json` rewrite of all routes to `/index.html` so refreshing `/browse` works.
