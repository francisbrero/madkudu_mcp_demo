# Product Requirements Document & Implementation Plan

**Version:** 5.0
**Date:** June 19, 2025

## 1. Overview & Vision

The MadKudu MCP Demo App is an interactive web application designed to showcase the capabilities of MadKudu's Model-Context Provider (MCP). The app provides a hands-on experience through a structured, multi-page interface. Users will be able to explore the MCP's functionality bytesting individual tools in a playground, interacting with a general-purpose LLM, and engaging with specialized, pre-configured AI agents. The application's core purpose is to clearly and effectively demonstrate how connecting LLMs to the structured tools within MCP unlocks powerful, context-aware, and valuable business automation. All development will be done against a live, running MadKudu MCP server to ensure continuous, real-world validation.

## 2. Application Structure

The application will be organized into five primary pages:

1.  **Home (`/`):** A landing page introducing the app and its purpose.
2.  **Tool Playground (`/playground`):** An interface for testing individual MCP tools in isolation.
3.  **Chat (`/chat`):** A general-purpose chat interface for interacting with an LLM that can reference MCP tools.
4.  **Agents (`/agents`):** A dedicated area for conversing with specialized agents built for specific tasks.
5.  **Settings (`/settings`):** A page for configuring API keys and other application settings.

---

## 3. Implementation Tasks for AI Coder (Cursor)

This section contains a series of tasks to build the application. Each task is self-contained and builds upon the previous one.

### **Task 1: Project Initialization and Boilerplate Cleanup**

**Context:**
The first step is to initialize a new T3 Stack application using `pnpm` and clean up the default boilerplate code. We will use SQLite as our database, managed by Prisma.

**Instructions:**

1.  Initialize a new T3 application by running `pnpm create t3-app@latest mcp-demo-app`. Select `Next.js`, `TypeScript`, `Tailwind CSS`, `tRPC`, `Prisma`, and `App Router`.
2.  In `prisma/schema.prisma`, set the `provider` to `"sqlite"` and the `url` to `"file:./dev.db"`.
3.  Delete the example `Post` model from the schema and the corresponding router file at `src/server/api/routers/post.ts`.
4.  Remove the `post` router from `src/server/api/root.ts`.
5.  Replace the content of `src/app/page.tsx` with a basic placeholder component.
6.  Install `lucide-react`: `pnpm add lucide-react`.

**Documentation Links:**

