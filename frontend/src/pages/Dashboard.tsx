import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService } from '../services';
import { DashboardData } from '../types';
import {
  LoadingState, ErrorState, KPICard, ChallanStatusBadge,
  MovementTypeBadge, LowStockBadge, StockBar,
  formatDate, formatDateTime,
} from '../components';
import { getErrorMessage } from '../services/api';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    dashboardService.get()
      .then(res => setData(res.data.data))
      .catch(err => setError(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <LoadingState message="Loading dashboard..." />;
  if (error) return <ErrorState message={error} />;
  if (!data) return null;

  return (
    <div>
      {/* KPI Cards */}
      <div className="kpi-grid">
        <KPICard icon="👥" iconColor="blue"   label="Total Customers"    value={data.kpis.totalCustomers} />
        <KPICard icon="📦" iconColor="purple" label="Total Products"     value={data.kpis.totalProducts} />
        <KPICard icon="🏪" iconColor="teal"   label="Total Stock Units"  value={data.kpis.totalStockUnits.toLocaleString()} />
        <KPICard icon="⚠"  iconColor="red"    label="Low Stock Items"    value={data.kpis.lowStockCount} />
        <KPICard icon="📋" iconColor="yellow" label="Draft Challans"     value={data.kpis.draftChallans} />
        <KPICard icon="✓"  iconColor="green"  label="Confirmed Challans" value={data.kpis.confirmedChallans} />
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>

        {/* Recent Challans */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Challans</h3>
            <Link to="/challans" className="btn btn-ghost btn-sm">View all →</Link>
          </div>
          {data.recentChallans.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>No challans yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {data.recentChallans.map(c => (
                <Link
                  key={c.id}
                  to={`/challans/${c.id}`}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-3)', background: 'var(--color-bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', textDecoration: 'none' }}
                >
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>
                      {c.challan_number}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      {c.customer_name} · {c.total_quantity} units
                    </div>
                  </div>
                  <ChallanStatusBadge status={c.status} />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Follow-ups */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Upcoming Follow-ups</h3>
            <Link to="/customers" className="btn btn-ghost btn-sm">View all →</Link>
          </div>
          {data.upcomingFollowUps.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>No upcoming follow-ups in next 7 days.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {data.upcomingFollowUps.map(f => (
                <Link
                  key={f.id}
                  to={`/customers/${f.id}`}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-3)', background: 'var(--color-bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', textDecoration: 'none' }}
                >
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{f.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{f.business_name}</div>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-warning)', fontWeight: 600 }}>
                    📅 {formatDate(f.follow_up_date)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>

        {/* Low Stock Alerts */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">⚠ Low Stock Alerts</h3>
            <Link to="/inventory" className="btn btn-ghost btn-sm">View inventory →</Link>
          </div>
          {data.lowStockProducts.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>All products have sufficient stock. ✓</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {data.lowStockProducts.map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3)', background: 'var(--color-danger-bg)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239,68,68,0.15)' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{p.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{p.sku}</div>
                    <StockBar current={p.current_stock} minimum={p.minimum_stock} max={Math.max(p.current_stock, p.minimum_stock) * 2} />
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <LowStockBadge />
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
                      {p.current_stock} / {p.minimum_stock} min
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Stock Movements */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Stock Movements</h3>
            <Link to="/stock-movements" className="btn btn-ghost btn-sm">View all →</Link>
          </div>
          {data.recentMovements.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>No movements recorded yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {data.recentMovements.slice(0, 6).map(m => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-2) var(--space-3)', background: 'var(--color-bg-surface)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="truncate" style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                      {m.product_name}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                      {formatDateTime(m.created_at)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexShrink: 0 }}>
                    <MovementTypeBadge type={m.movement_type} />
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text-primary)', minWidth: '30px', textAlign: 'right' }}>
                      {m.quantity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
