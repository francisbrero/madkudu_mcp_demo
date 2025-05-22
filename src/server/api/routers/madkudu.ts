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
  getAIResearchWithRetry,
  testAIResearchFormat,
  getDomainFromEmail,
  isEmail,
  isDomain,
} from "~/lib/madkuduClient";
import { PrismaClient } from "@prisma/client";

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

const prisma = new PrismaClient();

// Terminal color codes for logging
const colors = {
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  reset: "\x1b[0m",
};

// Function to log prompt in color
const logPrompt = (prompt: string) => {
  console.log(`${colors.magenta}[MadKudu Router] Enhanced Prompt:${colors.reset}`);
  console.log(`${colors.cyan}${prompt}${colors.reset}`);
};

// Function to log API response
const logApiResponse = (label: string, data: any) => {
  console.log(`${colors.yellow}[MadKudu API Response] ${label}:${colors.reset}`);
  console.log(`${colors.green}${JSON.stringify(data, null, 2).substring(0, 500)}...${colors.reset}`);
};

// Function to extract domain or company name from a user query
const extractEntityFromQuery = (query: string): { type: 'domain' | 'email' | 'company' | 'unknown', value: string } => {
  // Check if query contains an email
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/;
  const emailMatch = query.match(emailRegex);
  if (emailMatch) {
    return { type: 'email', value: emailMatch[0] };
  }
  
  // Check if query contains a domain
  const domainRegex = /\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]\b/gi;
  const domainMatches = query.match(domainRegex);
  if (domainMatches) {
    // Filter out common words that might match domain pattern but aren't domains
    const commonWordsThatLookLikeDomains = ['about.com', 'i.e.', 'e.g.'];
    const filteredDomains = domainMatches.filter(domain => 
      !commonWordsThatLookLikeDomains.includes(domain.toLowerCase()) &&
      domain.includes('.') && 
      domain.split('.').length >= 2 &&
      domain.split('.')[1].length >= 2
    );
    
    if (filteredDomains.length > 0) {
      return { type: 'domain', value: filteredDomains[0] };
    }
  }
  
  // Check if query is about a company
  const aboutCompanyRegex = /(?:about|information on|tell me about|info about|data on)\s+([A-Za-z0-9][A-Za-z0-9\s&_-]+)(?:\.com|\.ai|\.io|\.co|\.net)?/i;
  const companyMatch = query.match(aboutCompanyRegex);
  if (companyMatch && companyMatch[1]) {
    return { type: 'company', value: companyMatch[1].trim() };
  }
  
  // As a last resort, try to extract any word that might be a company name
  const potentialCompanyRegex = /([A-Z][A-Za-z0-9]+(?:\s[A-Z][A-Za-z0-9]+)*)/;
  const potentialCompanyMatch = query.match(potentialCompanyRegex);
  if (potentialCompanyMatch && potentialCompanyMatch[1]) {
    return { type: 'company', value: potentialCompanyMatch[1].trim() };
  }
  
  return { type: 'unknown', value: query };
};

// Enhanced prompts with MadKudu enrichment
const getEnhancedPromptForExecutiveOutreach = (enrichmentData: Record<string, string>) => {
  let companyContext = "No company information available.";
  let contactContext = "No contact information available.";
  
  // Format company context using account info and research
  if (enrichmentData.companyContext || enrichmentData.researchContext) {
    companyContext = "";
    
    if (enrichmentData.companyContext) {
      try {
        const companyData = JSON.parse(enrichmentData.companyContext) as Record<string, unknown>;
        companyContext += `### Firmographic Data\n`;
        companyContext += `**Company**: ${(companyData.name as string) ?? "Unknown"}\n`;
        companyContext += `**Industry**: ${(companyData.industry as string) ?? "Unknown"}\n`;
        companyContext += `**Size**: ${(companyData.employees_count as number) ?? "Unknown"} employees\n`;
        companyContext += `**Customer Fit Score**: ${(companyData.customer_fit_score as number) ?? "N/A"}/10\n`;
        companyContext += `**Likelihood to Buy Score**: ${(companyData.likelihood_to_buy_score as number) ?? "N/A"}/10\n\n`;
      } catch (error) {
        // If JSON parsing fails, use the raw context
        companyContext += `${enrichmentData.companyContext}\n\n`;
      }
    }
    
    if (enrichmentData.researchContext) {
      companyContext += `### AI-Generated Research\n${enrichmentData.researchContext}\n\n`;
    }
  }
  
  // Format contact context using person data and additional details
  if (enrichmentData.contactContext || enrichmentData.contactDetails) {
    contactContext = "";
    
    if (enrichmentData.contactContext) {
      try {
        const contactData = JSON.parse(enrichmentData.contactContext) as Record<string, unknown>;
        contactContext += `### Contact Information\n`;
        contactContext += `**Name**: ${(contactData.name as string) ?? "Unknown"}\n`;
        contactContext += `**Title**: ${(contactData.title as string) ?? "Unknown"}\n`;
        contactContext += `**Seniority**: ${(contactData.seniority as string) ?? "Unknown"}\n`;
        if (contactData.linkedin_handle) {
          contactContext += `**LinkedIn**: ${contactData.linkedin_handle as string}\n`;
        }
        contactContext += "\n";
      } catch (error) {
        // If JSON parsing fails, use the raw context
        contactContext += `${enrichmentData.contactContext}\n\n`;
      }
    }
    
    if (enrichmentData.contactDetails) {
      contactContext += `### Additional Contact Details\n${enrichmentData.contactDetails}\n\n`;
    }
  }

  return `You are Francis Brero, CPO at MadKudu. You're preparing a first outreach to this executive.

## Company Context
${companyContext}

## Contact Context
${contactContext}

## Instructions
Use the research above to:
- Identify and stack-rank 5 angles for outreach based on the data
- Draft a 3-step email sequence
- Suggest a LinkedIn connection message

Your response should be in Markdown format with the following sections:
- **Top 5 Angles**: With justification based on research
- **Email Sequence**: 3 tailored messages
- **LinkedIn Message**: A short connection note

Keep your tone professional, neutral, and avoid generic phrases or ChatGPT-sounding language. Make specific references to insights from the data where possible. Avoid flattery and creepy-sounding personalization. If there are past engagements, product usage, or shared interests visible in the data, prioritize mentioning those.`;
};

