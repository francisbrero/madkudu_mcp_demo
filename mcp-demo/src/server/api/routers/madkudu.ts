import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { env } from "~/env";
import OpenAI from "openai";
import {
  lookupPerson,
  lookupAccount,
  getAccountDetails,
  getContactDetails,
  getAIResearch,
  getDomainFromEmail,
  isEmail,
  isDomain,
} from "~/lib/madkuduClient";

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

// Enhanced prompts with MadKudu enrichment
const getEnhancedPromptForExecutiveOutreach = (enrichmentData: any) => {
  return `You are Francis Brero, CPO at MadKudu. You're preparing a first outreach to this executive.

## Company Context
${enrichmentData.companyContext || "No company context available."}

## Contact Context
${enrichmentData.contactContext || "No contact context available."}

## Instructions
Use the research above to:
- Identify and stack-rank 5 angles for outreach based on the data
- Draft a 3-step email sequence
- Suggest a LinkedIn connection message

Your response should be in Markdown format with the following sections:
- **Top 5 Angles**: With justification based on research
- **Email Sequence**: 3 tailored messages
- **LinkedIn Message**: A short connection note

Keep your tone professional, neutral, and avoid generic phrases. Make specific references to insights from the data where possible.`;
};

const getEnhancedPromptForAccountPlan = (enrichmentData: any) => {
  return `You are a strategic account executive at MadKudu, a GTM intelligence platform for B2B SaaS companies.

## Company Context
${enrichmentData.companyContext || "No company context available."}

## Usage Context
${enrichmentData.usageContext || "No usage data available."}

## Instructions
Create a full tactical account plan using the context above. Your response should be in Markdown format with these sections:

# Account Plan for ${enrichmentData.companyName || "[Company Name]"}

## 1. Account Objective Summary
[Why this account matters + definition of success based on the enrichment data]

## 2. Attack Plan Options
- Champion-led
- Product-led
- Top-down
(With specific pros/cons for each based on the company context)

## 3. Recommended Path Forward
[Choose best motion and explain why based on company data]

## 4. Target Contacts
[3–5 specific names or roles from the enrichment data]

## 5. Suggested Messaging
[For each contact: specific problems to address from the company context]

## 6. Next Steps
[Concrete actions the AE should take now]

Be tactical, specific, and actionable. Make bold recommendations based directly on the enriched data.`;
};

// Placeholder for future Agent 3
const getEnhancedPromptForAgent3 = (enrichmentData: any) => {
  return `You are Agent 3 with enhanced data.
  
Here's the enrichment data:
${JSON.stringify(enrichmentData, null, 2)}

This is a placeholder prompt.`;
};

