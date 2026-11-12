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

Lightly edited for spelling and grammar; the meaning is unchanged. The homework text is
summarized, and teammate email addresses and the prototype link are left out.

1. "QuoteLens is in my GitHub. Here is the assignment; let me know what you're able to do based
   on it: [full text of Individual Homework: Project Kickoff & Semester Planning]. We will be
   using Azure services. One more thing: we also have a prototype: [prototype link]"
2. "Thanks, yes, start. Please don't include Claude as a co-author." This approved the plan
   Claude Code gave in reply to prompt 1: build the Azure Functions backend and the Cosmos DB
   data model, with extraction mocked.
3. "Make sure to use Azure for Students. We also need to add contributors to the project. What
   do you need for that, their emails?"
4. "[three teammate email addresses]"
5. "Check Downloads for a file called final proposal. For tracking and communication, I was
   thinking we could use GitHub Projects or something like that?"
6. "I would disclose it in the README, or maybe in a separate AI disclosure file." This prompt
   led to this file, which Claude Code also drafted.

### Checks and responsibility

The code passed 23 automated tests, including runs against the local Cosmos DB emulator, and
the full flow ran on a local Functions host. It has not been deployed to Azure. Teammate review
of PR #4 is still pending. Hugo is responsible for this work as submitted.

## Other team members

Add your own entries here, with the tool and prompts.
