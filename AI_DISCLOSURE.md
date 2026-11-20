# AI Use Disclosure

This file cites generative AI use on the QuoteLens project, as the INST347 syllabus requires:
the specific tool and the prompts used. Each team member adds their own entries.

## Hugo Maciel Fraga: backend starter (PR #4)

- **Tool:** Claude Code, using the Claude Opus 5.5 model (Anthropic)
- **Date:** October 31, 2026
- **Used for:** project work in pull request #4

### What Claude Code produced

- All code, tests and configuration in `api/`, plus `.gitignore`
- `api/README.md` and the commit message and description for PR #4
- The commands used to install local tools, and the local test runs

### Azure and GitHub setup done with Claude Code

- Created the `quotelens-rg` resource group and gave teammates Contributor access
- Registered the Cognitive Services provider and created the budget alert
- Created the GitHub Project board and its first task cards

### Prompts

Edited for clarity and grammar; the meaning is unchanged. The homework text is summarized, and
teammate email addresses and the prototype link are left out.

1. "QuoteLens is in my GitHub. Here is the assignment: [full text of Individual Homework: Project
   Kickoff & Semester Planning]. Tell me what you can do based on it. We are using Azure services,
   and we have a prototype: [prototype link]."
2. "Go ahead and start. Do not list Claude as a co-author." This approved the plan Claude Code
   gave in reply to prompt 1: build the Azure Functions backend and the Cosmos DB data model,
   with extraction mocked.
3. "Use the Azure for Students subscription, and add my teammates as contributors. Tell me what
   you need from them."
4. "[three teammate email addresses]"
5. "Read the final proposal in my Downloads folder. For tracking and communication, set up a
   GitHub Projects board."
6. "Add an AI use disclosure, either in the README or in a separate file." This prompt led to
   this file, which Claude Code also drafted.

### Checks and responsibility

The code passed 23 automated tests, including runs against the local Cosmos DB emulator, and
the full flow ran on a local Functions host. It has not been deployed to Azure. Teammate review
of PR #4 is still pending. Hugo is responsible for this work as submitted.

## Hugo Maciel Fraga: sample quotes, excluded status, Cosmos identity, board (Nov 12)

- **Tool:** Claude Code, using the Claude Opus 5.5 model (Anthropic)
- **Date:** November 12, 2026
- **Used for:** PR #5 (sample quotes), the backend changes stacked on PR #4, and the task board

### What Claude Code produced

- Found Hugo's January 2025 vanity quotes in his Gmail, redacted his name, phone and email,
  printed the two email quotes to PDF, and ran Azure Document Intelligence on them (PR #5)
- Resolved PR #4's `.gitignore` merge conflict
- The `excluded` service status, effective price per sq ft, exclusion flags, Cosmos sign-in with
  the Function App's managed identity, the tests for them, and the README updates
- The status review of every teammate's branch and the task board updates
- Saving original PDFs to Blob Storage and the owner-only, short-lived link to reopen them
- Deployed the backend to Azure with a setup script Hugo ran, and started the Entra External ID
  tenant setup in the Azure portal

### Prompts

Edited for clarity and grammar; the meaning is unchanged.

1. "Find the QuoteLens project for INST347, locally or on my GitHub. It is a team project, and I
   am responsible for Azure Functions and the database. Review what the team has done and
   identify what remains for you and me."
2. "Check my Gmail for countertop quotes I received in the past, and see whether we can use them
   as sample data for this project."
3. "Add the PDFs and emails to QuoteLens as sample files, so we can confirm Document Intelligence
   can read them."
4. "Proceed carefully. My areas are the NoSQL database, Entra ID and Azure Functions. Do not
   change teammates' work; work only on our part. Review the GitHub Project board and update it
   so each teammate knows their tasks and we can track progress."
5. "Open the Azure portal and set up Entra External ID with me. Also proceed with saving the
   original PDFs to Blob Storage."

### Checks and responsibility

21 automated tests pass locally. Teammates' branches and Azure resources were read but not
changed. Hugo is responsible for this work as submitted.

## Hugo Maciel Fraga: frontend deploy workflow (Nov 13)

- **Tool:** Claude Code, using the Claude Opus 5.5 model (Anthropic)
- **Date:** November 13, 2026
- **Used for:** the GitHub Actions workflow that deploys the frontend to the `quotelensapp` Web App

### What Claude Code produced

- Diagnosed the first deploy run's failure (the Deployment Center template runs npm, and the
  frontend has no `package.json`)
