import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { inventoryService, productService } from '../services';
import { Product } from '../types';
import {
  LoadingState, ErrorState, EmptyState, Pagination,
  LowStockBadge, StockBar, KPICard, formatCurrency,
} from '../components';
import { getErrorMessage } from '../services/api';

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState({ totalProducts: 0, totalStockUnits: 0, lowStockCount: 0 });
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 15;

  useEffect(() => {
    productService.getCategories()
      .then(res => setCategories(res.data.data))
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const params: Record<string, unknown> = { page, limit: LIMIT };
      if (search) params.search = search;
      if (categoryFilter) params.category = categoryFilter;

      const res = await inventoryService.get(params);
      setProducts(res.data.data.products);
      setStats(res.data.data.stats);
      setTotal(res.data.data.total);
      setTotalPages(res.data.data.totalPages);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [page, search, categoryFilter]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory</h1>
          <p className="page-subtitle">Real-time stock levels and warehouse management</p>
        </div>
        <div className="page-actions">
          <Link to="/stock-movements" className="btn btn-secondary">📈 Stock Log</Link>
        </div>
      </div>

      {/* Stats */}
      <div className="kpi-grid" style={{ marginBottom: 'var(--space-8)' }}>
        <KPICard icon="📦" iconColor="purple" label="Total Products"    value={stats.totalProducts} />
        <KPICard icon="🏪" iconColor="teal"   label="Total Stock Units" value={stats.totalStockUnits.toLocaleString()} />
        <KPICard icon="⚠"  iconColor="red"    label="Low Stock Items"   value={stats.lowStockCount} />
      </div>

      {/* Filters */}
      <div className="search-bar">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search products..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="filter-select"
          value={categoryFilter}
          onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="table-container">
        {isLoading ? (
          <LoadingState message="Loading inventory..." />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : products.length === 0 ? (
          <EmptyState icon="🏪" title="No products" message="No products in inventory." />
        ) : (
          <>
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Current Stock</th>
                  <th>Min Stock</th>
                  <th>Status</th>
                  <th>Location</th>
                  <th>Movements</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => {
                  const isLow = p.current_stock <= p.minimum_stock;
                  const maxForBar = Math.max(p.current_stock, p.minimum_stock) * 2;
                  return (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600 }}>{p.name}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        {p.sku}
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
                          {p.category}
                        </span>
                      </td>
                      <td>{formatCurrency(p.unit_price)}</td>
                      <td style={{ minWidth: 140 }}>
                        <StockBar current={p.current_stock} minimum={p.minimum_stock} max={maxForBar} />
                      </td>
                      <td style={{ color: 'var(--color-text-muted)' }}>{p.minimum_stock}</td>
                      <td>
                        {isLow ? <LowStockBadge /> : (
                          <span className="badge badge-success">OK</span>
                        )}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        {p.warehouse_location || '—'}
                      </td>
                      <td>
                        <Link to={`/inventory/${p.id}/movements`} className="btn btn-ghost btn-sm">
                          📈 View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <Pagination page={page} totalPages={totalPages} total={total} limit={LIMIT} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
