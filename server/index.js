import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'plaid';
import OpenAI from 'openai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// ── Plaid Setup ──────────────────────────────────────────────────────────────
const plaidConfig = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});
const plaidClient = new PlaidApi(plaidConfig);

// ── OpenAI Setup ─────────────────────────────────────────────────────────────
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// In-memory store (per session — production would use a database)
let accessTokens = [];
let financialData = {
  accounts: [],
  transactions: [],
  balances: [],
  institutionNames: [],
};

// ── Plaid Routes ─────────────────────────────────────────────────────────────

// Create a Link token for the frontend
app.post('/api/plaid/create-link-token', async (req, res) => {
  try {
    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: 'user-1' },
      client_name: 'AI Financial Advisor',
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: 'en',
    });
    res.json({ link_token: response.data.link_token });
  } catch (error) {
    console.error('Error creating link token:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to create link token' });
  }
});

// Exchange public token for access token
app.post('/api/plaid/exchange-token', async (req, res) => {
  try {
    const { public_token } = req.body;
    const response = await plaidClient.itemPublicTokenExchange({ public_token });
    const accessToken = response.data.access_token;
    accessTokens.push(accessToken);

    // Immediately fetch data for this new connection
    await fetchAllFinancialData();

    res.json({ success: true });
  } catch (error) {
    console.error('Error exchanging token:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to exchange token' });
  }
});

// Fetch all financial data from connected accounts
async function fetchAllFinancialData() {
  const allAccounts = [];
  const allTransactions = [];
  const institutionNames = [];

  for (const token of accessTokens) {
    try {
      // Get accounts
      const accountsRes = await plaidClient.accountsGet({ access_token: token });
      allAccounts.push(...accountsRes.data.accounts);

      // Get institution name
      const itemRes = await plaidClient.itemGet({ access_token: token });
      const institutionId = itemRes.data.item.institution_id;
      if (institutionId) {
        try {
          const instRes = await plaidClient.institutionsGetById({
            institution_id: institutionId,
            country_codes: [CountryCode.Us],
          });
          institutionNames.push(instRes.data.institution.name);
        } catch {
          institutionNames.push('Unknown Institution');
        }
      }

      // Get transactions (last 90 days)
      const now = new Date();
      const startDate = new Date(now.setDate(now.getDate() - 90)).toISOString().split('T')[0];
      const endDate = new Date().toISOString().split('T')[0];

      const txnRes = await plaidClient.transactionsGet({
        access_token: token,
        start_date: startDate,
        end_date: endDate,
        options: { count: 500, offset: 0 },
      });
      allTransactions.push(...txnRes.data.transactions);
    } catch (error) {
      console.error('Error fetching data for token:', error.response?.data || error.message);
    }
  }

  financialData = {
    accounts: allAccounts,
    transactions: allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date)),
    institutionNames,
  };
}

// Get financial data
app.get('/api/financial-data', (req, res) => {
  res.json(financialData);
});

