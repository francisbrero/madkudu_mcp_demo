import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { env } from "~/env";
import OpenAI from "openai";
import { observable } from "@trpc/server/observable";

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

  "agent3": `You are a MadKudu Customer Success Manager preparing for a strategic QBR with a key account.
  Use the information provided by the user to:
  
  1. Identify the client's current state and goals
  2. Analyze their usage patterns and highlight areas for improvement
  3. Create a plan to expand adoption and drive additional business value
  
  Your response should be in Markdown format with these sections:
  
  # QBR Plan for [Company Name]
  
  ## 1. Account Health Summary
  [Overall assessment of the account's health and usage]
  
  ## 2. Key Metrics
  - Usage trends
  - Value realized to date
  - Areas for improvement
  
  ## 3. Success Stories
  [1-2 specific examples of how they've used MadKudu successfully]
  
  ## 4. Growth Opportunities
  [3 specific opportunities to expand usage or adoption]
  
  ## 5. Action Plan
  [Concrete steps for the next 90 days]
  
  Be direct, data-focused, and business-oriented. Focus on tangible outcomes and ROI.`
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

  streamChat: publicProcedure
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
    .subscription(async ({ input }) => {
      // Get the agent-specific system instruction
      const systemInstruction = agentInstructionsMap[input.agentId as keyof typeof agentInstructionsMap] || 
        "You are a helpful assistant.";
      
      // Add system instruction to the beginning of the messages
      const messagesWithSystem = [
        { role: "system", content: systemInstruction },
        ...input.messages,
      ];

      return observable<{ delta: string; done: boolean }>((observer) => {
        const run = async () => {
          try {
            const stream = await openai.chat.completions.create({
              model: "gpt-4o",
              messages: messagesWithSystem,
              stream: true,
            });

            let fullResponse = '';
            
            for await (const chunk of stream) {
              const content = chunk.choices[0]?.delta?.content || '';
              fullResponse += content;
              observer.next({ 
                delta: content,
                done: false
              });
            }

            observer.next({ 
              delta: '',
              done: true 
            });
            observer.complete();
          } catch (error) {
            console.error('OpenAI stream error:', error);
            observer.error(error);
          }
        };

        run().catch((error) => {
          console.error("Error in streaming:", error);
          observer.error(error);
        });

        return () => {
          // Cleanup function if needed
        };
      });
    }),
}); 