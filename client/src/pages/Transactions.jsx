import { useState, useMemo } from 'react';
import { Search, ArrowUpDown, Filter } from 'lucide-react';

export default function Transactions({ transactions, connected }) {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('date');
  const [sortDir, setSortDir] = useState('desc');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [page, setPage] = useState(1);
  const perPage = 20;

  const categories = useMemo(() => {
    const cats = new Set();
    transactions.forEach(t => {
      cats.add(t.personal_finance_category?.primary || t.category?.[0] || 'Other');
    });
    return ['all', ...Array.from(cats).sort()];
  }, [transactions]);

  const filtered = useMemo(() => {
    let result = [...transactions];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(t =>
        (t.name || '').toLowerCase().includes(q) ||
        (t.merchant_name || '').toLowerCase().includes(q)
      );
    }

    if (categoryFilter !== 'all') {
      result = result.filter(t => {
        const cat = t.personal_finance_category?.primary || t.category?.[0] || 'Other';
        return cat === categoryFilter;
      });
    }

    result.sort((a, b) => {
      let valA, valB;
      if (sortField === 'date') {
        valA = new Date(a.date);
        valB = new Date(b.date);
      } else if (sortField === 'amount') {
        valA = a.amount;
        valB = b.amount;
      } else {
        valA = (a.name || '').toLowerCase();
        valB = (b.name || '').toLowerCase();
      }
      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [transactions, search, categoryFilter, sortField, sortDir]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
    setPage(1);
  };

  if (!connected) {
    return (
      <div>
        <div className="page-header">
          <h2>Transactions</h2>
          <p>View and search all your transactions</p>
        </div>
        <div className="empty-state">
          <ArrowUpDown size={48} />
          <p>Connect an account to view your transactions</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h2>Transactions</h2>
        <p>{filtered.length} transactions found</p>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search transactions..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              style={{
                width: '100%',
                padding: '10px 14px 10px 38px',
                background: 'var(--bg-input)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                fontSize: 14,
                fontFamily: 'inherit',
                outline: 'none',
              }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Filter size={16} style={{ color: 'var(--text-muted)' }} />
            <select
              value={categoryFilter}
              onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
              style={{
                padding: '10px 14px',
                background: 'var(--bg-input)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                fontSize: 14,
                fontFamily: 'inherit',
                outline: 'none',
              }}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : formatCategory(cat)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="transactions-table">
            <thead>
              <tr>
                <th onClick={() => toggleSort('date')} style={{ cursor: 'pointer' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    Date <ArrowUpDown size={12} />
                  </span>
                </th>
                <th onClick={() => toggleSort('name')} style={{ cursor: 'pointer' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    Description <ArrowUpDown size={12} />
                  </span>
                </th>
                <th>Category</th>
                <th onClick={() => toggleSort('amount')} style={{ cursor: 'pointer', textAlign: 'right' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                    Amount <ArrowUpDown size={12} />
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((txn, i) => (
                <tr key={txn.transaction_id || i}>
                  <td className="txn-date">
                    {new Date(txn.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
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
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                    No transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</button>
            <span>Page {page} of {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        )}
      </div>
    </div>
  );
}

function formatCategory(cat) {
  return cat.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}