const getEnhancedPromptForAccountPlan = (enrichmentData: Record<string, string>) => {
  // Format company context in a more readable way
  let formattedCompanyContext = "No company information available.";
  let formattedResearchContext = "";
  let formattedUsageContext = "No usage data available.";
  
  if (enrichmentData.companyContext) {
    try {
      const companyData = JSON.parse(enrichmentData.companyContext) as Record<string, unknown>;
      formattedCompanyContext = `### Company Profile\n`;
      formattedCompanyContext += `**Company**: ${(companyData.name as string) ?? "Unknown"}\n`;
      formattedCompanyContext += `**Industry**: ${(companyData.industry as string) ?? "Unknown"}\n`;
      formattedCompanyContext += `**Size**: ${(companyData.employees_count as number) ?? "Unknown"} employees\n`;
      formattedCompanyContext += `**Revenue**: ${(companyData.revenue_range as string) ?? "Unknown"}\n`;
      formattedCompanyContext += `**Location**: ${(companyData.location as string) ?? "Unknown"}\n`;
      formattedCompanyContext += `**Technology Stack**: ${Array.isArray(companyData.technologies) ? (companyData.technologies as string[]).join(", ") : "Unknown"}\n`;
      formattedCompanyContext += `**Customer Fit Score**: ${(companyData.customer_fit_score as number) ?? "N/A"}/10\n`;
      formattedCompanyContext += `**Likelihood to Buy Score**: ${(companyData.likelihood_to_buy_score as number) ?? "N/A"}/10\n\n`;
    } catch (error: unknown) {
      console.error("Error parsing company context:", error);
      // If JSON parsing fails, use the raw context
      formattedCompanyContext = `${enrichmentData.companyContext}\n\n`;
    }
  }
  
  if (enrichmentData.researchContext) {
    formattedResearchContext = `### AI-Generated Research\n${enrichmentData.researchContext}\n\n`;
  }
  
  if (enrichmentData.usageContext) {
    formattedUsageContext = `### Product Usage Data\n${enrichmentData.usageContext}\n\n`;
  }
  
  if (enrichmentData.accountDetails) {
    try {
      const accountDetails = JSON.parse(enrichmentData.accountDetails) as Record<string, unknown>;
      formattedUsageContext += `### Additional Account Details\n`;
      
      // Add information about known contacts if available
      if (accountDetails.contacts && Array.isArray(accountDetails.contacts)) {
        formattedUsageContext += `\n#### Key Contacts\n`;
        (accountDetails.contacts as Array<Record<string, unknown>>).forEach((contact, index) => {
          const name = typeof contact.name === 'string' ? contact.name : 'Unknown';
          const title = typeof contact.title === 'string' ? contact.title : 'Unknown';
          const seniority = typeof contact.seniority === 'string' ? contact.seniority : 'Unknown';
          
          formattedUsageContext += `${index + 1}. **${name}** (${title})\n`;
          if (contact.email && typeof contact.email === 'string') formattedUsageContext += `   Email: ${contact.email}\n`;
          if (contact.linkedin_handle && typeof contact.linkedin_handle === 'string') formattedUsageContext += `   LinkedIn: ${contact.linkedin_handle}\n`;
          formattedUsageContext += `   Seniority: ${seniority}\n`;
        });
      }
      
      // Add information about engagement if available
      if (accountDetails.engagement && typeof accountDetails.engagement === 'object' && accountDetails.engagement !== null) {
        const engagement = accountDetails.engagement as Record<string, unknown>;
        formattedUsageContext += `\n#### Engagement History\n`;
        
        const lastContacted = typeof engagement.last_contacted === 'string' ? engagement.last_contacted : 'Unknown';
        const interactionCount = typeof engagement.interaction_count === 'number' ? 
          engagement.interaction_count.toString() : 
          (typeof engagement.interaction_count === 'string' ? engagement.interaction_count : '0');
          
        formattedUsageContext += `Last contacted: ${lastContacted}\n`;
        formattedUsageContext += `Number of interactions: ${interactionCount}\n`;
      }
      
      formattedUsageContext += `\n`;
    } catch (error: unknown) {
      console.error("Error parsing account details:", error);
      // If parsing fails, append the raw data
      formattedUsageContext += `${enrichmentData.accountDetails}\n\n`;
    }
  }

  return `You are a strategic account executive at MadKudu, a GTM intelligence platform for B2B SaaS companies.

## Company Context
${formattedCompanyContext}
${formattedResearchContext}

## Usage Context
${formattedUsageContext}

## Instructions
Create a full tactical account plan using the context above. Your response should be in Markdown format with these sections:

# Account Plan for ${enrichmentData.companyName ?? "[Company Name]"}

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
[3–5 specific names, titles, optional emails or roles based on the data]

## 5. Suggested Messaging
[For each contact: what problem to speak to and how MadKudu helps]

## 6. Next Steps
[Concrete actions the AE should take now]

Be tactical, specific, and actionable. Make bold recommendations based directly on the enriched data. Avoid generic fluff or marketing language.`;
};

