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

export const getAccountDetails = async (params: { domain: string }) => {
  try {
    console.log(`[MadKudu API] Getting account details for: ${params.domain}`);
    
    // Step 1: Lookup account to get their ID
    console.log(`[MadKudu API] First looking up account to get ID...`);
    const accountData = await lookupAccount(params.domain);
    console.log(`[MadKudu API] Account lookup result:`, JSON.stringify(accountData, null, 2));
    
    if (!accountData || !Array.isArray(accountData) || accountData.length === 0 || !accountData[0]?.mk_id) {
      return {
        error: 'Account not found',
        message: `No account found with domain ${params.domain}. Account lookup returned: ${JSON.stringify(accountData)}`,
        suggestion: 'Try with a different domain or ensure the account is in the MadKudu database'
      };
    }
    
    const accountId = accountData[0].mk_id;
    console.log(`[MadKudu API] Found account ID: ${accountId}`);
    
    // Step 2: Try different possible endpoints for account details
    const possibleEndpoints = [
      { url: `https://madapi.madkudu.com/accounts/${accountId}`, params: {} },
      { url: `https://madapi.madkudu.com/companies/${accountId}`, params: {} },
      { url: `https://madapi.madkudu.com/v1/accounts`, params: { mk_id: accountId } },
      { url: `https://madapi.madkudu.com/accounts`, params: { id: accountId } }
    ];
    
    for (const endpoint of possibleEndpoints) {
      try {
        console.log(`[MadKudu API] Trying endpoint: ${endpoint.url} with params:`, endpoint.params);
        const { data } = await axios.get(endpoint.url, { 
          headers, 
          params: endpoint.params
        });
        console.log(`[MadKudu API] Success! Account details retrieved from: ${endpoint.url}`);
        return data;
      } catch (endpointError) {
        console.log(`[MadKudu API] Failed endpoint ${endpoint.url}:`, endpointError instanceof AxiosError ? endpointError.response?.status : endpointError);
      }
    }
    
    // If all endpoints failed, return the account data we already have as enriched account details
    console.log(`[MadKudu API] All endpoints failed, returning enriched account data`);
    return {
      account: accountData[0],
      enriched: true,
      message: 'Account details enriched from account lookup data'
    };
    
  } catch (error) {
    console.error('Error getting account details:', error);
    
    return {
      error: 'Error during account details lookup',
      message: error instanceof AxiosError ? `${error.response?.status}: ${error.message}` : String(error),
      suggestion: 'Check the console for detailed error information'
    };
  }
};