export const madkuduRouter = createTRPCRouter({
  enhancedChat: publicProcedure
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
      console.log(`[MadKudu Router] Processing request for agent: ${input.agentId}`);
      
      // Get the last user message to extract relevant information
      const lastUserMessage = [...input.messages]
        .reverse()
        .find((msg) => msg.role === "user");

      if (!lastUserMessage) {
        throw new Error("No user message found");
      }

      const userInput = lastUserMessage.content;
      console.log(`[MadKudu Router] User input: "${userInput.substring(0, 50)}${userInput.length > 50 ? '...' : ''}"`);
      
      const extractedInfo: Record<string, any> = {};

      // Process the user input based on agent type
      if (input.agentId === "executive-outreach") {
        console.log(`[MadKudu Router] Processing for Executive Outreach agent`);
        // For executive outreach, we check if there's an email in the input
        if (isEmail(userInput)) {
          console.log(`[MadKudu Router] Detected email: ${userInput}`);
          // If it's an email, look up the person
          const personData = await lookupPerson(userInput);
          if (personData && personData.length > 0) {
            console.log(`[MadKudu Router] Found person data for ${userInput}`);
            extractedInfo.contactContext = JSON.stringify(personData[0], null, 2);
            
            // Also get the domain and look up the account
            const domain = getDomainFromEmail(userInput);
            console.log(`[MadKudu Router] Extracted domain: ${domain}`);
            const accountData = await lookupAccount(domain);
            if (accountData && accountData.length > 0) {
              console.log(`[MadKudu Router] Found account data for ${domain}`);
              extractedInfo.companyContext = JSON.stringify(accountData[0], null, 2);
              extractedInfo.companyName = accountData[0].name || domain;
              
              // Get AI research
              try {
                console.log(`[MadKudu Router] Getting AI research for ${domain}`);
                // This would typically be streamed in real-time, but we'll mock it here
                extractedInfo.researchContext = `AI Research for ${domain}: This would be streamed real-time research data.`;
              } catch (error) {
                console.error("Error getting AI research:", error);
              }
            } else {
              console.log(`[MadKudu Router] No account data found for ${domain}`);
            }
          } else {
            console.log(`[MadKudu Router] No person data found for ${userInput}`);
          }
        } else if (isDomain(userInput) || userInput.includes('.')) {
          // Treat it as a domain name
          const domain = userInput.toLowerCase();
          console.log(`[MadKudu Router] Detected domain: ${domain}`);
          const accountData = await lookupAccount(domain);
          if (accountData && accountData.length > 0) {
            console.log(`[MadKudu Router] Found account data for ${domain}`);
            extractedInfo.companyContext = JSON.stringify(accountData[0], null, 2);
            extractedInfo.companyName = accountData[0].name || domain;
            
            // Get AI research
            try {
              console.log(`[MadKudu Router] Getting AI research for ${domain}`);
              extractedInfo.researchContext = `AI Research for ${domain}: This would be streamed real-time research data.`;
            } catch (error) {
              console.error("Error getting AI research:", error);
            }
          } else {
            console.log(`[MadKudu Router] No account data found for ${domain}`);
          }
        } else {
          console.log(`[MadKudu Router] Input not recognized as email or domain`);
        }
      } else if (input.agentId === "account-plan") {
        console.log(`[MadKudu Router] Processing for Account Plan agent`);
        // For account plan, we're primarily interested in the domain
        if (isDomain(userInput) || userInput.includes('.')) {
          const domain = userInput.toLowerCase();
          console.log(`[MadKudu Router] Detected domain: ${domain}`);
          const accountData = await lookupAccount(domain);
          if (accountData && accountData.length > 0) {
            console.log(`[MadKudu Router] Found account data for ${domain}`);
            extractedInfo.companyContext = JSON.stringify(accountData[0], null, 2);
            extractedInfo.companyName = accountData[0].name || domain;
            
            // Get AI research
            try {
              console.log(`[MadKudu Router] Getting AI research for ${domain}`);
              extractedInfo.researchContext = `AI Research for ${domain}: This would be streamed real-time research data.`;
            } catch (error) {
              console.error("Error getting AI research:", error);
            }
            
            // Add mock usage data
            extractedInfo.usageContext = `Usage data for ${domain}: This would be real product usage data.`;
          } else {
            console.log(`[MadKudu Router] No account data found for ${domain}`);
          }
        } else if (isEmail(userInput)) {
          // If it's an email, extract domain and proceed
          console.log(`[MadKudu Router] Detected email: ${userInput}`);
          const domain = getDomainFromEmail(userInput);
          console.log(`[MadKudu Router] Extracted domain: ${domain}`);
          const accountData = await lookupAccount(domain);
          if (accountData && accountData.length > 0) {
            console.log(`[MadKudu Router] Found account data for ${domain}`);
            extractedInfo.companyContext = JSON.stringify(accountData[0], null, 2);
            extractedInfo.companyName = accountData[0].name || domain;
            
            // Get AI research and usage data as above
            console.log(`[MadKudu Router] Getting AI research for ${domain}`);
            extractedInfo.researchContext = `AI Research for ${domain}: This would be streamed real-time research data.`;
            extractedInfo.usageContext = `Usage data for ${domain}: This would be real product usage data.`;
          } else {
            console.log(`[MadKudu Router] No account data found for ${domain}`);
          }
        } else {
          console.log(`[MadKudu Router] Input not recognized as email or domain`);
        }
      }

      console.log(`[MadKudu Router] Enrichment completed, found ${Object.keys(extractedInfo).length} data points`);
      
      // Get enhanced prompt based on agent type
      let enhancedPrompt = "";
      switch (input.agentId) {
        case "executive-outreach":
          enhancedPrompt = getEnhancedPromptForExecutiveOutreach(extractedInfo);
          break;
        case "account-plan":
          enhancedPrompt = getEnhancedPromptForAccountPlan(extractedInfo);
          break;
        case "agent3":
          enhancedPrompt = getEnhancedPromptForAgent3(extractedInfo);
          break;
        default:
          enhancedPrompt = "You are a helpful assistant with access to enriched data.";
      }

      // Add system instruction to the beginning of the messages
      const messagesWithSystem = [
        { role: "system", content: enhancedPrompt },
        ...input.messages,
      ];

      console.log(`[MadKudu Router] Calling OpenAI API with enhanced prompt`);
      
      // Call OpenAI API
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: messagesWithSystem,
      });

      console.log(`[MadKudu Router] OpenAI API response received`);
      
      return {
        content: completion.choices[0]?.message.content ?? "No response",
        enrichmentData: extractedInfo,
      };
    }),
}); 