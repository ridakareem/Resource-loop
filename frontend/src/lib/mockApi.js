// Sample-data backend that lives in localStorage. Same method names and return shapes as realApi.js,
// so the pages can be built and demoed before the Express API is ready.
import { getToken } from "./token";

const KEY = "rl_mock_db_v1";
const ago = (days) => new Date(Date.now() - days * 86400000).toISOString();

const seed = () => ({
  users: [
    { id: "u0", name: "Demo Student", email: "demo@student.edu", password: "demo1234", department: "Computer Science", year: 3, bio: "Third-year CSE. Happy to pass on first-year books and talk placements." },
    { id: "u1", name: "Ananya Rao", email: "ananya@student.edu", password: "demo1234", department: "Mechanical Engineering", year: 4, bio: "Finishing up. Clearing my drafting kit and thermodynamics notes." },
    { id: "u2", name: "Karthik Menon", email: "karthik@student.edu", password: "demo1234", department: "Electronics and Communication", year: 4, bio: "Embedded systems nerd." },
    { id: "u3", name: "Meera Iyer", email: "meera@student.edu", password: "demo1234", department: "Biotechnology", year: 3, bio: "Lab coat collector." },
    { id: "u4", name: "Rohan Das", email: "rohan@student.edu", password: "demo1234", department: "Civil Engineering", year: 4, bio: "Surveying and structures." },
    { id: "u5", name: "Fatima Sheikh", email: "fatima@student.edu", password: "demo1234", department: "Information Technology", year: 5, bio: "Placed, and glad to help with aptitude and DSA." },
  ],
  resources: [
    { id: "r1", owner_id: "u1", title: "Engineering Graphics drafter set", description: "Mini drafter, set squares, compass and scale. Used for two semesters, everything still works.", category: "drafting", condition: "Good", photo_url: null, created_at: ago(0.2) },
    { id: "r2", owner_id: "u2", title: "Casio fx-991EX scientific calculator", description: "Works perfectly. Allowed in most internal exams. Comes with the cover.", category: "electronics", condition: "Like new", photo_url: null, created_at: ago(0.5) },
    { id: "r3", owner_id: "u3", title: "Lab coat, size M (two available)", description: "Washed and pressed. Useful for chemistry and biology labs in first and second year.", category: "lab", condition: "Good", photo_url: null, created_at: ago(1) },
    { id: "r4", owner_id: "u5", title: "Data Structures and Algorithms in C", description: "Reema Thareja, second edition. A few highlighted pages, no torn sheets.", category: "textbooks", condition: "Good", photo_url: null, created_at: ago(1.4) },
    { id: "r5", owner_id: "u4", title: "Surveying handwritten notes, full semester", description: "Neat notes for the whole syllabus with solved problems from past papers.", category: "notes", condition: "Like new", photo_url: null, created_at: ago(2) },
    { id: "r6", owner_id: "u2", title: "Arduino Uno with USB cable", description: "Original board, tested. Great for the microcontrollers lab.", category: "electronics", condition: "Good", photo_url: null, created_at: ago(2.5) },
    { id: "r7", owner_id: "u1", title: "Engineering Thermodynamics by P. K. Nag", description: "Fifth edition. Cover is worn, content is clean.", category: "textbooks", condition: "Fair", photo_url: null, created_at: ago(3) },
    { id: "r8", owner_id: "u3", title: "Dissection kit", description: "Scalpel, forceps, scissors and probes in a zip case. Sterilised.", category: "lab", condition: "Like new", photo_url: null, created_at: ago(3.5) },
    { id: "r9", owner_id: "u0", title: "Operating System Concepts (Silberschatz)", description: "Ninth edition. Good for the semester 5 OS course.", category: "textbooks", condition: "Good", photo_url: null, created_at: ago(4) },
    { id: "r10", owner_id: "u5", title: "Previous year question papers, CSE sems 3 to 6", description: "Scanned and printed, stapled by semester.", category: "notes", condition: "Good", photo_url: null, created_at: ago(5) },
    { id: "r11", owner_id: "u4", title: "Safety helmet and measuring tape (30 m)", description: "For site visits and the surveying camp.", category: "other", condition: "Good", photo_url: null, created_at: ago(6) },
    { id: "r12", owner_id: "u2", title: "Breadboard and jumper wire kit", description: "830 points, about 65 jumper wires.", category: "electronics", condition: "New", photo_url: null, created_at: ago(7) },
  ],
  requests: [
    { id: "q1", resource_id: "r9", requester_id: "u2", message: "Hi, I'm taking OS next semester. Could I pick this up from the library on Friday?", status: "pending", created_at: ago(0.3) },
    { id: "q2", resource_id: "r4", requester_id: "u0", message: "I'd love this for my DSA prep. I can collect it any day after 4 pm.", status: "accepted", created_at: ago(1) },
  ],
  mentors: [
    { id: "m1", user_id: "u5", subject: "Aptitude and campus placements", bio: "Cleared three company drives. I can share a weekly practice plan and mock interview you.", availability: "Weekends, evenings", created_at: ago(3) },
    { id: "m2", user_id: "u2", subject: "Embedded systems and Arduino", bio: "Built four projects on STM32 and Arduino. Can help you debug and choose parts.", availability: "Weekday evenings", created_at: ago(4) },
    { id: "m3", user_id: "u1", subject: "Engineering graphics", bio: "Scored 90+ in first-year drawing. I can walk you through projections and sectioning.", availability: "Saturday mornings", created_at: ago(6) },
    { id: "m4", user_id: "u3", subject: "Biochemistry lab reports", bio: "Report structure, viva questions and common mistakes.", availability: "Flexible", created_at: ago(8) },
  ],
  mentorRequests: [
    { id: "mq1", mentor_id: "m1", requester_id: "u0", message: "Could you review my resume and suggest what to practise first?", status: "pending", created_at: ago(0.8) },
  ],
});

