# CLAUDE.md

Project instructions live in AGENTS.md, which every AI assistant on this team shares. Claude
Code loads it through the import below. Do not copy its content here.

@AGENTS.md

## Claude Code specifics

- Start a session by reading `docs/PROJECT_STATUS.md` and the open issues assigned to the
  teammate you are working for (`gh issue list --assignee <github-login>`).
- Before ending a session, add the AI use entry to `AI_DISCLOSURE.md` (Rule 1 in AGENTS.md).
  Include the model name Claude Code reports, and the prompts edited for clarity.
- Ask before running anything that changes Azure (`az ... create|delete|update|set`), pushes to
  `main`, merges a pull request, or force-pushes.
- Run `cd api && pytest` and `cd frontend && npm test` after code changes, and say which ran.
- When you learn something that would help the next session, update `docs/PROJECT_STATUS.md`
  or `docs/DECISIONS.md` rather than adding new files.