// Refresh data
app.post('/api/refresh-data', async (req, res) => {
  try {
    await fetchAllFinancialData();
    res.json(financialData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to refresh data' });
  }
});

// ── AI Advisor Routes ────────────────────────────────────────────────────────

function buildFinancialContext() {
  const { accounts, transactions } = financialData;

  if (accounts.length === 0) {
    return 'The user has not connected any financial accounts yet.';
  }

  // Summarize accounts
  const accountSummary = accounts.map(a => 
    `- ${a.name} (${a.type}/${a.subtype}): Balance $${a.balances.current?.toLocaleString() ?? 'N/A'}${a.balances.limit ? `, Limit: $${a.balances.limit.toLocaleString()}` : ''}`
  ).join('\n');

  // Calculate totals
  const totalAssets = accounts
    .filter(a => ['depository', 'investment'].includes(a.type))
    .reduce((sum, a) => sum + (a.balances.current || 0), 0);
  
  const totalLiabilities = accounts
    .filter(a => ['credit', 'loan'].includes(a.type))
    .reduce((sum, a) => sum + (a.balances.current || 0), 0);

  // Spending by category (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentTxns = transactions.filter(t => new Date(t.date) >= thirtyDaysAgo);
  const spending = {};
  recentTxns.forEach(t => {
    if (t.amount > 0) {
      const cat = t.personal_finance_category?.primary || t.category?.[0] || 'Other';
      spending[cat] = (spending[cat] || 0) + t.amount;
    }
  });

  const spendingSummary = Object.entries(spending)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([cat, amount]) => `- ${cat}: $${amount.toFixed(2)}`)
    .join('\n');

  // Recent transactions
  const recentTxnList = transactions.slice(0, 15).map(t =>
    `- ${t.date}: ${t.name} — $${t.amount.toFixed(2)} (${t.personal_finance_category?.primary || t.category?.[0] || 'Other'})`
  ).join('\n');

  return `
FINANCIAL OVERVIEW:
Total Assets: $${totalAssets.toLocaleString()}
Total Liabilities: $${totalLiabilities.toLocaleString()}
Net Worth: $${(totalAssets - totalLiabilities).toLocaleString()}

ACCOUNTS:
${accountSummary}

SPENDING BY CATEGORY (Last 30 Days):
${spendingSummary || 'No spending data available'}

RECENT TRANSACTIONS:
${recentTxnList || 'No recent transactions'}
`.trim();
}

app.post('/api/advisor/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    const financialContext = buildFinancialContext();

    const systemMessage = {
      role: 'system',
      content: `You are an expert AI financial advisor. You have access to the user's real financial data and should provide personalized, actionable advice based on their specific situation.

Here is the user's current financial data:

${financialContext}

Guidelines:
- Be specific and reference their actual account balances, spending patterns, and transactions
- Provide actionable recommendations tailored to their situation
- Flag any concerning spending patterns or opportunities for savings
- Be encouraging but honest about financial health
- Use dollar amounts and percentages when giving advice
- If they haven't connected accounts yet, encourage them to do so for personalized advice
- Format your responses clearly with headers and bullet points when appropriate
- Keep responses concise but thorough`
    };

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [systemMessage, ...messages],
      temperature: 0.7,
      max_tokens: 1000,
    });

    res.json({ message: response.choices[0].message });
  } catch (error) {
    console.error('AI Error:', error.message);
    res.status(500).json({ error: 'Failed to get AI response' });
  }
});

// Proactive insights endpoint
app.get('/api/advisor/insights', async (req, res) => {
  try {
    const financialContext = buildFinancialContext();

    if (financialData.accounts.length === 0) {
      return res.json({ insights: [] });
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert financial advisor. Analyze the following financial data and provide exactly 4 brief, actionable insights. Each insight should be a JSON object with "title" (short heading), "description" (1-2 sentences), and "type" (one of: "warning", "tip", "positive", "action").

Return ONLY a valid JSON array, no markdown or other text.

Financial Data:
${financialContext}`
        },
        {
          role: 'user',
          content: 'Provide 4 proactive financial insights based on my data.'
        }
      ],
      model: 'gpt-4o',
      temperature: 0.7,
      max_tokens: 800,
    });

    let insights;
    try {
      const content = response.choices[0].message.content.replace(/```json\n?|\n?```/g, '').trim();
      insights = JSON.parse(content);
    } catch {
      insights = [
        { title: 'Connect Your Accounts', description: 'Link your bank accounts to get personalized financial insights.', type: 'action' }
      ];
    }

    res.json({ insights });
  } catch (error) {
    console.error('Insights error:', error.message);
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

// ── Serve React Frontend in Production ───────────────────────────────────────
const clientBuild = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientBuild));
app.get('*', (req, res) => {
  res.sendFile(path.join(clientBuild, 'index.html'));
});

// ── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
