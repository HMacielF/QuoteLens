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

## Other team members

Add your own entries here, with the tool and prompts.
