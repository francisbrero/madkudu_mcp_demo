# 🗞 MadKudu MCP Demo App – PRD & Task List (v2)

## 🌟 Objective

Create a web app with two side-by-side chat interfaces:

* **Left pane**: Standard GPT-4o
* **Right pane**: GPT-4o + MadKudu MCP integration (Cursor-style behavior)

Each interface can be toggled between 3 different **agents**. One agent will specialize in rewriting outbound emails for executive outreach. Prompts for both systems (GPT-only and MCP-enhanced) will be provided.

---

## 🛠️ Tech Stack

* **Framework**: [T3 Stack](https://create.t3.gg/)
* **Package Manager**: pnpm
* **Database**: SQLite (via Prisma)
* **Runtime**: Node.js
* **Frontend**: Next.js + Tailwind
* **Backend**: tRPC
* **LLM Backend**: OpenAI GPT-4o API + Local MCP simulation

---

## 🗂️ App Architecture

### 💬 Chat Interface (x2)

* Left: Pure GPT-4o agent
* Right: GPT-4o + MCP-enhanced agent (mimics Cursor behavior)

### 🤖 Agent Modes (Switchable)

* **Agent 1**: Executive outreach writer (given an input email)
* **Agent 2**: Account plan generator (given an account name)
* **Agent 3**: TBD (prompt will be provided)

---

## ✅ Task List

---

### 🧹 Task 1: Boilerplate Cleanup

**🔧 Objective**: Remove unnecessary boilerplate and post-related code from the default T3 starter.

**Steps**:

1. Scaffold app:

   ```bash
   pnpm create t3-app@latest mcp-demo
   ```

   * Enable: tRPC, Tailwind, Prisma, NextAuth
   * Choose: SQLite
   * Package manager: pnpm

2. Remove:

   * All `post`-related code in `src/pages`, `prisma/schema.prisma`, and `src/server/api/routers`

3. Replace homepage with:
   “MadKudu MCP Demo — Choose an agent to get started”

4. Run:

   ```bash
   pnpm dev
   ```

   Confirm app builds and loads.

**🔗 Docs**:

* [https://create.t3.gg/en/usage/project-structure](https://create.t3.gg/en/usage/project-structure)
* [https://www.prisma.io/docs/concepts/components/prisma-schema](https://www.prisma.io/docs/concepts/components/prisma-schema)
* [https://tailwindcss.com/docs/installation](https://tailwindcss.com/docs/installation)

---

### 💬 Task 2: Create Side-by-Side Chat UI

**🔧 Objective**: Build a split-view chat interface mimicking Cursor's layout

**Steps**:

1. Create input bar at the bottom with shared prompt input

2. Left chat window: GPT-4o only

3. Right chat window: GPT-4o + MCP simulation

4. Scrollable history in both panes

5. Add agent dropdown above each chat to switch between the 3 defined agents

6. Run:

   ```bash
   pnpm dev
   ```

**🔗 Docs**:

* [https://tailwindcss.com/docs/grid-template-columns](https://tailwindcss.com/docs/grid-template-columns)
* [https://react.dev/learn/managing-state](https://react.dev/learn/managing-state)

---

### 🔌 Task 3: Add GPT-4o Chat Functionality (Left Panel)

**🔧 Objective**: Enable basic chat interaction with GPT-4o

**Steps**:

1. Use OpenAI’s `chat/completions` endpoint (model: `gpt-4o`)

2. Add system prompts based on selected agent

3. Track chat history in state

4. Show streaming or full-message responses

5. Run:

   ```bash
   pnpm dev
   ```

**🔗 Docs**:

* [https://platform.openai.com/docs/guides/gpt/chat-completions](https://platform.openai.com/docs/guides/gpt/chat-completions)
* [https://trpc.io/docs/client/react/useMutation](https://trpc.io/docs/client/react/useMutation)

---

Here is the updated version of **Task 4 and beyond** in your PRD, modified to reflect the use of the **MadKudu Public API** instead of the local MCP CLI:

---

### 🧠 Task 4: Integrate Context-Enriched Agent (Right Panel) Using MadKudu API

**🔧 Objective**: Replace MCP CLI calls with MadKudu’s public HTTP API to fetch real-time GTM context for the agent.

---

**Steps**:

1. **Setup API Key Authentication**:

   * Add the following to `.env.local`:

     ```env
     MADKUDU_API_KEY=your-secret-api-key
     ```

   * Create a shared HTTP header in `lib/madkuduClient.ts`:

     ```ts
     const apiKey = process.env.MADKUDU_API_KEY!;
     const headers = { 'x-api-key': apiKey };
     ```

2. **Build API Utilities** in `lib/madkuduClient.ts`:

   ```ts
   import axios from 'axios';

   export const lookupPerson = async (email: string) => {
     const { data } = await axios.post('https://madapi.madkudu.com/lookup/persons', { email }, { headers });
     return data;
   };

   export const lookupAccount = async (domain: string) => {
     const { data } = await axios.post('https://madapi.madkudu.com/lookup/accounts', { domain }, { headers });
     return data;
   };

   export const getAccountDetails = async (accountId: string) => {
     const { data } = await axios.get(`https://madapi.madkudu.com/accounts/${accountId}`, { headers });
     return data;
   };

   export const getContactDetails = async (contactId: string) => {
     const { data } = await axios.get(`https://madapi.madkudu.com/contacts/${contactId}`, { headers });
     return data;
   };

   export const getAIResearch = async (domain: string) => {
     const response = await fetch(`https://madapi.madkudu.com/ai/account-research?domain=${domain}`, {
       headers: {
         'x-api-key': apiKey,
         'Accept': 'text/event-stream'
       }
     });
     return response.body; // Handle SSE stream parsing in frontend
   };
   ```

3. **Integrate in Chat Workflow**:

   * On user input, use appropriate utility functions to fetch enriched data.
   * Inject retrieved data into GPT-4o prompt for the right-hand agent.
   * Clearly distinguish which data sources were available in the response.

4. **Test**:

   ```bash
   pnpm dev
   ```

   Ensure the agent is:

   * Calling the right APIs
   * Formatting context properly
   * Producing differentiated answers vs. GPT-only

---

### 🤖 Task 5: Agent Switching Functionality

**🔧 Objective:** Enable dropdown-based switching between 3 agent profiles

**Steps:**

1. Store selected agent in state
2. Load correct system prompt for each agent
3. Configure separate prompts for GPT-only and MCP-enhanced versions

Run:

```bash
pnpm dev
```

---

### 📄 Task 6: Plug in Prompts for Agent 1 – Executive Outreach Generator (API-Based)

**🔧 Objective**: Power the right-panel GPT-4o agent to generate personalized executive outreach messages using data retrieved from the MadKudu API.

---

#### 🧾 Prompt Input

* Input: A freeform email draft or brief text the user wants to refine.
* Output: A Markdown document including outreach plan and messaging.

---

#### 🧠 API Calls (triggered on submit)

1. `lookupAccount(domain)`
   → Get firmographic enrichment and internal MadKudu scores.

2. `getAIResearch(domain)`
   → Streamed AI-generated company insights and sales angles.

3. `lookupPerson(email)`
   → Get enriched identity + inferred intent and contact details.

4. `getContactDetails(contactId)`
   → Fetch LinkedIn, location, photo, role, and public presence.

---

#### 📥 Prompt Construction

Assemble a system prompt using the results of the API calls:

```markdown
## Company Context
{{output from lookupAccount + AIResearch}}

## Contact Context
{{output from lookupPerson + getContactDetails}}

## Instructions
You are Francis Brero, CPO at MadKudu. You’re preparing a first outreach to this executive. Use the research above to:
- Identify and stack-rank 5 angles for outreach
- Draft a 3-step email sequence
- Suggest a LinkedIn connection message
```

---

#### 📤 Output Requirements

* A Markdown document with the following sections:

  * **Top 5 Angles**: With justification based on research
  * **Email Sequence**: 3 tailored messages
  * **LinkedIn Message**: A short connection note
* Tone must follow: professional, neutral, non-creepy, no flattery
* Must refer to past engagement, product usage, or shared interests when available
* Must avoid generic phrases and ChatGPT-sounding language

---

#### ✅ Build Check

Run:

```bash
pnpm dev
```

Ensure that:

* Chat output reflects personalized and specific research
* GPT-only version is clearly less tailored
* Each response includes references to contact role, product usage, or strategic event

---

### 📄 Task 7: Plug in Prompts for Agent 2 – Account Plan Generator (API-Based)

**🔧 Objective**: Enable the right-panel GPT-4o agent to produce a full tactical account plan for a strategic sales target using MadKudu's API data.

---

#### 🧾 Prompt Input

* Input: Account domain (or company name)

---

#### 🧠 API Calls (triggered on submit)

1. `lookupAccount(domain)`
   → Identify target company and retrieve scores + metadata

2. `getAccountDetails(accountId)`
   → Get activation patterns, product usage, and sales motion details

3. `getAIResearch(domain)`
   → AI-generated strategic summary and GTM insights

4. `lookupPerson(email)` for known users (if provided)

5. `getContactDetails(contactId)` for each top user (if needed)

---

#### 📥 Prompt Construction

Prompt must direct the agent to output:

```markdown
# Account Plan for {{Company Name}}

## 1. Account Objective Summary
[Why this account matters + definition of success]

## 2. Attack Plan Options
- Champion-led
- Product-led
- Top-down
(With pros/cons for each)

## 3. Recommended Path Forward
[Choose best motion and explain why]

## 4. Target Contacts
[3–5 names, titles, optional emails or roles]

## 5. Suggested Messaging
[For each contact: what problem to speak to and how MadKudu helps]

## 6. Next Steps
[Concrete actions the AE should take now]
```

---

#### 📣 Tone

* Tactical, collaborative, and actionable
* No generic fluff or marketing language
* Make bold, specific recommendations based on data

---

#### ✅ Build Check

Run:

```bash
pnpm dev
```

Verify that:

* Output Markdown follows structure
* Plan content reflects insights from company and usage data
* GPT-only agent produces more generic, less confident output

---

### 🧭 Task 8: Agent Builder & Deployment Interface

**🔧 Objective**: Allow users (demo admins/devs) to define and manage "agents" by combining a custom system prompt with a list of allowed MadKudu API calls. These agents can then be deployed and made available on the home page for testing.

---

#### 🧱 Requirements

* **Page Name**: `/agents` The page should be accessible from the homepage as a breadcrumb next to the API Test page.

* **Fields per agent**:

  * Agent Name (e.g. "Exec Outreach Agent")
  * Description / Short Label
  * System Prompt (textarea or markdown editor)
  * Allowed API Calls (multi-select: checkboxes for `lookupAccount`, `lookupPerson`, etc.)
  * Input Mode (email / domain / freeform)
  * Output Format (Markdown, JSON, etc.)
  * Status toggle: Active/Inactive

* **Actions**:

  * Save new agent
  * Edit existing agent
  * Deploy/undeploy agent (available on homepage)
  * Duplicate or delete agent

---

#### 📁 Data Handling

* Store agent definitions in a local JSON file or SQLite table:

  ```ts
  {
    id: "agent_exec_outreach",
    name: "Exec Outreach Agent",
    description: "Writes tailored exec outreach emails",
    prompt: "You are Francis Brero...",
    allowedApis: ["lookupAccount", "lookupPerson", "getAIResearch"],
    inputType: "email",
    format: "markdown",
    active: true
  }
  ```

* These definitions are loaded dynamically into the Agent Selector on the home page.

---

#### 🎨 UI Notes

* Use a layout similar to the API Test page for continuity
* Prioritize form clarity (markdown editor with syntax highlight if feasible)
* Consider collapsible agent panels if list grows

---

#### ✅ Build Check

Run:

```bash
pnpm dev
```

* Ensure agents defined in `/agents` page are usable in the homepage selector
* Test one agent with no API access vs. one using all APIs to validate logic
* All agent configurations should be saved and reusable across reloads


---

## 🧩 Completion Criteria

* Fully working local app via `pnpm dev`
* Split chat view with input field and scrollable chat history
* Agent selector and system prompt loading per chat
* MCP-mimic agent shows richer answers when sources are toggled

