import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { customerService } from '../services';
import { Customer } from '../types';
import {
  LoadingState, ErrorState, EmptyState, Pagination,
  CustomerStatusBadge, CustomerTypeBadge, formatDate,
} from '../components';
import { getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 10;
  const { hasRole } = useAuth();
  const navigate = useNavigate();

  const loadCustomers = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const params: Record<string, unknown> = { page, limit: LIMIT };
      if (search)       params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (typeFilter)   params.customerType = typeFilter;

      const res = await customerService.list(params);
      setCustomers(res.data.data);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [page, search, statusFilter, typeFilter]);

  useEffect(() => { loadCustomers(); }, [loadCustomers]);

  // Reset page when filters change
  const handleSearch = (val: string) => { setSearch(val); setPage(1); };
  const handleStatus = (val: string) => { setStatusFilter(val); setPage(1); };
  const handleType   = (val: string) => { setTypeFilter(val); setPage(1); };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="page-subtitle">Manage your customer relationships and follow-ups</p>
        </div>
        {hasRole('ADMIN', 'SALES') && (
          <div className="page-actions">
            <Link to="/customers/new" className="btn btn-primary" id="add-customer-btn">
              + Add Customer
            </Link>
          </div>
        )}
      </div>

      {/* Search & Filters */}
      <div className="search-bar">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search by name, business, or mobile..."
            value={search}
            onChange={e => handleSearch(e.target.value)}
            id="customer-search"
          />
        </div>
        <select
          className="filter-select"
          value={statusFilter}
          onChange={e => handleStatus(e.target.value)}
          id="status-filter"
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="LEAD">Lead</option>
          <option value="INACTIVE">Inactive</option>
        </select>
        <select
          className="filter-select"
          value={typeFilter}
          onChange={e => handleType(e.target.value)}
          id="type-filter"
        >
          <option value="">All Types</option>
          <option value="RETAIL">Retail</option>
          <option value="WHOLESALE">Wholesale</option>
          <option value="DISTRIBUTOR">Distributor</option>
        </select>
      </div>

      {/* Table */}
      <div className="table-container">
        {isLoading ? (
          <LoadingState message="Loading customers..." />
        ) : error ? (
          <ErrorState message={error} onRetry={loadCustomers} />
        ) : customers.length === 0 ? (
          <EmptyState
            icon="👥"
            title="No customers found"
            message={search ? 'No customers match your search.' : 'Start by adding your first customer.'}
            action={hasRole('ADMIN', 'SALES') ? (
              <Link to="/customers/new" className="btn btn-primary">+ Add Customer</Link>
            ) : undefined}
          />
        ) : (
          <>
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Business</th>
                  <th>Mobile</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Follow-up</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{c.name}</div>
                      {c.email && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{c.email}</div>
                      )}
                    </td>
                    <td>
                      <div>{c.business_name || '—'}</div>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{c.mobile}</td>
                    <td><CustomerTypeBadge type={c.customer_type} /></td>
                    <td><CustomerStatusBadge status={c.status} /></td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      {c.follow_up_date ? (
                        <span style={{ color: new Date(c.follow_up_date) <= new Date() ? 'var(--color-danger)' : 'var(--color-warning)' }}>
                          📅 {formatDate(c.follow_up_date)}
                        </span>
                      ) : '—'}
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => navigate(`/customers/${c.id}`)}
                        id={`view-customer-${c.id}`}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              limit={LIMIT}
              onPageChange={setPage}
            />
          </>
        )}
      </div>
    </div>
  );
}