- Rewrote `.github/workflows/main_quotelensapp.yml` to deploy only the website files as a
  static site, run only when those files change, and check the site responds after deploying
- Reviewed the resources teammates added to `quotelens-rg` on November 13 (read only)

### Prompts

Edited for clarity and grammar; the meaning is unchanged.

1. "[Photo of the quotelens-rg resource list in the Azure portal]"
2. "[The workflow file Azure generated] Create a workflow that deploys from main. We also need to
   start merging the pull requests."

### Checks and responsibility

The workflow was checked against the Web App's settings (Linux, Node 22) and the first run's
log. Hugo is responsible for this work as submitted.

## Hugo Maciel Fraga: branch and Azure cleanup, AI handoff docs (Nov 20)

- **Tool:** Claude Code, using the Claude Opus 5.5 model (Anthropic)
- **Date:** November 20, 2026
- **Used for:** repository and Azure housekeeping, and the AI handoff documents

### What Claude Code produced

- A status review of every branch and pull request. It deleted the six merged branches and
  `ksunwar-patch-1` at Hugo's request
- A comparison of PR #52 and PR #54, a local test and build of PR #54 before Hugo merged it,
  and the comment explaining why PR #52 was closed
- A review of `quotelens-rg` that found which resources were unused. At Hugo's request it
  deleted the empty `QuoteLensModel` app, its plan and storage, the empty
  `quotelens-cosmodbnosql` account, the old `quotelensrga225` storage, an unused deploy
  identity, and two stale web app settings
- `AGENTS.md`, `CLAUDE.md`, `docs/PROJECT_STATUS.md`, `docs/DECISIONS.md` and `docs/HANDOFF.md`
- Diagnosed why the AI studio still asked for Storage Blob Data Contributor (the role had not
  been saved, and it belongs to the AI resource's identity, not a person). Wrote the commands
  Hugo ran to create the `quotelensstudio` storage account and grant the two roles, then added
  them to the handoff documents

### Prompts

Edited for clarity and grammar; the meaning is unchanged.

1. "What is the status of the QuoteLens branches on GitHub? What is still needed, what is
   closed, and what should I delete?"
2. "Delete ksunwar-patch-1."
3. "Compare web/app-from-prototype and frontend." followed by "Proceed."
4. "Review our Azure resource group and identify what can be deleted and what is still needed."
5. "Create an AI handoff system in this repository so teammates can use their own AI coding
   assistants to understand the project: AGENTS.md, CLAUDE.md, docs/PROJECT_STATUS.md,
   docs/DECISIONS.md and docs/HANDOFF.md. Use the codebase as the source of truth, separate
   verified facts from assumptions, do not change application code, and do not commit."
6. "The selected resource quotelens-rg-resource-4538 requires the Storage Blob Data Contributor
   role on this storage account to continue. I added the role manually, but the error remains."
7. "This is a real feature of the application. How can we achieve the same result with the
   student account? Billing to the student account is fine." followed by "Update the handoff
   documents."

### Checks and responsibility

Every statement in the handoff documents was checked against the code, Git history, GitHub
issues and the Azure resource group on November 20. API tests (21) and web app tests (9) passed,
and the site and API responded after the cleanup. Hugo is responsible for this work as submitted.

## Other team members

Add your own entries here, with the tool and prompts.
