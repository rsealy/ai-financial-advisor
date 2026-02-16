# WealthPilot — AI Financial Advisor

An all-in-one financial management application powered by AI. Connect your bank accounts via Plaid, view all your finances in one place, and get personalized advice from an AI advisor that understands your complete financial picture.

## Features

- **Plaid Integration** — Securely connect bank accounts, credit cards, and investments
- **Financial Dashboard** — Net worth, spending charts, and account overview
- **Transaction History** — Search, filter, and sort all transactions
- **AI Advisor** — Personalized financial advice powered by GPT-5 with full context of your finances
- **Proactive Insights** — AI-generated alerts and tips based on your spending patterns

## Setup

### 1. Install dependencies

```bash
npm run install:all
```

### 2. Configure environment variables

Edit the `.env` file in the project root:

```env
OPENAI_API_KEY=your_openai_api_key
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_secret
PLAID_ENV=sandbox
PORT=5001
```

Get your Plaid credentials at [dashboard.plaid.com](https://dashboard.plaid.com).

### 3. Run the app

```bash
npm run dev
```

This starts both the backend (port 5001) and frontend (port 5173).

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Tech Stack

- **Frontend**: React, Vite, Recharts, Lucide Icons
- **Backend**: Node.js, Express
- **APIs**: Plaid (financial data), OpenAI GPT-5 (AI advisor)
