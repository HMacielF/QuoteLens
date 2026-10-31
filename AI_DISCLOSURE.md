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

Quoted as typed. The homework text is summarized, and teammate email addresses and the
prototype link are left out.

1. "There is QuoteLens inside of my github. this is the assignment let me know wha tu are able
   to do based on this: [full text of Individual Homework: Project Kickoff & Semester Planning]
   we will be using azure services btw one more thing we also have a protytpe: [prototype link]"
2. "Thanks yes start and pls dont include the claude as co-author pls." This approved the plan
   Claude Code gave in reply to prompt 1: build the Azure Functions backend and the Cosmos DB
   data model, with extraction mocked.
3. "Make sure to use the azure for students and yeah we need to add constributors to the project
   what do u need for that their email?"
4. "[three teammate email addresses]"
5. "check in downalods a file called final rpoposal. For the trackign and communication i was
   thiking we can use github project? or something like that no?"
6. "I would dicluse in the readme or somewher else maybe a file with ai disclosure idk" This
   prompt led to this file, which Claude Code also drafted.

### Checks and responsibility

The code passed 23 automated tests, including runs against the local Cosmos DB emulator, and
the full flow ran on a local Functions host. It has not been deployed to Azure. Teammate review
of PR #4 is still pending. Hugo is responsible for this work as submitted.

## Other team members

Add your own entries here, with the tool and prompts.
