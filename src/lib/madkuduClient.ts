import axios, { AxiosError } from 'axios';
import { env } from '~/env';

const apiKey = env.MADKUDU_API_KEY;
const headers = { 'x-api-key': apiKey };

export const lookupPerson = async (email: string) => {
  try {
    console.log(`[MadKudu API] Looking up person with email: ${email}`);
    const { data } = await axios.post('https://madapi.madkudu.com/lookup/persons', { email }, { headers });
    console.log(`[MadKudu API] Person lookup successful for ${email}`);
    
    // Log a snippet of the response data
    if (data && Array.isArray(data)) {
      console.log(`[MadKudu API] Person data ${email}: ${data.length} records found.`);
      if (data.length > 0) {
        const cleanData = { ...data[0] };
        console.log(`[MadKudu API] First person record: ${JSON.stringify(cleanData).substring(0, 200)}...`);
      }
    } else {
      console.log(`[MadKudu API] Unexpected person data format: ${JSON.stringify(data).substring(0, 100)}...`);
    }
    
    return data;
  } catch (error) {
    console.error('Error looking up person:', error);
    throw new Error(error instanceof AxiosError ? error.message : 'Unknown error');
  }
};

export const lookupAccount = async (domain: string) => {
  try {
    console.log(`[MadKudu API] Looking up account with domain: ${domain}`);
    const { data } = await axios.post('https://madapi.madkudu.com/lookup/accounts', { domain }, { headers });
    console.log(`[MadKudu API] Account lookup successful for ${domain}`);
    
    // Log a snippet of the response data
    if (data && Array.isArray(data)) {
      console.log(`[MadKudu API] Account data ${domain}: ${data.length} records found.`);
      if (data.length > 0) {
        const cleanData = { ...data[0] };
        console.log(`[MadKudu API] First account record: ${JSON.stringify(cleanData).substring(0, 200)}...`);
      }
    } else {
      console.log(`[MadKudu API] Unexpected account data format: ${JSON.stringify(data).substring(0, 100)}...`);
    }
    
    return data;
  } catch (error) {
    console.error(`[MadKudu API] Error looking up account for ${domain}:`, error);
    throw new Error(error instanceof AxiosError ? error.message : 'Unknown error');
  }
};

export const getAccountDetails = async (accountId: string) => {
  try {
    console.log(`[MadKudu API] Getting account details for ID: ${accountId}`);
    const { data } = await axios.get(`https://madapi.madkudu.com/accounts/${accountId}`, { headers });
    console.log(`[MadKudu API] Account details retrieved for ID: ${accountId}`);
    return data;
  } catch (error) {
    console.error('Error getting account details:', error);
    throw new Error(error instanceof AxiosError ? error.message : 'Unknown error');
  }
};

export const getContactDetails = async (contactId: string) => {
  try {
    console.log(`[MadKudu API] Getting contact details for ID: ${contactId}`);
    const { data } = await axios.get(`https://madapi.madkudu.com/contacts/${contactId}`, { headers });
    console.log(`[MadKudu API] Contact details retrieved for ID: ${contactId}`);
    return data;
  } catch (error) {
    console.error('Error getting contact details:', error);
    throw new Error(error instanceof AxiosError ? error.message : 'Unknown error');
  }
};

