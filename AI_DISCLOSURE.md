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

## Other team members

Add your own entries here, with the tool and prompts.
