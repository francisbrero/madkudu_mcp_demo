import axios, { AxiosError } from 'axios';
import { env } from '~/env';

const apiKey = env.MADKUDU_API_KEY;
const headers = { 'x-api-key': apiKey };

export const lookupPerson = async (email: string) => {
  try {
    const { data } = await axios.post('https://madapi.madkudu.com/lookup/persons', { email }, { headers });
    return data;
  } catch (error) {
    console.error('Error looking up person:', error);
    throw new Error(error instanceof AxiosError ? error.message : 'Unknown error');
  }
};

export const lookupAccount = async (domain: string) => {
  try {
    const { data } = await axios.post('https://madapi.madkudu.com/lookup/accounts', { domain }, { headers });
    return data;
  } catch (error) {
    console.error('Error looking up account:', error);
    throw new Error(error instanceof AxiosError ? error.message : 'Unknown error');
  }
};

export const getAccountDetails = async (accountId: string) => {
  try {
    const { data } = await axios.get(`https://madapi.madkudu.com/accounts/${accountId}`, { headers });
    return data;
  } catch (error) {
    console.error('Error getting account details:', error);
    throw new Error(error instanceof AxiosError ? error.message : 'Unknown error');
  }
};

export const getContactDetails = async (contactId: string) => {
  try {
    const { data } = await axios.get(`https://madapi.madkudu.com/contacts/${contactId}`, { headers });
    return data;
  } catch (error) {
    console.error('Error getting contact details:', error);
    throw new Error(error instanceof AxiosError ? error.message : 'Unknown error');
  }
};

export const getAIResearch = async (domain: string): Promise<ReadableStream | null> => {
  try {
    const response = await fetch(`https://madapi.madkudu.com/ai/account-research?domain=${domain}`, {
      headers: {
        'x-api-key': apiKey,
        'Accept': 'text/event-stream'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
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