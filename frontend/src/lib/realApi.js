// Real API client. Endpoint list = the contract to agree with the backend team.
// All routes are relative to VITE_API_URL (default /api). Auth uses "Authorization: Bearer <JWT>".
//
//  POST   /auth/signup                 {name,email,password,department,year}  -> {token,user}
//  POST   /auth/login                  {email,password}                       -> {token,user}
//  GET    /auth/me                                                            -> user
//  PUT    /users/me                    {name,department,year,bio}             -> user
//
//  GET    /resources?q=&category=                                             -> resource[]
//  GET    /resources/mine                                                     -> resource[]
//  GET    /resources/:id                                                      -> resource
//  POST   /resources                   multipart: title,description,category,condition,photo(file)
//  PUT    /resources/:id               multipart (same fields, photo optional)
//  DELETE /resources/:id
//
//  POST   /resources/:id/requests      {message}                              -> request
//  GET    /requests/sent                                                      -> request[]
//  GET    /requests/received                                                  -> request[]
//  PATCH  /requests/:id                {status: "accepted" | "declined"}      -> request
//
//  GET    /mentors?q=                                                         -> mentor[]
//  GET    /mentors/mine                                                       -> mentor[]
//  POST   /mentors                     {subject,bio,availability}             -> mentor
//  DELETE /mentors/:id
//  POST   /mentors/:id/requests        {message}                              -> mentorship request
//  GET    /mentorship-requests/sent                                           -> mentorship request[]
//  GET    /mentorship-requests/received                                       -> mentorship request[]
//  PATCH  /mentorship-requests/:id     {status: "accepted" | "declined"}
//
// Shapes are documented in README.md. If the backend returns {data: ...}, adjust `unwrap` below.

import { getToken } from "./token";

const BASE = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

const unwrap = (body) => (body && typeof body === "object" && "data" in body ? body.data : body);

async function http(path, { method = "GET", body, form } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers["Content-Type"] = "application/json";

  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: form ?? (body ? JSON.stringify(body) : undefined),
    });
  } catch {
    throw new Error("Can't reach the server. Check your connection and try again.");
  }

  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    /* non-JSON response */
  }
  if (!res.ok) {
    throw new Error(json?.message || json?.error || `Request failed (${res.status})`);
  }
  return unwrap(json);
}

const qs = (params) => {
  const p = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => v && p.set(k, v));
  const s = p.toString();
  return s ? `?${s}` : "";
};

const toForm = ({ photo, ...fields }) => {
  const f = new FormData();
  Object.entries(fields).forEach(([k, v]) => v != null && f.append(k, v));
  if (photo instanceof File) f.append("photo", photo);
  return f;
};

export const realApi = {
  auth: {
    login: (b) => http("/auth/login", { method: "POST", body: b }),
    signup: (b) => http("/auth/signup", { method: "POST", body: b }),
    me: () => http("/auth/me"),
  },
  profile: {
    update: (b) => http("/users/me", { method: "PUT", body: b }),
  },
  resources: {
    list: (params) => http(`/resources${qs(params)}`),
    mine: () => http("/resources/mine"),
    get: (id) => http(`/resources/${id}`),
    create: (data) => http("/resources", { method: "POST", form: toForm(data) }),
    update: (id, data) => http(`/resources/${id}`, { method: "PUT", form: toForm(data) }),
    remove: (id) => http(`/resources/${id}`, { method: "DELETE" }),
  },
  requests: {
    create: (resourceId, message) =>
      http(`/resources/${resourceId}/requests`, { method: "POST", body: { message } }),
    sent: () => http("/requests/sent"),
    received: () => http("/requests/received"),
    respond: (id, status) => http(`/requests/${id}`, { method: "PATCH", body: { status } }),
  },
  mentors: {
    list: (params) => http(`/mentors${qs(params)}`),
    mine: () => http("/mentors/mine"),
    offer: (b) => http("/mentors", { method: "POST", body: b }),
    remove: (id) => http(`/mentors/${id}`, { method: "DELETE" }),
  },
  mentorship: {
    request: (mentorId, message) =>
      http(`/mentors/${mentorId}/requests`, { method: "POST", body: { message } }),
    sent: () => http("/mentorship-requests/sent"),
    received: () => http("/mentorship-requests/received"),
    respond: (id, status) =>
      http(`/mentorship-requests/${id}`, { method: "PATCH", body: { status } }),
  },
};
