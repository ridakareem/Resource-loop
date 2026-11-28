# Integration notes (share with teammate)

Copy `controllers/`, `routes/`, `utils/common.js` into the shared project, then add to `server.js`:

```js
const requestRoutes = require('./routes/requestRoutes');
const mentorRoutes = require('./routes/mentorRoutes');
const mentorshipRequestRoutes = require('./routes/mentorshipRequestRoutes');

app.use(express.json());                       // must be before the routes
app.use('/api/requests', requestRoutes);
app.use('/api/mentors', mentorRoutes);
app.use('/api/mentorship-requests', mentorshipRequestRoutes);
```

Things to confirm with your teammate (all adjustable in `utils/common.js`):
1. Auth middleware path/export: `middleware/authMiddleware.js`, and it must set `req.user.id`.
2. Supabase client: `config/supabase.js` (server-side only; service role key stays in `.env`).
3. `resources` owner column name (default `owner_id`) → `OWNER_COLUMN`.
4. Status values (default `pending/accepted/declined`) → `STATUS`.
5. `mentorship_requests.mentor_id` references `mentors.id` (not the mentor's user id).
6. "Duplicate rule" = no second pending/accepted request for same resource/mentor.
