import { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Accounts from './pages/Accounts';
import Transactions from './pages/Transactions';
import Advisor from './pages/Advisor';

const API_BASE = '/api';

const DEFAULT_MESSAGE_CONNECTED = "Hello! I'm your AI financial advisor. I have access to your connected accounts and transaction history, so I can give you personalized advice. What would you like to know about your finances?";
const DEFAULT_MESSAGE_DISCONNECTED = "Hello! I'm your AI financial advisor. Connect your bank accounts using the sidebar to get personalized financial advice based on your real data. In the meantime, I can answer general financial questions!";

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [financialData, setFinancialData] = useState({
    accounts: [],
    transactions: [],
    institutionNames: [],
  });
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);

  // Chat state lifted here so it persists across tab switches
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', content: DEFAULT_MESSAGE_DISCONNECTED },
  ]);
  const [selectedModel, setSelectedModel] = useState('gpt-5.2');

  const resetChat = useCallback(() => {
    setChatMessages([
      {
        role: 'assistant',
        content: connected ? DEFAULT_MESSAGE_CONNECTED : DEFAULT_MESSAGE_DISCONNECTED,
      },
    ]);
  }, [connected]);

  const fetchFinancialData = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/financial-data`);
      const data = await res.json();
      setFinancialData(data);
      if (data.accounts.length > 0) {
        setConnected(true);
      }
    } catch (err) {
      console.error('Failed to fetch financial data:', err);
    }
  }, []);

  const fetchInsights = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/advisor/insights`);
      const data = await res.json();
      setInsights(data.insights || []);
    } catch (err) {
      console.error('Failed to fetch insights:', err);
    }
  }, []);

  useEffect(() => {
    fetchFinancialData();
  }, [fetchFinancialData]);

  useEffect(() => {
    if (connected) {
      fetchInsights();
    }
  }, [connected, fetchInsights]);

  const handlePlaidSuccess = async (publicToken) => {
    setLoading(true);
    try {
      await fetch(`${API_BASE}/plaid/exchange-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ public_token: publicToken }),
      });
      await fetchFinancialData();
      setConnected(true);
      await fetchInsights();
    } catch (err) {
      console.error('Failed to exchange token:', err);
    }
    setLoading(false);
  };

  const refreshData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/refresh-data`, { method: 'POST' });
      const data = await res.json();
      setFinancialData(data);
    } catch (err) {
      console.error('Failed to refresh:', err);
    }
    setLoading(false);
  };

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return (
          <Dashboard
            financialData={financialData}
            insights={insights}
            connected={connected}
            onConnect={handlePlaidSuccess}
            loading={loading}
          />
        );
      case 'accounts':
        return (
          <Accounts
            accounts={financialData.accounts}
            connected={connected}
            onConnect={handlePlaidSuccess}
          />
        );
      case 'transactions':
        return (
          <Transactions
            transactions={financialData.transactions}
            connected={connected}
          />
        );
      case 'advisor':
        return (
          <Advisor
            connected={connected}
            messages={chatMessages}
            setMessages={setChatMessages}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            onReset={resetChat}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        connected={connected}
        onConnect={handlePlaidSuccess}
        onRefresh={refreshData}
        loading={loading}
      />
      <main className="main-content">
        {renderPage()}
      </main>
    </div>
  );
}
