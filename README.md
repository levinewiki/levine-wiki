# Levine Wiki

A forum where students post guidance about community college courses. Type a
course code and what you wish you'd known, and it lands in that course's thread.
One thread per course, no sign-in.

Static HTML and JavaScript hosted on GitHub Pages, with a free Supabase project
holding the database. No terminal, no build step, no server to keep alive.

The grouping is the point, so course codes are normalized before they're stored:
`eng 111`, `ENG-111`, `Eng_111`, and `eng111` all become **ENG-111** and share a
single page. The database enforces the same shape with a `CHECK` constraint, so
even someone posting straight to the API can't create a duplicate thread.

## Setup, about ten minutes

### 1. Make the Supabase project

1. Sign up at [supabase.com](https://supabase.com) and create a new project.
   Save the database password it gives you somewhere, though this site never uses it.
2. Wait for the project to finish provisioning, a minute or two.
3. Open **SQL Editor** in the left sidebar, click **New query**.
4. Paste in everything from `supabase-setup.sql` and click **Run**.
   It should say success. That created the table, the security rules, and five
   example tips.

### 2. Get your two values

Go to **Project Settings** (gear icon) → **API**. You need:

- **Project URL**, looks like `https://abcdefgh.supabase.co`
- **anon public** key, a long string starting with `eyJ`

Open `config.js`, paste each one between the quotes, replacing the
`PASTE_YOUR_..._HERE` placeholders. Save.

Do not use the `service_role` key. That one ignores every security rule.

### 3. Put it on GitHub Pages

Entirely in the browser:

1. On github.com click **New repository**. Name it `levine-wiki`, make it
   **Public**, don't add a README, click Create.
2. On the next screen click **uploading an existing file**.
3. Drag in all six files: `index.html`, `course.html`, `app.js`, `config.js`,
   `style.css`, `README.md`. Click **Commit changes**.
4. Go to **Settings** → **Pages**. Under Source pick **Deploy from a branch**,
   branch `main`, folder `/ (root)`. Save.
5. Wait a minute, then open `https://yourusername.github.io/levine-wiki/`.

To use `yourusername.github.io` with no path, name the repository exactly
`yourusername.github.io` instead. Everything else is the same.

Changing something later: click the file on github.com, hit the pencil icon,
edit, commit. Pages redeploys on its own within a minute.

## What's in here

| File | What it does |
| --- | --- |
| `index.html` | Front page: search, course grid, post form |
| `course.html` | One course's thread, reads `?code=ENG-111` from the URL |
| `app.js` | Code normalization, Supabase calls, shared form handling |
| `config.js` | Your two Supabase values, the only file you edit |
| `style.css` | All styling |
| `supabase-setup.sql` | Run once in Supabase, not part of the website |

## Features

- Post a tip with optional instructor, difficulty rating (1–5), and your name
- One page per course, sortable by newest or most helpful
- Average difficulty per course, computed from the ratings on it
- Search by partial code (`mat` finds MAT-171 and MAT-271)
- Helpful button, one vote per tip per browser
- Hidden honeypot field that drops bot submissions

## About that key in the JavaScript

Anyone can view source and read your Supabase URL and anon key. That's how
Supabase is designed to work, and it's fine, but only because of what's in
`supabase-setup.sql`:

- Row Level Security is **on**, so the key can do only what a policy allows.
- There's a policy for reading tips and a policy for inserting them.
- There is deliberately **no** update or delete policy, so nobody holding that
  key can edit or erase another student's post.
- The Helpful button can't `UPDATE` either. It calls a database function that
  does one thing: add 1 to `helpful_count` on one row.
- Length and format limits live in the table as constraints, not just in the
  page, so they hold even if someone posts directly to the API.

You moderate from the Supabase table editor, signed in as the project owner.

## Before you share it with a whole campus

- **Moderation plan.** Deleting a bad post means opening the Supabase table
  editor and removing the row. Fine for one person, awkward at scale.
- **Rate limiting.** The honeypot stops naive bots and nothing else. Supabase
  has per-project rate limits, but somebody determined could still spam the
  insert endpoint. Turning on Supabase Auth with anonymous sign-ins and keying
  a limit off the user id is the usual next step.
- **Votes are per browser.** They're kept in `localStorage`, so clearing site
  data lets you vote again. Fine for a small school, not a scoreboard.
- **Naming instructors.** Tips can name a teacher. Decide up front whether you
  allow that and say so on the page. It's the part most likely to get a site
  like this shut down.
- **Free tier pausing.** Supabase pauses free projects after a stretch of
  inactivity. A live student forum won't hit that, but a project nobody visits
  over summer break might; you unpause from the dashboard.