const load = () => {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* fall through to seed */
  }
  const db = seed();
  save(db);
  return db;
};
function save(db) {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    /* storage full or blocked */
  }
}

const wait = (v, ms = 220) => new Promise((r) => setTimeout(() => r(structuredClone(v)), ms));
const fail = (m) => new Promise((_, rej) => setTimeout(() => rej(new Error(m)), 220));
const uid = (p) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

const currentId = () => {
  const t = getToken();
  return t?.startsWith("mock.") ? t.slice(5) : null;
};
const me = (db) => db.users.find((u) => u.id === currentId());

const pub = (u, withEmail = false) =>
  u && {
    id: u.id,
    name: u.name,
    department: u.department,
    year: u.year,
    bio: u.bio,
    ...(withEmail ? { email: u.email } : {}),
  };
const self = (u) => u && { id: u.id, name: u.name, email: u.email, department: u.department, year: u.year, bio: u.bio };

const shapeResource = (db, r) => ({
  id: r.id,
  title: r.title,
  description: r.description,
  category: r.category,
  condition: r.condition,
  photo_url: r.photo_url,
  created_at: r.created_at,
  owner: pub(db.users.find((u) => u.id === r.owner_id)),
});

const shapeRequest = (db, q) => {
  const r = db.resources.find((x) => x.id === q.resource_id);
  const accepted = q.status === "accepted";
  return {
    id: q.id,
    message: q.message,
    status: q.status,
    created_at: q.created_at,
    resource: r && { id: r.id, title: r.title, category: r.category, photo_url: r.photo_url },
    requester: pub(db.users.find((u) => u.id === q.requester_id), accepted),
    owner: r && pub(db.users.find((u) => u.id === r.owner_id), accepted),
  };
};

const shapeMentor = (db, m) => ({
  id: m.id,
  subject: m.subject,
  bio: m.bio,
  availability: m.availability,
  created_at: m.created_at,
  user: pub(db.users.find((u) => u.id === m.user_id)),
});

const shapeMentorRequest = (db, q) => {
  const m = db.mentors.find((x) => x.id === q.mentor_id);
  const accepted = q.status === "accepted";
  return {
    id: q.id,
    message: q.message,
    status: q.status,
    created_at: q.created_at,
    mentor: m && { id: m.id, subject: m.subject, user: pub(db.users.find((u) => u.id === m.user_id), accepted) },
    requester: pub(db.users.find((u) => u.id === q.requester_id), accepted),
  };
};

// Shrinks the chosen photo so it fits in localStorage.
const fileToDataUrl = (file, max = 720) =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/jpeg", 0.78));
      };
      img.onerror = () => resolve(null);
      img.src = reader.result;
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });

