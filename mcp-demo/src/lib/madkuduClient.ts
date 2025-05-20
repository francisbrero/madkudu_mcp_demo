import axios, { AxiosError } from 'axios';
import { env } from '~/env';

const apiKey = env.MADKUDU_API_KEY;
const headers = { 'x-api-key': apiKey };

export const lookupPerson = async (email: string) => {
  try {
    console.log(`[MadKudu API] Looking up person with email: ${email}`);
    const { data } = await axios.post('https://madapi.madkudu.com/lookup/persons', { email }, { headers });
    console.log(`[MadKudu API] Person lookup successful for ${email}`);
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
    return data;
  } catch (error) {
    console.error('Error looking up account:', error);
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
  return email.split('@')[1];
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