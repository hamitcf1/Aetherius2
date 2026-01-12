FIX_BUILD.md
Fixing Cloudflare Pages Build & Asset Errors (Vite + Worker Setup)

⸻

Context

This project is deployed behind a Cloudflare Worker under the path:

/skyaetherius

The application is built with Vite and served via Cloudflare Pages.
Routing is handled by a Worker that maps:

/skyaetherius → Pages root (/)

Build failures and runtime 404 errors occurred due to incorrect handling of:
	•	Vite base paths
	•	Hard-coded subpath URLs
	•	Missing build-time files

⸻

Problem 1: Build fails due to missing _redirects

Error

Error copying _redirects file:
ENOENT: no such file or directory
public/_redirects → dist/_redirects

Cause

vite.config.ts (or a plugin) attempts to copy public/_redirects,
but the file does not exist.

Fix

Create the file manually:

public/_redirects

File content:

/* /index.html 200

This satisfies the build step and prevents Vite from failing.

⸻

Problem 2: Vite cannot resolve /skyaetherius/console-demo.js

Error

[vite:build-html] Failed to resolve
/skyaetherius/console-demo.js from index.html

Cause

Vite resolves assets at build time.
Hard-coded absolute paths starting with /skyaetherius break resolution because the file does not exist locally under that path.

The Worker handles the subpath, not Vite.

Fix

Remove the subpath from all asset imports.

index.html BEFORE:

<script type="module" src="/skyaetherius/console-demo.js"></script>


index.html AFTER:

<script type="module" src="/console-demo.js"></script>


Repeat this for all JS, CSS, audio, image, and font references.

⸻

Problem 3: Audio and cursor files return 404 in production

Symptoms
	•	Audio works locally but fails in production
	•	Cursor PNG files do not load
	•	Console shows:
Failed to load resource: 404
NotSupportedError: no supported source was found

Cause

Assets referenced with relative paths like:

./cursor-default.png
./music/night.mp3

are resolved relative to the current URL:

/skyaetherius/…

Vite moves assets into dist/assets with hashed names,
so those relative paths no longer exist.

Fix
	1.	Move assets into public/

public/cursors/cursor-default.png
public/cursors/cursor-pointer.png
public/audio/night.mp3
	2.	Reference them with root-absolute paths:

CSS cursor fix:

cursor: url(’/cursors/cursor-default.png’) 0 0, auto;

cursor pointer:

cursor: url(’/cursors/cursor-pointer.png’) 6 0, pointer;

Audio fix:

new Audio(’/audio/night.mp3’)

Do NOT use ./ or ../ for runtime assets.

⸻

Problem 4: Incorrect Vite base configuration

Cause

Vite base must NOT include the Worker subpath.
The Worker already rewrites URLs.

Fix

vite.config.ts must contain:

base: ‘/’

Never set:

base: ‘/skyaetherius/’

⸻

Final Checklist (Required)
	•	public/_redirects exists
	•	All asset paths start with /
	•	No hard-coded /skyaetherius paths in code
	•	Vite base is ‘/’
	•	Worker handles subpath mapping only

⸻

Result
	•	Build succeeds on Cloudflare Pages
	•	No 404 asset errors
	•	Audio and cursors load correctly
	•	Worker-based routing works as intended

⸻

End of file