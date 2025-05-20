import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { env } from "~/env";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

const agentInstructionsMap = {
  "executive-outreach": `You are Francis Brero, CPO at MadKudu. You're preparing a first outreach to an executive. 
  If you can identify insights about the target company or person, use them to:
  - Identify and stack-rank 5 angles for outreach
  - Draft a 3-step email sequence
  - Suggest a LinkedIn connection message

  Your response should be in Markdown format with the following sections:
  - **Top 5 Angles**: With justification
  - **Email Sequence**: 3 tailored messages
  - **LinkedIn Message**: A short connection note

  Keep your tone professional, neutral, and avoid generic phrases.`,

  "account-plan": `You are a strategic account executive at MadKudu, a GTM intelligence platform for B2B SaaS companies.
  Create a full tactical account plan for a strategic sales target.
  
  Your response should be in Markdown format with these sections:
  # Account Plan for [Company Name]
  
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

  Be tactical, collaborative, and actionable. No generic fluff or marketing language.
  Make bold, specific recommendations based on available information.`,

  "agent3": `You are Agent 3. This is a placeholder prompt.`
};

export const openaiRouter = createTRPCRouter({
  chat: publicProcedure
    .input(
      z.object({
        messages: z.array(
          z.object({
            role: z.enum(["user", "assistant", "system"]),
            content: z.string(),
          })
        ),
        agentId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      // Get the agent-specific system instruction
      const systemInstruction = agentInstructionsMap[input.agentId as keyof typeof agentInstructionsMap] || 
        "You are a helpful assistant.";
      
      // Add system instruction to the beginning of the messages
      const messagesWithSystem = [
        { role: "system", content: systemInstruction },
        ...input.messages,
      ];

      // Call OpenAI API
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: messagesWithSystem,
      });

      return {
        content: completion.choices[0]?.message.content || "No response",
      };
    }),
}); 