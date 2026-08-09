import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { challanService } from '../services';
import { Challan } from '../types';
import {
  LoadingState, ErrorState, EmptyState, Pagination,
  ChallanStatusBadge, formatDateTime,
} from '../components';
import { getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ChallansPage() {
  const [challans, setChallans] = useState<Challan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 10;
  const { hasRole } = useAuth();
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const params: Record<string, unknown> = { page, limit: LIMIT };
      if (statusFilter) params.status = statusFilter;
      const res = await challanService.list(params);
      setChallans(res.data.data);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Sales Challans</h1>
          <p className="page-subtitle">Manage sales challans and delivery orders</p>
        </div>
        {hasRole('ADMIN', 'SALES') && (
          <div className="page-actions">
            <Link to="/challans/new" className="btn btn-primary" id="new-challan-btn">+ New Challan</Link>
          </div>
        )}
      </div>

      {/* Filter */}
      <div className="search-bar">
        <select
          className="filter-select"
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          id="challan-status-filter"
        >
          <option value="">All Status</option>
          <option value="DRAFT">Draft</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <div className="table-container">
        {isLoading ? (
          <LoadingState message="Loading challans..." />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : challans.length === 0 ? (
          <EmptyState
            icon="📋"
            title="No challans found"
            message="Start by creating your first sales challan."
            action={hasRole('ADMIN', 'SALES') ? (
              <Link to="/challans/new" className="btn btn-primary">+ New Challan</Link>
            ) : undefined}
          />
        ) : (
          <>
            <table className="table">
              <thead>
                <tr>
                  <th>Challan #</th>
                  <th>Customer</th>
                  <th>Total Qty</th>
                  <th>Status</th>
                  <th>Created By</th>
                  <th>Created At</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {challans.map(c => (
                  <tr key={c.id}>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-brand-500)' }}>
                        {c.challan_number}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{c.customer_name}</div>
                      {c.business_name && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{c.business_name}</div>
                      )}
                    </td>
                    <td style={{ fontWeight: 600 }}>{c.total_quantity}</td>
                    <td><ChallanStatusBadge status={c.status} /></td>
                    <td style={{ fontSize: '0.875rem' }}>{c.created_by_name}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{formatDateTime(c.created_at)}</td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => navigate(`/challans/${c.id}`)}
                        id={`view-challan-${c.id}`}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination page={page} totalPages={totalPages} total={total} limit={LIMIT} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
