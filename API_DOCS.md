# Requests & Mentorship API

Base URL: `http://localhost:5000` · All endpoints require `Authorization: Bearer <JWT>`.

**Response format**
```json
{ "success": true,  "message": "…", "data": { } }
{ "success": false, "message": "…", "errors": ["optional list"] }
```
**Status codes:** 200 OK · 201 Created · 400 validation · 401 unauthenticated (auth middleware) · 403 forbidden · 404 not found · 409 conflict/duplicate · 500 server error

**Rules implemented:** status values are `pending` → `accepted` | `declined`. A request can only be answered once (while `pending`). Duplicate = same user already has a `pending` or `accepted` request for the same resource/mentor (a declined one may be re-sent).

---
## 1. Resource Requests

### POST /api/requests
Body: `{ "resource_id": "abc123", "message": "Can I borrow this?" }` (message optional, ≤500 chars)
201:
```json
{ "success": true, "message": "Resource request sent successfully",
  "data": { "id": 1, "resource_id": "abc123", "requester_id": "u-A", "status": "pending", "message": "Can I borrow this?", "created_at": "2026-11-19T10:00:00Z" } }
```
Errors: 400 (missing/invalid resource_id, own resource) · 404 resource not found · 409 duplicate.

### GET /api/requests
Requests made by the logged-in user (newest first). 200 → `data: [ {request}, … ]`

### GET /api/requests/received
Requests for resources owned by the logged-in user. 200 → `data: [ {request}, … ]` (empty array if none)

### PATCH /api/requests/:id/status
Body: `{ "status": "accepted" }` or `{ "status": "declined" }`
200: `{ "success": true, "message": "Request accepted successfully", "data": { …updated request } }`
Errors: 400 invalid status/id · 403 not the resource owner · 404 not found · 409 already responded.

---
## 2. Mentors

### POST /api/mentors
Body: `{ "expertise": "Web Development", "bio": "…", "availability": "Weekends 6-8 PM" }`
201: `{ "success": true, "message": "Registered as mentor successfully", "data": { "id": 1, "user_id": "u-B", "expertise": "Web Development", "bio": "…", "availability": "Weekends 6-8 PM" } }`
Errors: 400 validation (`errors` array) · 409 already a mentor.

### PUT /api/mentors/me
Body: any of `expertise`, `bio`, `availability`. 200 → updated mentor. Errors: 400 · 404 not a mentor.

### GET /api/mentors
200 → `data: [ {mentor}, … ]`

### GET /api/mentors/:id
200 → `data: {mentor}` · 404 not found.

---
## 3. Mentorship Requests

### POST /api/mentorship-requests
Body: `{ "mentor_id": 1, "message": "Please mentor me in React" }`
201:
```json
{ "success": true, "message": "Mentorship request sent successfully",
  "data": { "id": 5, "mentor_id": 1, "mentee_id": "u-A", "status": "pending", "message": "Please mentor me in React", "created_at": "2026-11-19T10:05:00Z" } }
```
Errors: 400 (invalid mentor_id, empty message, self-mentorship) · 404 mentor not found · 409 duplicate.

### GET /api/mentorship-requests
Requests sent by the logged-in user.

### GET /api/mentorship-requests/received
Requests sent to the logged-in mentor. 403 if the user isn't registered as a mentor.

### PATCH /api/mentorship-requests/:id/status
Body: `{ "status": "accepted" | "declined" }`. Errors: 400 · 403 not the mentor · 404 · 409 already responded.