export const getPersonDetails = async (params: { email: string }) => {
  try {
    console.log(`[MadKudu API] Getting person details for: ${params.email}`);
    
    // Step 1: Lookup person to get their ID
    console.log(`[MadKudu API] First looking up person to get ID...`);
    const personData = await lookupPerson(params.email);
    console.log(`[MadKudu API] Person lookup result:`, JSON.stringify(personData, null, 2));
    
    if (!personData || !Array.isArray(personData) || personData.length === 0 || !personData[0]?.mk_id) {
      return {
        error: 'Person not found',
        message: `No person found with email ${params.email}. Person lookup returned: ${JSON.stringify(personData)}`,
        suggestion: 'Try with a different email address or ensure the person is in the MadKudu database'
      };
    }
    
    const personId = personData[0].mk_id;
    console.log(`[MadKudu API] Found person ID: ${personId}`);
    
    // Step 2: Try different possible endpoints for person details
    const possibleEndpoints = [
      { url: `https://madapi.madkudu.com/persons/${personId}`, params: {} },
      { url: `https://madapi.madkudu.com/contacts/${personId}`, params: {} },
      { url: `https://madapi.madkudu.com/v1/persons`, params: { mk_id: personId } },
      { url: `https://madapi.madkudu.com/persons`, params: { id: personId } }
    ];
    
    for (const endpoint of possibleEndpoints) {
      try {
        console.log(`[MadKudu API] Trying endpoint: ${endpoint.url} with params:`, endpoint.params);
        const { data } = await axios.get(endpoint.url, { 
          headers, 
          params: endpoint.params
        });
        console.log(`[MadKudu API] Success! Person details retrieved from: ${endpoint.url}`);
        return data;
      } catch (endpointError) {
        console.log(`[MadKudu API] Failed endpoint ${endpoint.url}:`, endpointError instanceof AxiosError ? endpointError.response?.status : endpointError);
      }
    }
    
    // If all endpoints failed, return the person data we already have as enriched person details
    console.log(`[MadKudu API] All endpoints failed, returning enriched person data`);
    return {
      person: personData[0],
      enriched: true,
      message: 'Person details enriched from person lookup data'
    };
    
  } catch (error) {
    console.error('Error getting person details:', error);
    
    return {
      error: 'Error during person details lookup',
      message: error instanceof AxiosError ? `${error.response?.status}: ${error.message}` : String(error),
      suggestion: 'Check the console for detailed error information'
    };
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

export const discoverPersons = async (params: { 
  company_domain?: string, 
  provider: 'apollo' | 'zoominfo' | 'cognism',
  title?: string,
  seniority?: string,
  country?: string
}) => {
  try {
    console.log(`[MadKudu API] Discovering persons with params: ${JSON.stringify(params)}`);
    
    // Build the request body according to the API spec
    const requestBody: any = {
      provider: params.provider,
      filters: {}
    };
    
    // Add filters only if they have values
    if (params.company_domain) requestBody.filters.company_domain = params.company_domain;
    if (params.title) requestBody.filters.title = params.title;
    if (params.seniority) requestBody.filters.seniority = params.seniority;
    if (params.country) requestBody.filters.location = { country: params.country };
    
    // Add default pagination - limit to 3 results for discovery
    requestBody.pagination = { page: 1, size: 3 };
    
    console.log(`[MadKudu API] Request body: ${JSON.stringify(requestBody)}`);
    
    // Use POST method with correct endpoint
    const { data } = await axios.post('https://madapi.madkudu.com/sourcing/persons/discover', requestBody, { headers });
    console.log(`[MadKudu API] Person discovery successful.`);
    return data;
  } catch (error) {
    console.error('Error discovering persons:', error);
    
    // If the endpoint doesn't exist, return a helpful message instead of throwing
    if (error instanceof AxiosError && error.response?.status === 404) {
      return {
        error: 'Person discovery endpoint not available',
        message: 'This feature may require additional API permissions',
        suggestion: 'Please contact MadKudu support to enable sourcing features'
      };
    }
    
    throw new Error(error instanceof AxiosError ? error.message : 'Unknown error');
  }
};

export const getPersonActivities = async (params: { email: string }) => {
  try {
    console.log(`[MadKudu API] Getting person activities for: ${params.email}`);
    
    // Step 1: Lookup person to get their ID
    console.log(`[MadKudu API] First looking up person to get ID...`);
    const personData = await lookupPerson(params.email);
    console.log(`[MadKudu API] Person lookup result:`, JSON.stringify(personData, null, 2));
    
    if (!personData || !Array.isArray(personData) || personData.length === 0 || !personData[0]?.mk_id) {
      return {
        error: 'Person not found',
        message: `No person found with email ${params.email}. Person lookup returned: ${JSON.stringify(personData)}`,
        suggestion: 'Try with a different email address or ensure the person is in the MadKudu database'
      };
    }
    
    const personId = personData[0].mk_id;
    console.log(`[MadKudu API] Found person ID: ${personId}`);
    
    // Step 2: Try different possible endpoint structures
    const possibleEndpoints = [
      { url: `https://madapi.madkudu.com/activities/persons/${personId}`, params: {} },
      { url: `https://madapi.madkudu.com/activities/persons`, params: { person_id: personId } },
      { url: `https://madapi.madkudu.com/activities/persons`, params: { id: personId } },
      { url: `https://madapi.madkudu.com/persons/${personId}/activities`, params: {} }
    ];
    
    for (const endpoint of possibleEndpoints) {
      try {
        console.log(`[MadKudu API] Trying endpoint: ${endpoint.url} with params:`, endpoint.params);
        const { data } = await axios.get(endpoint.url, { 
          headers, 
          params: { ...endpoint.params, limit: 20 }
        });
        console.log(`[MadKudu API] Success! Person activities retrieved from: ${endpoint.url}`);
        return data;
      } catch (endpointError) {
        console.log(`[MadKudu API] Failed endpoint ${endpoint.url}:`, endpointError instanceof AxiosError ? endpointError.response?.status : endpointError);
      }
    }
    
    // If all endpoints failed
    return {
      error: 'Person activities endpoint not available',
      message: `Person found (ID: ${personId}) but no activities endpoint worked`,
      suggestion: 'The activities API may not be available or may require different authentication'
    };
    
  } catch (error) {
    console.error('Error getting person activities:', error);
    
    return {
      error: 'Error during person activities lookup',
      message: error instanceof AxiosError ? `${error.response?.status}: ${error.message}` : String(error),
      suggestion: 'Check the console for detailed error information'
    };
  }
};

export const getAccountActivities = async (params: { domain: string }) => {
  try {
    console.log(`[MadKudu API] Getting account activities for: ${params.domain}`);
    const { data } = await axios.get('https://madapi.madkudu.com/activities/accounts', { headers, params });
    console.log(`[MadKudu API] Account activities retrieved for: ${params.domain}`);
    return data;
  } catch (error) {
    console.error('Error getting account activities:', error);
    throw new Error(error instanceof AxiosError ? error.message : 'Unknown error');
  }
};

export const getAccountTopUsers = async (params: { domain: string }) => {
  try {
    console.log(`[MadKudu API] Getting account top users for: ${params.domain}`);
    const { data } = await axios.get('https://madapi.madkudu.com/accounts/top-users', { headers, params });
    console.log(`[MadKudu API] Account top users retrieved for: ${params.domain}`);
    return data;
  } catch (error) {
    console.error('Error getting account top users:', error);
    throw new Error(error instanceof AxiosError ? error.message : 'Unknown error');
  }
}; 