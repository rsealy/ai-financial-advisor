import { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Accounts from './pages/Accounts';
import Transactions from './pages/Transactions';
import Advisor from './pages/Advisor';
import PlaidLink from './components/PlaidLink';

const API_BASE = '/api';

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
        return <Advisor connected={connected} />;
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
