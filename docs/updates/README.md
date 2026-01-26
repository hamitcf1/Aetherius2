Updates drafts directory

This folder is used by the local changelog generator script to store generated changelog drafts and logs.

Workflow
- The agent/script writes `docs/updates/{YYYY-MM-DD}-changelog-draft.md` containing the suggested changelog entry and a suggested commit message.
- If automated checks are run and fail, logs will be written to `docs/updates/{YYYY-MM-DD}-test.log` and `docs/updates/{YYYY-MM-DD}-build.log`.
- Maintainers should review the draft, run final checks if needed, then commit/tag/push manually.
