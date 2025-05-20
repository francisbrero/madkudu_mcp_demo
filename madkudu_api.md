# 🔐 MadKudu API Integration Guide

This guide outlines the authentication, endpoints, and example usage for integrating with the MadKudu API.

---

## 🔑 Authentication

### 📌 Basic API Key (Recommended for Now)

All endpoints support API key–based authentication via `x-api-key` header:

```http
GET /ping HTTP/1.1
Host: madapi.madkudu.com
x-api-key: YOUR_API_KEY
```

Alternatively, encode `your_api_key:` in Base64 and pass it as:

```http
Authorization: Basic <base64_of_api_key_colon>
```

Example:

```bash
echo -n 'your_api_key:' | base64
# Result: eW91cl9hcGlfa2V5Og==
```

Header:
```http
Authorization: Basic eW91cl9hcGlfa2V5Og==
```

---

## 🔁 Optional JWT Auth (Advanced)

- **Login**: `POST /auth/login` with email & password → returns short-lived `access_token` and long-lived `refresh_token`.
- **Refresh**: `POST /auth/refresh` with refresh token.

We’ll skip this for now unless needed.

---

## 🔍 Lookup Endpoints

These endpoints allow you to enrich a person or company from many types of identifiers.

### 🔎 Lookup Person

```http
POST /lookup/persons
```

**Body Example**:

```json
{
  "email": "francis@madkudu.com"
}
```

**Response Example**:

```json
[
  {
    "name": "Francis Brero",
    "title": "CPO",
    "company_name": "MadKudu",
    "company_domain": "madkudu.com",
    "seniority": "executive",
    "linkedin_handle": "linkedin.com/in/francisbrero"
  }
]
```

---

### 🔎 Lookup Account

```http
POST /lookup/accounts
```

**Body Example**:

```json
{
  "domain": "madkudu.com"
}
```

**Response Example**:

```json
[
  {
    "name": "MadKudu",
    "domain": "madkudu.com",
    "employees_count": 40,
    "industry": "Software",
    "customer_fit_score": 9,
    "likelihood_to_buy_score": 8
  }
]
```

---

## 🧠 AI-Generated Account Research

```http
GET /ai/account-research?domain=madkudu.com
Accept: text/event-stream
x-api-key: YOUR_API_KEY
```

**Returns** a streamed response (SSE) of AI-generated company research including sales angles and context.

---

## 📊 Account, Lead, and Contact Details

### 🧾 Get Account Details

```http
GET /accounts/{account_id}
```

Returns company-level enrichment based on Salesforce ID.

---

### 🧾 Get Lead Details

```http
GET /leads/{lead_id}
```

Returns lead-level fit score, buying intent, and associated account ID.

---

### 🧾 Get Contact Details

```http
GET /contacts/{contact_id}
```

Returns enriched contact info like:

```json
{
  "Email": "francis@madkudu.com",
  "Name": "Francis Brero",
  "Role": "CPO",
  "Photo": "https://...jpg",
  "Linkedin": "https://linkedin.com/in/francisbrero"
}
```

---

## ✅ Setup Recommendations

### 📁 .env.local

```env
MADKUDU_API_KEY=your-secret-api-key
```

### 📦 Utility Wrapper Example

```ts
import axios from 'axios';

const apiKey = process.env.MADKUDU_API_KEY!;
const headers = { 'x-api-key': apiKey };

export const lookupPerson = async (email: string) => {
  const { data } = await axios.post('https://madapi.madkudu.com/lookup/persons', { email }, { headers });
  return data;
};

export const lookupAccount = async (domain: string) => {
  const { data } = await axios.post('https://madapi.madkudu.com/lookup/accounts', { domain }, { headers });
  return data;
};

export const getAccountResearch = async (domain: string) => {
  const response = await fetch(`https://madapi.madkudu.com/ai/account-research?domain=${domain}`, {
    headers: {
      'x-api-key': apiKey,
      'Accept': 'text/event-stream'
    }
  });
  return response.body;
};
```

---

## 📘 Documentation Links

- Full API Reference: https://madkudu.gitbook.io/api/