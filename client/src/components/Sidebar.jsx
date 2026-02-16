import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  Bot,
  Plus,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import PlaidLink from './PlaidLink';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'accounts', label: 'Accounts', icon: Wallet },
  { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
  { id: 'advisor', label: 'AI Advisor', icon: Bot },
];

export default function Sidebar({ activePage, onNavigate, connected, onConnect, onRefresh, loading }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="logo-icon">
            <TrendingUp size={22} />
          </div>
          <div className="logo-text">
            <h1>WealthPilot</h1>
            <span>AI Financial Advisor</span>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(item => (
          <button
            key={item.id}
            className={`nav-item ${activePage === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            <item.icon size={20} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <PlaidLink onSuccess={onConnect}>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
            <Plus size={18} />
            Connect Account
          </button>
        </PlaidLink>
        {connected && (
          <button
            className="btn btn-secondary btn-sm mt-2"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={onRefresh}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'spinning' : ''} />
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </button>
        )}
      </div>
    </aside>
  );
}
