Changelog Agent Policy

Purpose
- Ensure any automated changelog work is local-only: the agent MUST NOT run git, create commits, push, create PRs, or create releases.
- The agent may read repository files, produce changelog drafts, update `package.json` locally, and write draft files under `docs/updates/` for human review.

Required behavior for the agent
- No Git: The agent MUST NOT run any `git` commands or use GitHub APIs.
- Draft-only: The agent may generate a draft changelog file at `docs/updates/{YYYY-MM-DD}-changelog-draft.md` and may update `package.json` version locally, but MUST NOT commit or push changes.
- Tests & build: The agent MAY run local verification (`npm test` and `npm run build`) and must capture logs to `docs/updates/{date}-changelog-failure.log` if they fail. If tests/build fail, the agent should still produce a changelog draft and include the failure logs and clear notes for maintainers; the agent must not commit or push any changes — a maintainer must review and finalize the draft.
- Agent activity logs: The agent should write a daily activity log under `docs/agent-activity/` describing the actions it took, files changed, and links to test/build logs or changelog drafts.
- File scanning: To collect changes since the last published changelog entry, the agent should inspect file mtimes (not git history) and summarize changed files.
- Classification heuristics: Map commit and file changes to `feature`, `fix`, `improvement`, or `combat` by filename and content heuristics. If uncertain, classify as `improvement` and add a note for human review.

Human-in-the-loop
- After generating a draft, the agent will leave the draft and updated `package.json` (if changed) in the working tree but unstaged.
- A maintainer MUST review the draft, run any final checks, commit/tag/push, and create any release.

Examples
- The agent may create: `docs/updates/2026-01-26-changelog-draft.md` and update `package.json` version to `1.0.5` locally, but must not run `git add`/`git commit`/`git push`.

Notes
- If the environment variable `DISABLE_AUTO_CHANGELOG` is set, the agent should not write drafts automatically and should instead produce a suggested draft to stdout only.

Contact
- If unsure about classification or build/test failures, the agent should add a clear human-review note to the draft and stop.