* [T3 Stack Docs](https://create.t3.gg/en/introduction)
* [Prisma with SQLite](https://www.prisma.io/docs/getting-started/setup-prisma/start-from-scratch/relational-databases/using-sqlite-planetscale)

**Validation:**
Run `pnpm build`. The command should complete successfully.

### **Task 2: Create Core App Layout, Pages, and Navigation**

**Context:**
Now that the project is clean, we need to establish the main layout and create the five core pages for the application. The layout will include a persistent sidebar for navigation.

**Instructions:**

1.  Create the page files: `/playground/page.tsx`, `/chat/page.tsx`, `/agents/page.tsx`, `/settings/page.tsx`.
2.  Create a `Sidebar` component in `src/app/_components/Sidebar.tsx` for navigation.
3.  Update the root layout `src/app/layout.tsx` to use a two-column layout with the `Sidebar`.

**Documentation Links:**

* [Next.js App Router & Layouts](https://nextjs.org/docs/app/building-your-application/routing/layouts-and-templates)
* [Lucide Icons](https://lucide.dev/guide/packages/lucide-react)

**Validation:**
Run `pnpm build`. When running `pnpm dev`, the sidebar and pages should be navigable.

### **Task 3: Implement Settings Page, State Management, and Live MCP Validation**

**Context:**
This task is critical as it establishes the live connection to the MCP server. We will build the Settings UI, set up a global state manager (`zustand`) to hold API keys and connection status, and create a tRPC procedure to perform the actual validation against the running MCP server. **This task does not use a mock client.** The developer must have the MCP server running locally (e.g., via `pnpm mcp`) for this to work.

**Instructions:**

1.  Install `zustand`: `pnpm add zustand`.
2.  Create a global store at `src/stores/settings-store.ts`. This store will manage `madkuduApiKey`, `openaiApiKey`, and `mcpStatus` (`'unvalidated'`, `'validating'`, `'valid'`, `'invalid'`).
3.  Build the UI for the Settings page at `src/app/settings/page.tsx`. This component will use the Zustand store to manage its state.
4.  Create a new tRPC router for MCP at `src/server/api/routers/mcp.ts`. Add a procedure `validateKey`.
    * This procedure will import and use the **actual** `@madkudu/mcp-client` package (or equivalent SDK).
    * It will take an API key as input, instantiate the client, and call its validation method.
    * This procedure is the bridge to the live MCP server. The server-side code will look similar to this:
    ```typescript
    // src/server/api/routers/mcp.ts
    import { z } from "zod";
    import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
    // The actual SDK should be installed and imported here
    // import { MCPClient } from "@madkudu/mcp-client";
    
    export const mcpRouter = createTRPCRouter({
      validateKey: publicProcedure
        .input(z.object({ apiKey: z.string().min(1) }))
        .mutation(async ({ input }) => {
          try {
            // const mcp = new MCPClient({ apiKey: input.apiKey });
            // const { success } = await mcp.healthCheck(); // Or equivalent validation method
    
            // --- Placeholder for actual SDK logic ---
            console.log(`SERVER: Validating key against live MCP: ${input.apiKey}`);
            await new Promise(res => setTimeout(res, 1000));
            const success = input.apiKey === 'valid-key'; // Replace with real check
            // --- End Placeholder ---
    
            if (success) {
                return { success: true };
            }
            return { success: false, error: 'Invalid API Key.' };
          } catch (error) {
            console.error("MCP Validation Error:", error);
            return { success: false, error: 'Failed to connect to MCP server. Is it running?' };
          }
        }),
    });
    ```
5.  Add `mcpRouter` to your `root.ts` tRPC router.
6.  Connect the Settings page UI to call the `validateKey` tRPC mutation. On success or failure, update the `mcpStatus` in the Zustand store.

**Documentation Links:**

* [MadKudu MCP Documentation](https://madkudu.gitbook.io/api) (for setup and SDK info)
* [Zustand Docs](https://docs.pmnd.rs/zustand/getting-started/introduction)
* [tRPC Mutations](https://trpc.io/docs/useMutation)

**Validation:**
Run `pnpm build`. With the local MCP server running, start the app with `pnpm dev`. Go to the Settings page, enter a valid key, and click Validate. A successful tRPC call should update the global state and UI to show a "valid" status. An invalid key should show an error.

### **Task 4: Implement the Tool Playground with Live Data**

**Context:**
The Tool Playground will now be built on top of our live, validated MCP connection. It will fetch the list of available tools directly from the MCP server and allow users to execute them.

**Instructions:**

1.  In `src/server/api/routers/mcp.ts`, add two new procedures: `getTools` and `runTool`.
    * `getTools`: Should use the live MCP client instance to fetch the list of available tools.
    * `runTool`: Should take a `toolId` and a JSON `payload` as input and execute the tool using the live MCP client.
    * **Security Note:** These procedures must be secure. The MadKudu API key should **not** be passed from the client. It should be retrieved from a secure server-side context (e.g., environment variables or a session store initialized after validation).
2.  Create the `ToolPlayground` component at `src/app/playground/_components/ToolPlayground.tsx`.
3.  The component must first check the `mcpStatus` from the `useSettingsStore`. If the status is not `'valid'`, it must display a message prompting the user to go to the Settings page.
4.  If the connection is valid, use a tRPC query to call the `getTools` procedure and populate a dropdown.
5.  When a tool is selected, pre-populate a textarea with its default payload (referencing MadKudu's documentation).
6.  The "Execute" button will call the `runTool` tRPC mutation with the selected tool's ID and the user-provided payload.
7.  Display the JSON result or error from the tRPC call in a formatted block.

**Documentation Links:**

* [MadKudu API Docs (for payload examples)](https://developers.madkudu.com/)
* [tRPC Queries](https://trpc.io/docs/useQuery)

**Validation:**
Run `pnpm build`. After validating the MCP connection on the Settings page, navigate to the Playground. The page should successfully fetch and display the list of tools from the live MCP server. Executing a tool should return a real result or error from the server.

### **Task 5: Implement the General Chat Page**

**Context:**
This task involves creating the Chat page, where users can have a conversation with an LLM that is empowered to use the live MCP tools. This requires integrating the OpenAI API and orchestrating the tool-calling flow on the backend.

**Instructions:**
1.  Install the OpenAI SDK: `pnpm add openai`.
2.  Create the chat UI component at `src/app/chat/_components/ChatInterface.tsx`.
    * This component will manage the conversation history (`messages`) in its local state.
    * It will render the list of messages and an input form.
    * It should use the `useSettingsStore` to check for a valid `mcpStatus` and a present `openaiApiKey`. If either is missing, it should render a prompt for the user to visit the Settings page.
3.  Add a new procedure to `src/server/api/routers/mcp.ts` called `getChatResponse`.
    * This procedure will accept a `messages` array as input.
    * It will retrieve the available MCP tools (e.g., by calling the internal `getTools` logic).
    * It will then format these tools into the JSON format required by the OpenAI API's `tools` parameter.
    * The procedure will make a call to the OpenAI Chat Completions API, providing the message history and the defined tools.
    * **Tool-Calling Logic:**
        * If the OpenAI API response includes `tool_calls`, the procedure must iterate through them.
        * For each tool call, it will execute the corresponding MCP tool using the internal `runTool` logic.
        * The results from all tool calls are collected.
        * The procedure then makes a *second* call to the OpenAI API, appending the `tool_calls` and their results to the message history, to get a final, natural-language summary.
        * If the initial API response does *not* include `tool_calls`, its content is the final response.
    * The procedure returns the final message content from the assistant.
4.  In the `ChatInterface.tsx` component, use the `useMutation` hook from tRPC to call the `getChatResponse` procedure.
5.  The UI should provide clear user feedback, such as a "thinking" indicator while the mutation is pending. Bonus: Display a message like "Using tool: `Get Account Details`..." when a tool call is in progress.

**Documentation Links:**
* [OpenAI API Reference (Function Calling/Tools)](https://platform.openai.com/docs/guides/function-calling)
* [tRPC Mutations](https://trpc.io/docs/useMutation)

**Validation:**
Run `pnpm build`. After configuring keys in Settings, navigate to the Chat page. You should be able to have a conversation. Test it by asking a question that requires a tool, e.g., "Can you tell me about madkudu.com?". The app should display a response generated from the live tool result.

### **Task 6: Implement the Agent Library Page**

**Context:**
This task creates the "Agents" page, where users can create, manage, and chat with specialized agents defined by a "master prompt" document. These agents will be stored in the shared SQLite database.

**Instructions:**
1.  **Update Database Schema:**
    * In `prisma/schema.prisma`, add a new model for `Agent`.
        ```prisma
        model Agent {
          id          String   @id @default(cuid())
          name        String
          description String
          prompt      String   // Will store the full Markdown "master prompt"
          createdAt   DateTime @default(now())
          updatedAt   DateTime @updatedAt
        }
        ```
    * Run `pnpm prisma migrate dev --name add-agent-model` to apply the changes to your SQLite database.

2.  **Create Agent Management UI:**
    * The main page at `/agents` should display a list of existing agents fetched from the database and a "Create New Agent" button.
    * Clicking the create button should show a form (e.g., in a modal or on a new route `/agents/new`) with fields for `Name`, `Description`, and a large `textarea` for the `Master Prompt`.
    * The user will paste the entire Markdown-formatted agent definition into the `textarea`.

3.  **Implement Agent tRPC Procedures:**
    * Create a new router file `src/server/api/routers/agent.ts`.
    * Add the following procedures:
        * `create`: Takes `name`, `description`, and `prompt` strings. Saves a new agent to the database.
        * `list`: Fetches all agents from the database.
        * `getById`: Fetches a single agent by its ID.
        * `getAgentChatResponse`: This is the core logic. It will:
            * Accept an `agentId` and the `messages` array.
            * Fetch the agent's full `prompt` from the database.
            * Parse the prompt to find all `mcp_...` tool names mentioned.
            * Fetch the full definitions for only those specific tools from the MCP client.
            * Call the OpenAI API, using the agent's `prompt` as the system message and providing the filtered list of tools.
            * Handle the tool-calling loop just like in Task 5.
    * Add the new `agentRouter` to `src/server/api/root.ts`.

4.  **Build Agent Chat Interface:**
    * When a user clicks on an agent from the list (or after successfully creating one), navigate them to a dynamic route like `/agents/[agentId]`.
    * This page will use the `agentId` from the URL to fetch the agent's details.
    * It will feature a chat interface identical in function to the general one, but it will call the `getAgentChatResponse` mutation, passing the specific `agentId`.

**Documentation Links:**
* [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
* [Next.js Dynamic Routes](https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes)

**Validation:**
Run `pnpm build`. You should be able to create a new agent by pasting the provided Markdown example into the creation form. After saving, you should be redirected to a chat page for that agent. Interacting with the agent should trigger the specialized prompt and correctly use the tools defined within it. The new agent should also appear in the list on the main `/agents` page.