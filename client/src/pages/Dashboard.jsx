import { useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  AlertTriangle,
  Lightbulb,
  CheckCircle,
  ArrowRight,
  Building2,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area,
} from 'recharts';
import PlaidLink from '../components/PlaidLink';

const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#f97316'];

const insightIcons = {
  warning: AlertTriangle,
  tip: Lightbulb,
  positive: CheckCircle,
  action: ArrowRight,
};

export default function Dashboard({ financialData, insights, connected, onConnect, loading }) {
  const { accounts, transactions } = financialData;

  const stats = useMemo(() => {
    const totalAssets = accounts
      .filter(a => ['depository', 'investment'].includes(a.type))
      .reduce((s, a) => s + (a.balances.current || 0), 0);

    const totalLiabilities = accounts
      .filter(a => ['credit', 'loan'].includes(a.type))
      .reduce((s, a) => s + (a.balances.current || 0), 0);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentTxns = transactions.filter(t => new Date(t.date) >= thirtyDaysAgo);
    const totalSpending = recentTxns
      .filter(t => t.amount > 0)
      .reduce((s, t) => s + t.amount, 0);

    const totalIncome = recentTxns
      .filter(t => t.amount < 0)
      .reduce((s, t) => s + Math.abs(t.amount), 0);

    return {
      totalAssets,
      totalLiabilities,
      netWorth: totalAssets - totalLiabilities,
      totalSpending,
      totalIncome,
    };
  }, [accounts, transactions]);

  const spendingByCategory = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recent = transactions.filter(t => new Date(t.date) >= thirtyDaysAgo && t.amount > 0);
    const cats = {};
    recent.forEach(t => {
      const cat = t.personal_finance_category?.primary || t.category?.[0] || 'Other';
      cats[cat] = (cats[cat] || 0) + t.amount;
    });
    return Object.entries(cats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({ name: formatCategory(name), value: Math.round(value) }));
  }, [transactions]);

  const dailySpending = useMemo(() => {
    const days = {};
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    transactions
      .filter(t => new Date(t.date) >= thirtyDaysAgo && t.amount > 0)
      .forEach(t => {
        days[t.date] = (days[t.date] || 0) + t.amount;
      });

    return Object.entries(days)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, amount]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        amount: Math.round(amount),
      }));
  }, [transactions]);

  if (!connected) {
    return (
      <div>
        <div className="page-header">
          <h2>Welcome to WealthPilot</h2>
          <p>Connect your financial accounts to get started</p>
        </div>
        <div className="connect-card">
          <div className="connect-icon">
            <Building2 size={36} />
          </div>
          <h3>Connect Your Bank Accounts</h3>
          <p>
            Securely link your bank accounts, credit cards, and investment accounts
            to get a complete picture of your finances and personalized AI-powered advice.
          </p>
          <PlaidLink onSuccess={onConnect}>
            <button className="btn btn-primary">
              <Building2 size={18} />
              Connect with Plaid
            </button>
          </PlaidLink>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h2>Financial Dashboard</h2>
        <p>Your complete financial overview at a glance</p>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-icon"><DollarSign size={22} /></div>
          <div className="stat-label">Net Worth</div>
          <div className="stat-value">{formatCurrency(stats.netWorth)}</div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon"><TrendingUp size={22} /></div>
          <div className="stat-label">Total Assets</div>
          <div className="stat-value">{formatCurrency(stats.totalAssets)}</div>
        </div>
        <div className="stat-card red">
          <div className="stat-icon"><CreditCard size={22} /></div>
          <div className="stat-label">Total Liabilities</div>
          <div className="stat-value">{formatCurrency(stats.totalLiabilities)}</div>
        </div>
        <div className="stat-card purple">
          <div className="stat-icon"><TrendingDown size={22} /></div>
          <div className="stat-label">Monthly Spending</div>
          <div className="stat-value">{formatCurrency(stats.totalSpending)}</div>
        </div>
      </div>

      {/* AI Insights */}
      {insights.length > 0 && (
        <>
          <div className="card-header" style={{ marginBottom: 16 }}>
            <h3>AI Insights</h3>
            <span className="badge" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
              AI-Powered
            </span>
          </div>
          <div className="insights-grid">
            {insights.map((insight, i) => {
              const Icon = insightIcons[insight.type] || Lightbulb;
              return (
                <div key={i} className={`insight-card ${insight.type}`}>
                  <div className="insight-icon">
                    <Icon size={20} />
                  </div>
                  <div>
                    <div className="insight-title">{insight.title}</div>
                    <div className="insight-desc">{insight.description}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Charts */}
      <div className="charts-grid">
        {spendingByCategory.length > 0 && (
          <div className="card">
            <div className="card-header">
              <h3>Spending by Category</h3>
              <span className="text-sm text-muted">Last 30 days</span>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={spendingByCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {spendingByCategory.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                  }}
                  formatter={(val) => [`$${val.toLocaleString()}`, 'Amount']}
                />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
              {spendingByCategory.map((cat, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: CHART_COLORS[i % CHART_COLORS.length] }} />
                  <span style={{ color: 'var(--text-secondary)' }}>{cat.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {dailySpending.length > 0 && (
          <div className="card">
            <div className="card-header">
              <h3>Daily Spending Trend</h3>
              <span className="text-sm text-muted">Last 30 days</span>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dailySpending}>
                <defs>
                  <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: 'var(--border)' }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: 'var(--border)' }}
                  tickFormatter={v => `$${v}`}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                  }}
                  formatter={(val) => [`$${val.toLocaleString()}`, 'Spent']}
                />
                <Area type="monotone" dataKey="amount" stroke="#3b82f6" fill="url(#spendGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      {transactions.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3>Recent Transactions</h3>
            <span className="text-sm text-muted">{transactions.length} total</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="transactions-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 8).map((txn, i) => (
                  <tr key={txn.transaction_id || i}>
                    <td className="txn-date">
                      {new Date(txn.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </td>
                    <td className="txn-name">{txn.name || txn.merchant_name}</td>
                    <td>
                      <span className="txn-category">
                        {formatCategory(txn.personal_finance_category?.primary || txn.category?.[0] || 'Other')}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className={`txn-amount ${txn.amount > 0 ? 'negative' : 'positive'}`}>
                        {txn.amount > 0 ? '-' : '+'}${Math.abs(txn.amount).toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCategory(cat) {
  return cat
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());
}
