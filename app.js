// ---------------------------------------------------------------------------
// Course codes
//
// This is the whole reason the site works: every code is squeezed down to one
// canonical form before it touches the database, so "eng 111", "ENG-111" and
// "eng111" all become ENG-111 and share a single page.
// ---------------------------------------------------------------------------

const CODE_PATTERN = /^([A-Z]{2,4})(\d{3})([A-Z]?)$/;

const MIN_TIP_LENGTH = 20;
const MAX_TIP_LENGTH = 5000;

function normalizeCode(raw) {
  if (!raw) return null;
  const squeezed = raw.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  const match = CODE_PATTERN.exec(squeezed);
  if (!match) return null;
  const [, subject, number, suffix] = match;
  return `${subject}-${number}${suffix}`;
}

// ---------------------------------------------------------------------------
// Talking to Supabase over its REST endpoint. No SDK, no build step.
// ---------------------------------------------------------------------------

async function request(path, options = {}) {
  if (!isConfigured()) {
    throw new Error(
      "This site isn't connected to a database yet. Open config.js and paste in your Supabase project URL and anon key."
    );
  }
  const response = await fetch(`${REST_URL}${path}`, {
    ...options,
    headers: { ...HEADERS, ...(options.headers || {}) },
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Supabase said no (${response.status}). ${detail}`);
  }
  return response.status === 204 ? null : response.json();
}

// One row per course, built by grouping tips in the browser. There are only
// ever a few hundred rows, so this is cheaper than a database view.
async function fetchCourses() {
  const tips = await request("/tips?select=code,difficulty,created_at&order=created_at.desc");
  const courses = new Map();
  for (const tip of tips) {
    if (!courses.has(tip.code)) {
      courses.set(tip.code, { code: tip.code, count: 0, ratings: [], latest: tip.created_at });
    }
    const course = courses.get(tip.code);
    course.count += 1;
    if (tip.difficulty) course.ratings.push(tip.difficulty);
  }
  return [...courses.values()].map((course) => ({
    ...course,
    difficulty: course.ratings.length
      ? course.ratings.reduce((a, b) => a + b, 0) / course.ratings.length
      : null,
  }));
}

async function fetchTips(code, sort = "new") {
  const order = sort === "helpful" ? "helpful_count.desc,created_at.desc" : "created_at.desc";
  return request(`/tips?code=eq.${encodeURIComponent(code)}&select=*&order=${order}`);
}

async function createTip({ code, body, author, instructor, difficulty }) {
  return request("/tips", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify([
      {
        code,
        body,
        author: author || null,
        instructor: instructor || null,
        difficulty: difficulty || null,
      },
    ]),
  });
}

async function markHelpful(id) {
  // increment_helpful is a database function; a plain UPDATE is blocked on
  // purpose so nobody can rewrite someone else's tip.
  return request("/rpc/increment_helpful", {
    method: "POST",
    body: JSON.stringify({ tip_id: id }),
  });
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function since(timestamp) {
  const seconds = (Date.now() - new Date(timestamp).getTime()) / 1000;
  const minutes = seconds / 60;
  const hours = minutes / 60;
  const days = hours / 24;
  if (minutes < 2) return "just now";
  if (minutes < 60) return `${Math.floor(minutes)} minutes ago`;
  if (hours < 24) return `${Math.floor(hours)} hours ago`;
  if (days < 30) return `${Math.floor(days)} days ago`;
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Votes are remembered per browser. Clearing storage lets you vote again;
// that's a known limit, not a scoreboard.
const votedTips = {
  all() {
    try {
      return new Set(JSON.parse(localStorage.getItem("voted") || "[]"));
    } catch {
      return new Set();
    }
  },
  add(id) {
    const voted = this.all();
    voted.add(id);
    localStorage.setItem("voted", JSON.stringify([...voted]));
  },
  has(id) {
    return this.all().has(id);
  },
};

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function notify(message, tone = "info") {
  const zone = document.getElementById("notices");
  zone.innerHTML = "";
  const note = el("p", tone === "error" ? "notice error" : "notice", message);
  zone.append(note);
  zone.scrollIntoView({ block: "nearest" });
}

// Reads the form both pages share, validates it, and posts.
async function submitTip(form, fixedCode = null) {
  if (form.querySelector('[name="website"]').value) return null; // honeypot

  const code = fixedCode || normalizeCode(form.querySelector('[name="code"]').value);
  const body = form.querySelector('[name="body"]').value.trim();

  if (!code) {
    notify("Course codes look like ENG-111 or CSC-251. Check the code and try again.", "error");
    return null;
  }
  if (body.length < MIN_TIP_LENGTH) {
    notify("Write at least a sentence or two so the tip is useful to someone else.", "error");
    return null;
  }
  if (body.length > MAX_TIP_LENGTH) {
    notify("That tip is longer than 5,000 characters. Trim it down and post again.", "error");
    return null;
  }

  const rating = form.querySelector('[name="difficulty"]').value;
  await createTip({
    code,
    body,
    author: form.querySelector('[name="author"]').value.trim().slice(0, 40),
    instructor: form.querySelector('[name="instructor"]').value.trim().slice(0, 60),
    difficulty: rating ? Number(rating) : null,
  });
  return code;
}