// Placeholder for future Agent 3
const getEnhancedPromptForAgent3 = (enrichmentData: Record<string, string>) => {
  return `You are a MadKudu Customer Success Manager preparing for a strategic QBR with a key account.

## Company Context
${enrichmentData.companyContext ?? "No company context available."}

## Usage Context
${enrichmentData.usageContext ?? "No usage data available."}

## Instructions
Use the context above to create a detailed QBR plan:

# QBR Plan for ${enrichmentData.companyName ?? "[Company Name]"}

## 1. Account Health Summary
[Detailed assessment based on the usage data and company profile]

## 2. Key Metrics
- Usage trends from the data
- Value realized based on specific use cases
- Areas for improvement identified in the data

## 3. Success Stories
[1-2 specific examples from their usage patterns]

## 4. Growth Opportunities
[3 specific opportunities based on their industry, size, and current usage]

## 5. Action Plan
[Data-driven recommendations for the next 90 days]

Be specific, use data points from the enrichment to justify your recommendations, and focus on measurable business outcomes.`;
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

      // Function to handle company name lookup with domain variations
      const enrichCompanyName = async (companyName: string) => {
        console.log(`[MadKudu Router] Attempting to handle "${companyName}" as company name`);
        
        // Try common domain variations
        const domainVariations = [
          `${companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
          `${companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.ai`,
          `${companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.io`,
          `${companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.net`
        ];
        
        let foundAccount = false;
        
        // Try each domain variation
        for (const domain of domainVariations) {
          try {
            console.log(`[MadKudu Router] Trying domain variation: ${domain}`);
            const accountData = await lookupAccount(domain);
            
            // Log the API response
            logApiResponse(`Account lookup for ${domain}`, accountData);
            
            if (accountData && accountData.length > 0) {
              console.log(`[MadKudu Router] Found account data for ${domain}`);
              extractedInfo.companyContext = JSON.stringify(accountData[0], null, 2);
              extractedInfo.companyName = accountData[0].name || companyName;
              
              // Try to fetch additional account details
              if (accountData[0].id) {
                try {
                  console.log(`[MadKudu Router] Getting account details for ID: ${accountData[0].id}`);
                  const accountDetails = await getAccountDetails(accountData[0].id);
                  if (accountDetails) {
                    extractedInfo.accountDetails = JSON.stringify(accountDetails, null, 2);
                    console.log(`[MadKudu Router] Found additional account details`);
                    logApiResponse(`Account details for ${domain}`, accountDetails);
                  }
                } catch (error) {
                  console.error("Error getting account details:", error);
                }
              }
              
              // Get AI research
              try {
                console.log(`[MadKudu Router] Getting AI research for ${domain}`);
                const researchText = await getAIResearchWithRetry(domain);
                extractedInfo.researchContext = researchText;
                console.log(`[MadKudu Router] Successfully retrieved AI research for ${domain}`);
                logApiResponse(`AI Research for ${domain}`, { text: researchText.substring(0, 200) + "..." });
              } catch (error) {
                console.error("Error getting AI research:", error);
                extractedInfo.researchContext = `
### Key Facts about ${companyName}
- Industry leader in their space
- Offering innovative solutions
- Key challenges and opportunities
- Competitive positioning
                `;
                console.log(`[MadKudu Router] Using fallback research data for ${domain}`);
              }
              
              foundAccount = true;
              break;
            }
          } catch (error) {
            console.error(`[MadKudu Router] Error looking up account for ${domain}:`, error);
          }
        }
        
        // If we couldn't find an account with domain variations, create a generic profile
        if (!foundAccount) {
          console.log(`[MadKudu Router] No account found for company name. Creating generic profile.`);
          extractedInfo.companyName = companyName;
          extractedInfo.companyContext = JSON.stringify({
            "name": companyName,
            "domain": domainVariations[0],
            "industry": "Technology",
            "employees_count": 500,
            "customer_fit_score": 8,
            "likelihood_to_buy_score": 7
          }, null, 2);
          
          // Generate some basic research
          try {
            console.log(`[MadKudu Router] Getting AI research for ${companyName}`);
            const researchText = await getAIResearchWithRetry(companyName);
            extractedInfo.researchContext = researchText;
            console.log(`[MadKudu Router] Successfully retrieved AI research for ${companyName}`);
            logApiResponse(`AI Research for ${companyName}`, { text: researchText.substring(0, 200) + "..." });
          } catch (error) {
            console.error("Error getting AI research:", error);
            extractedInfo.researchContext = `
### Key Facts about ${companyName}
- Industry leader in their space
- Offering innovative solutions
- Key challenges and opportunities
- Competitive positioning
            `;
            console.log(`[MadKudu Router] Using fallback research data for ${companyName}`);
          }
        }
        
        return foundAccount;
      };

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
            
            // Try to fetch additional contact details if there's a contactId
            if (personData[0].id) {
              try {
                console.log(`[MadKudu Router] Getting contact details for ID: ${personData[0].id}`);
                const contactDetails = await getContactDetails(personData[0].id);
                if (contactDetails) {
                  extractedInfo.contactDetails = JSON.stringify(contactDetails, null, 2);
                  console.log(`[MadKudu Router] Found additional contact details`);
                }
              } catch (error) {
                console.error("Error getting contact details:", error);
              }
            }
            
            // Also get the domain and look up the account
            const domain = getDomainFromEmail(userInput);
            console.log(`[MadKudu Router] Extracted domain: ${domain}`);
            const accountData = await lookupAccount(domain);
            if (accountData && accountData.length > 0) {
              console.log(`[MadKudu Router] Found account data for ${domain}`);
              extractedInfo.companyContext = JSON.stringify(accountData[0], null, 2);
              extractedInfo.companyName = accountData[0].name || domain;
              
              // Try to fetch additional account details if there's an accountId
              if (accountData[0].id) {
                try {
                  console.log(`[MadKudu Router] Getting account details for ID: ${accountData[0].id}`);
                  const accountDetails = await getAccountDetails(accountData[0].id);
                  if (accountDetails) {
                    extractedInfo.accountDetails = JSON.stringify(accountDetails, null, 2);
                    console.log(`[MadKudu Router] Found additional account details`);
                  }
                } catch (error) {
                  console.error("Error getting account details:", error);
                }
              }
              
              // Get AI research
              try {
                console.log(`[MadKudu Router] Getting AI research for ${domain}`);
                // Get real AI research with retry logic
                const researchText = await getAIResearchWithRetry(domain);
                extractedInfo.researchContext = researchText;
                console.log(`[MadKudu Router] Successfully retrieved AI research for ${domain}`);
              } catch (error) {
                console.error("Error getting AI research:", error);
                // Fallback to simulated data if the API fails
                extractedInfo.researchContext = `
### Key Facts
- Industry leader in ${(accountData[0].industry as string) ?? "their industry"}
- Recent funding of $XX million (Series X)
- Expanding into new markets in EMEA and APAC
- Launched new product line in Q2
- Current challenges include integration with legacy systems

### Sales Angles
1. ROI acceleration
2. Lead-to-revenue time reduction
3. Sales and marketing alignment
4. Data-driven GTM motions
5. Customer journey optimization`;
                console.log(`[MadKudu Router] Using fallback research data for ${domain}`);
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
            extractedInfo.companyName = accountData[0].name ?? domain;
            
            // Try to fetch additional account details if there's an accountId
            if (accountData[0].id) {
              try {
                console.log(`[MadKudu Router] Getting account details for ID: ${accountData[0].id}`);
                const accountDetails = await getAccountDetails(accountData[0].id);
                if (accountDetails) {
                  extractedInfo.accountDetails = JSON.stringify(accountDetails, null, 2);
                  console.log(`[MadKudu Router] Found additional account details`);
                }
              } catch (error) {
                console.error("Error getting account details:", error);
              }
            }
            
            // Get AI research
            try {
              console.log(`[MadKudu Router] Getting AI research for ${domain}`);
              // Get real AI research with retry logic
              const researchText = await getAIResearchWithRetry(domain);
              extractedInfo.researchContext = researchText;
              console.log(`[MadKudu Router] Successfully retrieved AI research for ${domain}`);
            } catch (error) {
              console.error("Error getting AI research:", error);
              // Fallback to simulated data if the API fails
              extractedInfo.researchContext = `
### Key Facts
- Industry leader in ${(accountData[0].industry as string) ?? "their industry"}
- Recent funding of $XX million (Series X)
- Expanding into new markets in EMEA and APAC
- Launched new product line in Q2
- Current challenges include integration with legacy systems

### Sales Angles
1. ROI acceleration
2. Lead-to-revenue time reduction
3. Sales and marketing alignment
4. Data-driven GTM motions
5. Customer journey optimization`;
              console.log(`[MadKudu Router] Using fallback research data for ${domain}`);
            }
            
            // For executive outreach, we should also have some contact data
            // If we don't have a specific person, look for company executives
            extractedInfo.contactContext = JSON.stringify({
              name: "Executive at " + (accountData[0].name ?? domain),
              title: "Unknown Title",
              seniority: "executive",
              company_name: accountData[0].name ?? domain
            }, null, 2);
            
            console.log("[MadKudu Router] Added generic executive contact data for domain");
          } else {
            console.log(`[MadKudu Router] No account data found for ${domain}`);
          }
        } else {
          console.log(`[MadKudu Router] Input not recognized as email or domain`);
          
          // Try to handle it as a company name
          const possibleCompanyName = userInput.trim();
          console.log(`[MadKudu Router] Attempting to handle "${possibleCompanyName}" as company name`);
          
          // Try common domain variations
          const domainVariations = [
            `${possibleCompanyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
            `${possibleCompanyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.ai`,
            `${possibleCompanyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.io`
          ];
          
          let foundAccount = false;
          
          // Try each domain variation
          for (const domain of domainVariations) {
            try {
              console.log(`[MadKudu Router] Trying domain variation: ${domain}`);
              const accountData = await lookupAccount(domain);
              
              if (accountData && accountData.length > 0) {
                console.log(`[MadKudu Router] Found account data for ${domain}`);
                extractedInfo.companyContext = JSON.stringify(accountData[0], null, 2);
                extractedInfo.companyName = accountData[0].name || possibleCompanyName;
                
                // Try to fetch additional account details
                if (accountData[0].id) {
                  try {
                    console.log(`[MadKudu Router] Getting account details for ID: ${accountData[0].id}`);
                    const accountDetails = await getAccountDetails(accountData[0].id);
                    if (accountDetails) {
                      extractedInfo.accountDetails = JSON.stringify(accountDetails, null, 2);
                      console.log(`[MadKudu Router] Found additional account details`);
                    }
                  } catch (error) {
                    console.error("Error getting account details:", error);
                  }
                }
                
                // Get AI research
                try {
                  console.log(`[MadKudu Router] Getting AI research for ${domain}`);
                  const researchText = await getAIResearchWithRetry(domain);
                  extractedInfo.researchContext = researchText;
                  console.log(`[MadKudu Router] Successfully retrieved AI research for ${domain}`);
                } catch (error) {
                  console.error("Error getting AI research:", error);
                  extractedInfo.researchContext = `
### Key Facts about ${possibleCompanyName}
- Industry leader in their space
- Offering innovative solutions
- Key challenges and opportunities
- Competitive positioning
                  `;
                  console.log(`[MadKudu Router] Using fallback research data for ${domain}`);
                }
                
                foundAccount = true;
                break;
              }
            } catch (error) {
              console.error(`[MadKudu Router] Error looking up account for ${domain}:`, error);
            }
          }
          
          // If we couldn't find an account with domain variations, create a generic profile
          if (!foundAccount) {
            console.log(`[MadKudu Router] No account found for company name. Creating generic profile.`);
            extractedInfo.companyName = possibleCompanyName;
            extractedInfo.companyContext = JSON.stringify({
              "name": possibleCompanyName,
              "domain": domainVariations[0],
              "industry": "Technology",
              "employees_count": 500,
              "customer_fit_score": 8,
              "likelihood_to_buy_score": 7
            }, null, 2);
            
            // Generate some basic research via API
            try {
              console.log(`[MadKudu Router] Getting AI research for ${possibleCompanyName}`);
              const researchText = await getAIResearchWithRetry(possibleCompanyName);
              extractedInfo.researchContext = researchText;
              console.log(`[MadKudu Router] Successfully retrieved AI research for ${possibleCompanyName}`);
            } catch (error) {
              console.error("Error getting AI research:", error);
              extractedInfo.researchContext = `
### Key Facts about ${possibleCompanyName}
- Industry leader in their space
- Offering innovative solutions
- Key challenges and opportunities
- Competitive positioning
              `;
              console.log(`[MadKudu Router] Using fallback research data for ${possibleCompanyName}`);
            }
          }
        }
      } else if (input.agentId === "account-plan") {
        console.log(`[MadKudu Router] Processing for Account Plan agent`);
        // For account plan, we're primarily interested in the domain
        if (isDomain(userInput) || userInput.includes('.')) {
          const domain = userInput.toLowerCase();
          console.log(`[MadKudu Router] Detected domain: ${domain}`);
          try {
            const accountData = await lookupAccount(domain);
            if (accountData && Array.isArray(accountData) && accountData.length > 0) {
              console.log(`[MadKudu Router] Found account data for ${domain}`);
              extractedInfo.companyContext = JSON.stringify(accountData[0], null, 2);
              extractedInfo.companyName = accountData[0].name || domain;
              
              // Try to fetch additional account details if there's an accountId
              if (accountData[0].id) {
                try {
                  console.log(`[MadKudu Router] Getting account details for ID: ${accountData[0].id}`);
                  const accountDetails = await getAccountDetails(accountData[0].id);
                  if (accountDetails) {
                    extractedInfo.accountDetails = JSON.stringify(accountDetails, null, 2);
                    console.log(`[MadKudu Router] Found additional account details`);
                  }
                } catch (error: unknown) {
                  console.error("Error getting account details:", error);
                }
              }
              
              // Get AI research
              try {
                console.log(`[MadKudu Router] Getting AI research for ${domain}`);
                // Get real AI research with retry logic
                const researchText = await getAIResearchWithRetry(domain);
                extractedInfo.researchContext = researchText;
                console.log(`[MadKudu Router] Successfully retrieved AI research for ${domain}`);
              } catch (error) {
                console.error("Error getting AI research:", error);
                // Fallback to simulated data if the API fails
                extractedInfo.researchContext = `
### Key Facts
- Industry leader in ${(accountData[0].industry as string) ?? "their industry"}
- Recent funding of $XX million (Series X)
- Expanding into new markets in EMEA and APAC
- Launched new product line in Q2
- Current challenges include integration with legacy systems

### Sales Angles
1. ROI acceleration
2. Lead-to-revenue time reduction
3. Sales and marketing alignment
4. Data-driven GTM motions
5. Customer journey optimization`;
                console.log(`[MadKudu Router] Using fallback research data for ${domain}`);
              }
              
              // Add simulated product usage and activation data
              extractedInfo.usageContext = `
### Product Fit Assessment
- Primary use case: Lead scoring and qualification
- Value drivers: Improved conversion rates, reduced sales cycle time
- Integration potential: High (${accountData[0].technologies ? "current tech stack includes " + (accountData[0].technologies as string[]).slice(0, 3).join(", ") : "compatible with standard B2B SaaS stack"})
- Expected ROI timeframe: 3-6 months after implementation

### Potential Users
- Marketing Operations team (primary users)
- SDR/BDR team (daily users)
- Sales leadership (insights consumers)
- Revenue Operations (administrators)

### Adoption Readiness
- Team readiness: ${accountData[0].customer_fit_score && (accountData[0].customer_fit_score as number) > 7 ? "High" : "Medium"}
- Technical readiness: ${accountData[0].technologies && Array.isArray(accountData[0].technologies) && (accountData[0].technologies as string[]).length > 5 ? "High" : "Medium"}
- Budget readiness: ${accountData[0].funding_type ? "High (recently secured funding)" : "To be determined"}
- Value alignment: ${accountData[0].likelihood_to_buy_score && (accountData[0].likelihood_to_buy_score as number) > 7 ? "Strong" : "Moderate"}
`;
            } else {
              console.log(`[MadKudu Router] No account data found for ${domain}`);
            }
          } catch (error: unknown) {
            console.error(`[MadKudu Router] Error looking up account for ${domain}:`, error);
          }
        } else if (isEmail(userInput)) {
          // If it's an email, extract domain and proceed
          console.log(`[MadKudu Router] Detected email: ${userInput}`);
          const domain = getDomainFromEmail(userInput);
          console.log(`[MadKudu Router] Extracted domain: ${domain}`);
          
          try {
            // First, look up the person to get contact info
            const personData = await lookupPerson(userInput);
            if (personData && Array.isArray(personData) && personData.length > 0) {
              console.log(`[MadKudu Router] Found person data for ${userInput}`);
              extractedInfo.contactContext = JSON.stringify(personData[0], null, 2);
              
              // Try to fetch additional contact details if there's a contactId
              if (personData[0].id) {
                try {
                  console.log(`[MadKudu Router] Getting contact details for ID: ${personData[0].id}`);
                  const contactDetails = await getContactDetails(personData[0].id);
                  if (contactDetails) {
                    extractedInfo.contactDetails = JSON.stringify(contactDetails, null, 2);
                    console.log(`[MadKudu Router] Found additional contact details`);
                  }
                } catch (error: unknown) {
                  console.error("Error getting contact details:", error);
                }
              }
            }
            
            // Now look up the account using the domain
            const accountData = await lookupAccount(domain);
            if (accountData && Array.isArray(accountData) && accountData.length > 0) {
              console.log(`[MadKudu Router] Found account data for ${domain}`);
              extractedInfo.companyContext = JSON.stringify(accountData[0], null, 2);
              extractedInfo.companyName = accountData[0].name || domain;
              
              // Get account details, research, and usage data as above
              if (accountData[0].id) {
                try {
                  console.log(`[MadKudu Router] Getting account details for ID: ${accountData[0].id}`);
                  const accountDetails = await getAccountDetails(accountData[0].id);
                  if (accountDetails) {
                    extractedInfo.accountDetails = JSON.stringify(accountDetails, null, 2);
                    console.log(`[MadKudu Router] Found additional account details`);
                  }
                } catch (error: unknown) {
                  console.error("Error getting account details:", error);
                }
              }
              
              // Get AI research
              try {
                console.log(`[MadKudu Router] Getting AI research for ${domain}`);
                // Get real AI research with retry logic
                const researchText = await getAIResearchWithRetry(domain);
                extractedInfo.researchContext = researchText;
                console.log(`[MadKudu Router] Successfully retrieved AI research for ${domain}`);
              } catch (error) {
                console.error("Error getting AI research:", error);
                // Fallback to simulated data if the API fails
                extractedInfo.researchContext = `
### Key Facts
- Industry leader in ${(accountData[0].industry as string) ?? "their industry"}
- Recent funding of $XX million (Series X)
- Expanding into new markets in EMEA and APAC
- Launched new product line in Q2
- Current challenges include integration with legacy systems

### Sales Angles
1. ROI acceleration
2. Lead-to-revenue time reduction
3. Sales and marketing alignment
4. Data-driven GTM motions
5. Customer journey optimization`;
                console.log(`[MadKudu Router] Using fallback research data for ${domain}`);
              }
              
              // Add simulated product usage and activation data
              extractedInfo.usageContext = `
### Product Fit Assessment
- Primary use case: Lead scoring and qualification
- Value drivers: Improved conversion rates, reduced sales cycle time
- Integration potential: High (${accountData[0].technologies ? "current tech stack includes " + (accountData[0].technologies as string[]).slice(0, 3).join(", ") : "compatible with standard B2B SaaS stack"})
- Expected ROI timeframe: 3-6 months after implementation

### Potential Users
- Marketing Operations team (primary users)
- SDR/BDR team (daily users)
- Sales leadership (insights consumers)
- Revenue Operations (administrators)

### Adoption Readiness
- Team readiness: ${accountData[0].customer_fit_score && (accountData[0].customer_fit_score as number) > 7 ? "High" : "Medium"}
- Technical readiness: ${accountData[0].technologies && Array.isArray(accountData[0].technologies) && (accountData[0].technologies as string[]).length > 5 ? "High" : "Medium"}
- Budget readiness: ${accountData[0].funding_type ? "High (recently secured funding)" : "To be determined"}
- Value alignment: ${accountData[0].likelihood_to_buy_score && (accountData[0].likelihood_to_buy_score as number) > 7 ? "Strong" : "Moderate"}
`;
            } else {
              console.log(`[MadKudu Router] No account data found for ${domain}`);
            }
          } catch (error: unknown) {
            console.error(`[MadKudu Router] Error processing email ${userInput}:`, error);
          }
        } else {
          console.log(`[MadKudu Router] Input not recognized as email or domain`);
          
          // If input is not an email or domain, treat it as a company name for demo purposes
          extractedInfo.companyName = userInput;
          extractedInfo.companyContext = JSON.stringify({
            "name": userInput,
            "domain": userInput.toLowerCase().replace(/[^a-z0-9]/g, '') + ".com",
            "industry": "Software & Technology",
            "size": "Mid-Market",
            "employees_count": 250,
            "revenue_range": "$50M - $100M",
            "location": "United States",
            "technologies": ["Salesforce", "HubSpot", "Marketo", "Slack", "Zoom"],
            "customer_fit_score": 8,
            "likelihood_to_buy_score": 7
          }, null, 2);
          
          // Provide simulated research and usage data
          extractedInfo.researchContext = `
### Company Strategy
- ${userInput} is positioning as a leader in the B2B SaaS market
- They've recently expanded their product line to target enterprise customers
- Their go-to-market strategy focuses on mid-market and enterprise customers
- They have a strong presence in North America with expansion plans in EMEA

### Current Challenges
1. Integration with existing tech stack
2. Lengthy sales cycles (averaging 90+ days)
3. High customer acquisition costs
4. Competitive pressure from new market entrants
5. Need for improved metrics and performance visibility

### Decision Making Process
- Buying decisions typically require manager and director-level approval
- Security reviews and compliance requirements are significant factors
- ROI justification is critical with current economic conditions
- Typical buying committee includes 5-7 stakeholders
`;
          
          extractedInfo.usageContext = `
### Product Fit Assessment
- Primary use case: Lead scoring and qualification
- Value drivers: Improved conversion rates, reduced sales cycle time
- Integration potential: High (compatible with standard B2B SaaS stack)
- Expected ROI timeframe: 3-6 months after implementation

### Potential Users
- Marketing Operations team (primary users)
- SDR/BDR team (daily users)
- Sales leadership (insights consumers)
- Revenue Operations (administrators)

### Adoption Readiness
- Team readiness: Medium
- Technical readiness: Medium
- Budget readiness: To be determined
- Value alignment: Moderate
`;
        }
      } else if (input.agentId === "agent3") {
        console.log(`[MadKudu Router] Processing for QBR (Agent 3)`);
        // For QBR, we also need domain/company info and usage data
        if (isDomain(userInput) || userInput.includes('.')) {
          const domain = userInput.toLowerCase();
          console.log(`[MadKudu Router] Detected domain: ${domain}`);
          const accountData = await lookupAccount(domain);
          if (accountData && accountData.length > 0) {
            console.log(`[MadKudu Router] Found account data for ${domain}`);
            extractedInfo.companyContext = JSON.stringify(accountData[0], null, 2);
            extractedInfo.companyName = accountData[0].name || domain;
            
            // Mock more detailed usage data for QBR
            extractedInfo.usageContext = `
Detailed usage data for ${domain}:

Monthly Active Users: 45 (↑12% MoM)
Feature Adoption:
- Lead Scoring: 92%
- Account Scoring: 78%
- Routing Rules: 65%
- API Integration: 34%

Last QBR Action Items:
- Improve API adoption ✓
- Train 3 new users ✓
- Set up custom model ⚠️ In progress

Customer health score: 82/100
NPS: 8 (from 6 in previous quarter)
            `;
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
            
            // Mock detailed usage data for QBR
            extractedInfo.usageContext = `
Detailed usage data for ${domain}:

Monthly Active Users: 45 (↑12% MoM)
Feature Adoption:
- Lead Scoring: 92%
- Account Scoring: 78%
- Routing Rules: 65%
- API Integration: 34%

Last QBR Action Items:
- Improve API adoption ✓
- Train 3 new users ✓
- Set up custom model ⚠️ In progress

Customer health score: 82/100
NPS: 8 (from 6 in previous quarter)
            `;
          } else {
            console.log(`[MadKudu Router] No account data found for ${domain}`);
          }
        } else {
          console.log(`[MadKudu Router] Input not recognized as email or domain`);
          // If not recognized, add some sample data for testing
          extractedInfo.companyName = "Sample Company";
          extractedInfo.companyContext = `{
  "name": "Sample Company",
  "domain": "samplecompany.com",
  "industry": "Software",
  "size": "Mid-Market",
  "revenue": "$25M-$50M",
  "employees": "100-250"
}`;
          extractedInfo.usageContext = `
Detailed usage data for Sample Company:

Monthly Active Users: 32 (↑8% MoM)
Feature Adoption:
- Lead Scoring: 85%
- Account Scoring: 70%
- Routing Rules: 45%
- API Integration: 25%

Last QBR Action Items:
- Onboard marketing team ✓
- Configure Salesforce sync ✓
- Implement custom workflows ⚠️ In progress

Customer health score: 75/100
NPS: 7 (from 5 in previous quarter)
          `;
        }
      } else {
        // Handle custom agents by trying company name approach
        console.log(`[MadKudu Router] Processing for custom agent ${input.agentId}`);
        
        // Extract domain, email or company name from the user input
        const extractionResult = extractEntityFromQuery(userInput);
        console.log(`[MadKudu Router] Extracted entity: ${extractionResult.type} = "${extractionResult.value}"`);
        
        if (extractionResult.type === 'domain') {
          // Handle domain
          const domain = extractionResult.value.toLowerCase();
          console.log(`[MadKudu Router] Processing domain: ${domain}`);
          try {
            const accountData = await lookupAccount(domain);
            logApiResponse(`Account lookup for ${domain}`, accountData);
            if (accountData && accountData.length > 0) {
              console.log(`[MadKudu Router] Found account data for ${domain}`);
              extractedInfo.companyContext = JSON.stringify(accountData[0], null, 2);
              extractedInfo.companyName = accountData[0].name || domain;
              
              // Try to fetch additional account details if there's an accountId
              if (accountData[0].id) {
                try {
                  console.log(`[MadKudu Router] Getting account details for ID: ${accountData[0].id}`);
                  const accountDetails = await getAccountDetails(accountData[0].id);
                  if (accountDetails) {
                    extractedInfo.accountDetails = JSON.stringify(accountDetails, null, 2);
                    console.log(`[MadKudu Router] Found additional account details`);
                    logApiResponse(`Account details for ${domain}`, accountDetails);
                  }
                } catch (error) {
                  console.error("Error getting account details:", error);
                }
              }
              
              // Get AI research
              try {
                console.log(`[MadKudu Router] Getting AI research for ${domain}`);
                const researchText = await getAIResearchWithRetry(domain);
                extractedInfo.researchContext = researchText;
                console.log(`[MadKudu Router] Successfully retrieved AI research for ${domain}`);
                logApiResponse(`AI Research for ${domain}`, { text: researchText.substring(0, 200) + "..." });
              } catch (error) {
                console.error("Error getting AI research:", error);
                // Fallback to simulated data if the API fails
                extractedInfo.researchContext = `
### Key Facts about ${domain}
- Industry leader in their space
- Offering innovative solutions
- Key challenges and opportunities
- Competitive positioning`;
                console.log(`[MadKudu Router] Using fallback research data for ${domain}`);
              }
            }
          } catch (error) {
            console.error(`[MadKudu Router] Error looking up account for ${domain}:`, error);
          }
        } else if (extractionResult.type === 'email') {
          // Handle email input
          const email = extractionResult.value;
          console.log(`[MadKudu Router] Processing email: ${email}`);
          try {
            const personData = await lookupPerson(email);
            logApiResponse(`Person lookup for ${email}`, personData);
            
            if (personData && personData.length > 0) {
              extractedInfo.contactContext = JSON.stringify(personData[0], null, 2);
              console.log(`[MadKudu Router] Found person data for ${email}`);
              
              // Extract domain and get account data
              const domain = getDomainFromEmail(email);
              if (domain) {
                await enrichCompanyName(domain);
              }
            }
          } catch (error) {
            console.error(`[MadKudu Router] Error processing email ${extractionResult.value}:`, error);
          }
        } else if (extractionResult.type === 'company') {
          // Process as company name
          console.log(`[MadKudu Router] Processing company name: ${extractionResult.value}`);
          await enrichCompanyName(extractionResult.value);
        } else {
          // Fallback for unknown types
          console.log(`[MadKudu Router] Unable to extract entity, using raw input as company name`);
          await enrichCompanyName(userInput);
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
          // For custom agents, use the account plan format if we have company data
          try {
            // Fetch the custom agent's system prompt from the database
            const customAgent = await prisma.agent.findUnique({
              where: { id: input.agentId },
            });
            
            if (customAgent && customAgent.systemPrompt) {
              console.log(`[MadKudu Router] Found custom agent with ID ${input.agentId}, using its system prompt`);
              
              // If we have enrichment data, append it to the custom system prompt
              if (Object.keys(extractedInfo).length > 0) {
                // Format the enrichment data as a string to append to the system prompt
                let enrichmentDataString = "\n\n## Company Context\n";
                
                if (extractedInfo.companyContext) {
                  enrichmentDataString += extractedInfo.companyContext + "\n\n";
                }
                
                if (extractedInfo.researchContext) {
                  enrichmentDataString += "## AI-Generated Research\n" + extractedInfo.researchContext + "\n\n";
                }
                
                if (extractedInfo.contactContext) {
                  enrichmentDataString += "## Contact Context\n" + extractedInfo.contactContext + "\n\n";
                }
                
                if (extractedInfo.usageContext) {
                  enrichmentDataString += "## Usage Context\n" + extractedInfo.usageContext + "\n\n";
                }
                
                // Combine the custom system prompt with the enrichment data
                enhancedPrompt = customAgent.systemPrompt + enrichmentDataString;
                console.log(`[MadKudu Router] Added enrichment data to custom agent system prompt`);
              } else {
                enhancedPrompt = customAgent.systemPrompt;
              }
            } else {
              console.log(`[MadKudu Router] Custom agent not found or no system prompt, using default account plan format`);
              // Fallback to account plan format if we have company data
              if (Object.keys(extractedInfo).length > 0) {
                console.log(`[MadKudu Router] Using account plan format for custom agent ${input.agentId}`);
                enhancedPrompt = getEnhancedPromptForAccountPlan(extractedInfo);
              } else {
                enhancedPrompt = `You are a helpful assistant with access to enriched data. 
                
When asked about companies or organizations, try to provide relevant, factual information.`;
              }
            }
          } catch (error: unknown) {
            console.error(`[MadKudu Router] Error fetching custom agent:`, error instanceof Error ? error.message : String(error));
            // Fallback to account plan format
            if (Object.keys(extractedInfo).length > 0) {
              console.log(`[MadKudu Router] Using account plan format for custom agent ${input.agentId}`);
              enhancedPrompt = getEnhancedPromptForAccountPlan(extractedInfo);
            } else {
              enhancedPrompt = `You are a helpful assistant with access to enriched data. 
              
When asked about companies or organizations, try to provide relevant, factual information.`;
            }
          }
      }

      // Add system instruction to the beginning of the messages
      const messagesWithSystem = [
        { role: "system", content: enhancedPrompt },
        ...input.messages,
      ];

      console.log(`[MadKudu Router] Calling OpenAI API with enhanced prompt`);
      
      // Log the system prompt with color highlighting
      logPrompt(enhancedPrompt);
      
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

  // Direct API testing procedures
  lookupPerson: publicProcedure
    .input(z.object({ email: z.string() }))
    .mutation(async ({ input }) => {
      console.log(`[MadKudu API Test] Looking up person with email: ${input.email}`);
      try {
        const result = await lookupPerson(input.email);
        return result;
      } catch (error) {
        console.error(`[MadKudu API Test] Error looking up person:`, error);
        throw error;
      }
    }),

  lookupAccount: publicProcedure
    .input(z.object({ domain: z.string() }))
    .mutation(async ({ input }) => {
      console.log(`[MadKudu API Test] Looking up account with domain: ${input.domain}`);
      try {
        const result = await lookupAccount(input.domain);
        return result;
      } catch (error) {
        console.error(`[MadKudu API Test] Error looking up account:`, error);
        throw error;
      }
    }),

  getTopUsers: publicProcedure
    .input(z.object({ domain: z.string() }))
    .mutation(async ({ input }) => {
      console.log(`[MadKudu API Test] Getting top users for domain: ${input.domain}`);
      try {
        // This is a placeholder - you would implement the actual top users API call
        // For now, we'll return a mock response
        return {
          domain: input.domain,
          topUsers: [
            {
              name: "Francis Brero",
              title: "CPO",
              email: "francis@madkudu.com",
              seniority: "executive",
              department: "Product"
            },
            {
              name: "Sam Levan",
              title: "CEO",
              email: "sam@madkudu.com",
              seniority: "executive",
              department: "Executive"
            },
            {
              name: "John Smith",
              title: "VP Marketing",
              email: "john@madkudu.com",
              seniority: "executive",
              department: "Marketing"
            }
          ]
        };
      } catch (error) {
        console.error(`[MadKudu API Test] Error getting top users:`, error);
        throw error;
      }
    }),

  getAccountDetails: publicProcedure
    .input(z.object({ accountId: z.string() }))
    .mutation(async ({ input }) => {
      console.log(`[MadKudu API Test] Getting account details for ID: ${input.accountId}`);
      try {
        const result = await getAccountDetails(input.accountId);
        return result;
      } catch (error) {
        console.error(`[MadKudu API Test] Error getting account details:`, error);
        throw error;
      }
    }),

  getContactDetails: publicProcedure
    .input(z.object({ contactId: z.string() }))
    .mutation(async ({ input }) => {
      console.log(`[MadKudu API Test] Getting contact details for ID: ${input.contactId}`);
      try {
        const result = await getContactDetails(input.contactId);
        return result;
      } catch (error) {
        console.error(`[MadKudu API Test] Error getting contact details:`, error);
        throw error;
      }
    }),

  getAIResearch: publicProcedure
    .input(z.object({ domain: z.string() }))
    .mutation(async ({ input }) => {
      console.log(`[MadKudu API Test] Getting AI research for domain: ${input.domain}`);
      try {
        const result = await getAIResearchWithRetry(input.domain);
        return result;
      } catch (error) {
        console.error(`[MadKudu API Test] Error getting AI research:`, error);
        throw error;
      }
    }),
}); 