const requireUser = (db) => {
  const u = me(db);
  if (!u) throw new Error("Log in to continue.");
  return u;
};
const guard = (fn) => {
  try {
    return Promise.resolve(fn()).then((v) => wait(v));
  } catch (e) {
    return fail(e.message);
  }
};

export const mockApi = {
  auth: {
    login: ({ email, password }) =>
      guard(() => {
        const db = load();
        const u = db.users.find((x) => x.email.toLowerCase() === String(email).toLowerCase().trim());
        if (!u || u.password !== password) throw new Error("Email or password is incorrect.");
        return { token: `mock.${u.id}`, user: self(u) };
      }),
    signup: ({ name, email, password, department, year }) =>
      guard(() => {
        const db = load();
        if (db.users.some((x) => x.email.toLowerCase() === String(email).toLowerCase().trim()))
          throw new Error("An account with this email already exists. Log in instead.");
        const u = { id: uid("u"), name, email: email.trim(), password, department, year: Number(year), bio: "" };
        db.users.push(u);
        save(db);
        return { token: `mock.${u.id}`, user: self(u) };
      }),
    me: () =>
      guard(() => {
        const u = requireUser(load());
        return self(u);
      }),
  },

  profile: {
    update: (b) =>
      guard(() => {
        const db = load();
        const u = requireUser(db);
        Object.assign(u, { name: b.name, department: b.department, year: Number(b.year), bio: b.bio ?? "" });
        save(db);
        return self(u);
      }),
  },

  resources: {
    list: ({ q, category } = {}) =>
      guard(() => {
        const db = load();
        const term = (q || "").toLowerCase().trim();
        return db.resources
          .filter((r) => (!category || r.category === category))
          .filter((r) => !term || `${r.title} ${r.description}`.toLowerCase().includes(term))
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .map((r) => shapeResource(db, r));
      }),
    mine: () =>
      guard(() => {
        const db = load();
        const u = requireUser(db);
        return db.resources
          .filter((r) => r.owner_id === u.id)
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .map((r) => shapeResource(db, r));
      }),
    get: (id) =>
      guard(() => {
        const db = load();
        const r = db.resources.find((x) => x.id === id);
        if (!r) throw new Error("This listing no longer exists.");
        return shapeResource(db, r);
      }),
    create: async (data) => {
      const photo_url = data.photo instanceof File ? await fileToDataUrl(data.photo) : null;
      return guard(() => {
        const db = load();
        const u = requireUser(db);
        const r = {
          id: uid("r"),
          owner_id: u.id,
          title: data.title,
          description: data.description,
          category: data.category,
          condition: data.condition,
          photo_url,
          created_at: new Date().toISOString(),
        };
        db.resources.push(r);
        save(db);
        return shapeResource(db, r);
      });
    },
    update: async (id, data) => {
      const photo_url = data.photo instanceof File ? await fileToDataUrl(data.photo) : undefined;
      return guard(() => {
        const db = load();
        const u = requireUser(db);
        const r = db.resources.find((x) => x.id === id);
        if (!r) throw new Error("This listing no longer exists.");
        if (r.owner_id !== u.id) throw new Error("Only the owner can edit this listing.");
        Object.assign(r, {
          title: data.title,
          description: data.description,
          category: data.category,
          condition: data.condition,
        });
        if (photo_url !== undefined) r.photo_url = photo_url;
        if (data.remove_photo) r.photo_url = null;
        save(db);
        return shapeResource(db, r);
      });
    },
    remove: (id) =>
      guard(() => {
        const db = load();
        const u = requireUser(db);
        const r = db.resources.find((x) => x.id === id);
        if (!r) throw new Error("This listing no longer exists.");
        if (r.owner_id !== u.id) throw new Error("Only the owner can delete this listing.");
        db.resources = db.resources.filter((x) => x.id !== id);
        db.requests = db.requests.filter((q) => q.resource_id !== id);
        save(db);
        return { ok: true };
      }),
  },

  requests: {
    create: (resourceId, message) =>
      guard(() => {
        const db = load();
        const u = requireUser(db);
        const r = db.resources.find((x) => x.id === resourceId);
        if (!r) throw new Error("This listing no longer exists.");
        if (r.owner_id === u.id) throw new Error("This is your own listing.");
        if (db.requests.some((q) => q.resource_id === resourceId && q.requester_id === u.id))
          throw new Error("You've already sent a request for this item.");
        const q = { id: uid("q"), resource_id: resourceId, requester_id: u.id, message, status: "pending", created_at: new Date().toISOString() };
        db.requests.push(q);
        save(db);
        return shapeRequest(db, q);
      }),
    sent: () =>
      guard(() => {
        const db = load();
        const u = requireUser(db);
        return db.requests
          .filter((q) => q.requester_id === u.id)
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .map((q) => shapeRequest(db, q));
      }),
    received: () =>
      guard(() => {
        const db = load();
        const u = requireUser(db);
        const mine = new Set(db.resources.filter((r) => r.owner_id === u.id).map((r) => r.id));
        return db.requests
          .filter((q) => mine.has(q.resource_id))
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .map((q) => shapeRequest(db, q));
      }),
    respond: (id, status) =>
      guard(() => {
        const db = load();
        const u = requireUser(db);
        const q = db.requests.find((x) => x.id === id);
        const r = q && db.resources.find((x) => x.id === q.resource_id);
        if (!q || !r) throw new Error("This request no longer exists.");
        if (r.owner_id !== u.id) throw new Error("Only the owner can respond to this request.");
        q.status = status;
        save(db);
        return shapeRequest(db, q);
      }),
  },

  mentors: {
    list: ({ q } = {}) =>
      guard(() => {
        const db = load();
        const term = (q || "").toLowerCase().trim();
        return db.mentors
          .map((m) => shapeMentor(db, m))
          .filter((m) => !term || `${m.subject} ${m.bio} ${m.user?.name}`.toLowerCase().includes(term))
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      }),
    mine: () =>
      guard(() => {
        const db = load();
        const u = requireUser(db);
        return db.mentors.filter((m) => m.user_id === u.id).map((m) => shapeMentor(db, m));
      }),
    offer: (b) =>
      guard(() => {
        const db = load();
        const u = requireUser(db);
        const m = { id: uid("m"), user_id: u.id, subject: b.subject, bio: b.bio, availability: b.availability, created_at: new Date().toISOString() };
        db.mentors.push(m);
        save(db);
        return shapeMentor(db, m);
      }),
    remove: (id) =>
      guard(() => {
        const db = load();
        const u = requireUser(db);
        const m = db.mentors.find((x) => x.id === id);
        if (!m || m.user_id !== u.id) throw new Error("Only you can remove your own mentoring offer.");
        db.mentors = db.mentors.filter((x) => x.id !== id);
        db.mentorRequests = db.mentorRequests.filter((q) => q.mentor_id !== id);
        save(db);
        return { ok: true };
      }),
  },

  mentorship: {
    request: (mentorId, message) =>
      guard(() => {
        const db = load();
        const u = requireUser(db);
        const m = db.mentors.find((x) => x.id === mentorId);
        if (!m) throw new Error("This mentor is no longer available.");
        if (m.user_id === u.id) throw new Error("This is your own mentoring offer.");
        if (db.mentorRequests.some((q) => q.mentor_id === mentorId && q.requester_id === u.id))
          throw new Error("You've already asked this mentor.");
        const q = { id: uid("mq"), mentor_id: mentorId, requester_id: u.id, message, status: "pending", created_at: new Date().toISOString() };
        db.mentorRequests.push(q);
        save(db);
        return shapeMentorRequest(db, q);
      }),
    sent: () =>
      guard(() => {
        const db = load();
        const u = requireUser(db);
        return db.mentorRequests
          .filter((q) => q.requester_id === u.id)
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .map((q) => shapeMentorRequest(db, q));
      }),
    received: () =>
      guard(() => {
        const db = load();
        const u = requireUser(db);
        const mine = new Set(db.mentors.filter((m) => m.user_id === u.id).map((m) => m.id));
        return db.mentorRequests
          .filter((q) => mine.has(q.mentor_id))
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .map((q) => shapeMentorRequest(db, q));
      }),
    respond: (id, status) =>
      guard(() => {
        const db = load();
        const u = requireUser(db);
        const q = db.mentorRequests.find((x) => x.id === id);
        const m = q && db.mentors.find((x) => x.id === q.mentor_id);
        if (!q || !m) throw new Error("This request no longer exists.");
        if (m.user_id !== u.id) throw new Error("Only the mentor can respond to this request.");
        q.status = status;
        save(db);
        return shapeMentorRequest(db, q);
      }),
  },
};
