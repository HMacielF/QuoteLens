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

### Prompts

Quoted as typed.

1. "There should a local project or somewhere on my github a INST247 project called quotelens.
   that project is being done with a team ( where I deal with Azure Function and DB) can u see
   what my team has done and what (we u (ai) and me need to do?)"
2. "Do u have access to my gmail there is a small change that we have some email quotes from years
   ago. I was wondeirng if we could use those for this prioject as examples or something else.
   See what u can find. thanks"
3. "I mean we could add the pdf or emails to our quote leans as exmaple no so we can make sure the
   doc can run it. Anyways. up do u."
4. "Sure i guess? just becareul as i said my goal are NoSQl, EntraID and someting else. i dont wnat
   to mess up with other peoples work but do what we can on our part so far. proceed with care.
   there should be a github projects take a look into it too and update as nedeed so people can do
   their part and we can track what is going on thanks"

### Checks and responsibility

17 automated tests pass locally. Teammates' branches and Azure resources were read but not
changed. Hugo is responsible for this work as submitted.

## Other team members

Add your own entries here, with the tool and prompts.