export const getAIResearch = async (domain: string): Promise<ReadableStream | null> => {
  try {
    console.log(`[MadKudu API] Getting AI research for domain: ${domain}`);
    const response = await fetch(`https://madapi.madkudu.com/ai/account-research?domain=${domain}`, {
      headers: {
        'x-api-key': apiKey,
        'Accept': 'text/event-stream'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    console.log(`[MadKudu API] AI research requested successfully for ${domain}`);
    return response.body;
  } catch (error) {
    console.error('Error getting AI research:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Unknown error getting AI research');
  }
};

// Helper to extract domain from an email
export const getDomainFromEmail = (email: string): string => {
  const parts = email.split('@');
  if (parts.length < 2) return '';
  return parts[1]!;
};

// Helper to check if string is an email
export const isEmail = (text: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(text);
};

// Helper to check if string is a domain
export const isDomain = (text: string): boolean => {
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
  return domainRegex.test(text);
};

// Helper to get AI research with retry logic
export const getAIResearchWithRetry = async (domain: string, maxRetries = 3): Promise<string> => {
  let attempts = 0;
  
  while (attempts < maxRetries) {
    try {
      console.log(`[MadKudu API] Getting AI research for domain: ${domain} (attempt ${attempts + 1}/${maxRetries})`);
      const response = await fetch(`https://madapi.madkudu.com/ai/account-research?domain=${domain}`, {
        headers: {
          'x-api-key': apiKey,
          'Accept': 'text/event-stream'
        }
      });
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      // Process the stream to collect all the research text
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No reader available for response body');
      }
      
      const decoder = new TextDecoder();
      let rawText = '';
      let researchText = '';
      let done = false;
      
      while (!done) {
        const { value, done: streamDone } = await reader.read();
        done = streamDone;
        
        if (value) {
          const chunk = decoder.decode(value, { stream: !done });
          rawText += chunk;
          
          // Log raw chunk for debugging
          console.log(`[MadKudu API] Raw SSE chunk: ${chunk.substring(0, 100)}...`);
          
          // SSE format is typically:
          // event: message
          // id: 1
          // data: {...JSON...}
          
          // First split by double newlines which separate events
          const events = chunk.split('\n\n');
          
          for (const eventData of events) {
            if (!eventData.trim()) continue;
            
            // Extract the data line
            const dataMatch = eventData.match(/^data: (.+)$/m);
            if (dataMatch && dataMatch[1]) {
              const dataContent = dataMatch[1].trim();
              console.log(`[MadKudu API] Found data content: ${dataContent.substring(0, 50)}...`);
              
              try {
                // Parse the JSON payload
                const jsonData = JSON.parse(dataContent);
                
                // The research content is in the 'content' field
                if (jsonData.content) {
                  console.log(`[MadKudu API] Found content field, length: ${jsonData.content.length}`);
                  researchText += jsonData.content;
                } else if (jsonData.message) {
                  console.log(`[MadKudu API] Found message (no content): ${jsonData.message}`);
                }
              } catch (error) {
                console.error(`[MadKudu API] Error parsing JSON:`, error);
                // If JSON parsing fails, just use the raw data
                researchText += dataContent;
              }
            }
          }
        }
      }
      
      console.log(`[MadKudu API] Raw text from all chunks, length: ${rawText.length}`);
      
      // If we got nothing after parsing, return a message
      if (!researchText.trim()) {
        console.log(`[MadKudu API] No research content extracted from response`);
        
        // Try a fallback parsing approach - look for content in the raw text
        const contentMatch = rawText.match(/"content":"([^"]+)"/);
        if (contentMatch && contentMatch[1]) {
          researchText = contentMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
          console.log(`[MadKudu API] Extracted content using fallback method, length: ${researchText.length}`);
        } else {
          console.log(`[MadKudu API] No research data found in response for ${domain}`);
          return "No research data found";
        }
      }
      
      console.log(`[MadKudu API] Successfully retrieved AI research for ${domain}`);
      console.log(`[MadKudu API] Research text (first 100 chars): ${researchText.substring(0, 100)}...`);
      return researchText;
    } catch (error) {
      attempts++;
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[MadKudu API] Error getting AI research (attempt ${attempts}/${maxRetries}): ${errorMessage}`);
      
      if (attempts >= maxRetries) {
        console.error(`[MadKudu API] Max retries (${maxRetries}) reached, giving up.`);
        throw new Error(`Failed to get AI research after ${maxRetries} attempts: ${errorMessage}`);
      }
      
      // Wait before retrying (increasing delay with each attempt)
      const delay = 1000 * attempts; // 1s, 2s, 3s...
      console.log(`[MadKudu API] Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error(`Failed to get AI research after ${maxRetries} attempts`);
}; 