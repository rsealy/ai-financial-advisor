import {
  Landmark,
  PiggyBank,
  CreditCard,
  TrendingUp,
  FileText,
  Building2,
  Wallet,
} from 'lucide-react';
import PlaidLink from '../components/PlaidLink';

const typeIcons = {
  checking: Landmark,
  savings: PiggyBank,
  credit: CreditCard,
  investment: TrendingUp,
  loan: FileText,
};

const typeClasses = {
  checking: 'checking',
  savings: 'savings',
  'credit card': 'credit',
  credit: 'credit',
  investment: 'investment',
  loan: 'loan',
  mortgage: 'loan',
};

export default function Accounts({ accounts, connected, onConnect }) {
  if (!connected || accounts.length === 0) {
    return (
      <div>
        <div className="page-header">
          <h2>Accounts</h2>
          <p>Manage all your financial accounts in one place</p>
        </div>
        <div className="connect-card">
          <div className="connect-icon">
            <Building2 size={36} />
          </div>
          <h3>No Accounts Connected</h3>
          <p>Link your bank accounts, credit cards, and investments to see them all here.</p>
          <PlaidLink onSuccess={onConnect}>
            <button className="btn btn-primary">
              <Building2 size={18} />
              Connect Account
            </button>
          </PlaidLink>
        </div>
      </div>
    );
  }

  // Group accounts by type
  const grouped = {};
  accounts.forEach(account => {
    const type = account.type || 'other';
    if (!grouped[type]) grouped[type] = [];
    grouped[type].push(account);
  });

  const typeOrder = ['depository', 'credit', 'investment', 'loan', 'other'];
  const typeLabels = {
    depository: 'Bank Accounts',
    credit: 'Credit Cards',
    investment: 'Investments',
    loan: 'Loans',
    other: 'Other',
  };

  const totalBalance = accounts
    .filter(a => ['depository', 'investment'].includes(a.type))
    .reduce((s, a) => s + (a.balances.current || 0), 0);

  const totalDebt = accounts
    .filter(a => ['credit', 'loan'].includes(a.type))
    .reduce((s, a) => s + (a.balances.current || 0), 0);

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2>Accounts</h2>
            <p>{accounts.length} accounts connected</p>
          </div>
          <PlaidLink onSuccess={onConnect}>
            <button className="btn btn-primary btn-sm">
              <Wallet size={16} /> Add Account
            </button>
          </PlaidLink>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid" style={{ marginBottom: 32 }}>
        <div className="stat-card green">
          <div className="stat-icon"><TrendingUp size={22} /></div>
          <div className="stat-label">Total Balance</div>
          <div className="stat-value">
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(totalBalance)}
          </div>
        </div>
        <div className="stat-card red">
          <div className="stat-icon"><CreditCard size={22} /></div>
          <div className="stat-label">Total Debt</div>
          <div className="stat-value">
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(totalDebt)}
          </div>
        </div>
      </div>

      {/* Grouped Accounts */}
      {typeOrder.map(type => {
        const accts = grouped[type];
        if (!accts || accts.length === 0) return null;
        return (
          <div key={type} style={{ marginBottom: 32 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: 'var(--text-secondary)' }}>
              {typeLabels[type] || type}
            </h3>
            <div className="accounts-grid">
              {accts.map(account => {
                const subtype = account.subtype || account.type || 'other';
                const iconClass = typeClasses[subtype] || typeClasses[account.type] || 'other';
                const Icon = typeIcons[iconClass] || Landmark;
                return (
                  <div key={account.account_id} className="account-card">
                    <div className={`account-icon ${iconClass}`}>
                      <Icon size={24} />
                    </div>
                    <div className="account-info">
                      <div className="account-name">{account.name}</div>
                      <div className="account-type">
                        {account.subtype || account.type}
                        {account.mask && ` ••••${account.mask}`}
                      </div>
                    </div>
                    <div className="account-balance">
                      <div className="amount">
                        ${(account.balances.current || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                      {account.balances.limit && (
                        <div className="label">
                          Limit: ${account.balances.limit.toLocaleString()}
                        </div>
                      )}
                      {account.balances.available != null && account.type === 'depository' && (
                        <div className="label">
                          Available: ${account.balances.available.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
