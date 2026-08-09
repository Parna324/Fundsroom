import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { productService } from '../services';
import { Product } from '../types';
import {
  LoadingState, ErrorState, EmptyState, Pagination,
  LowStockBadge, StockBar, formatCurrency,
} from '../components';
import { getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 15;
  const { hasRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    productService.getCategories()
      .then(res => setCategories(res.data.data))
      .catch(() => {});
  }, []);

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const params: Record<string, unknown> = { page, limit: LIMIT };
      if (search) params.search = search;
      if (categoryFilter) params.category = categoryFilter;
      if (lowStockOnly) params.lowStock = true;

      const res = await productService.list(params);
      setProducts(res.data.data);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [page, search, categoryFilter, lowStockOnly]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const handleSearch = (v: string) => { setSearch(v); setPage(1); };
  const handleCategory = (v: string) => { setCategoryFilter(v); setPage(1); };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">Product catalog and stock management</p>
        </div>
        {hasRole('ADMIN', 'WAREHOUSE') && (
          <div className="page-actions">
            <Link to="/products/new" className="btn btn-primary" id="add-product-btn">+ Add Product</Link>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="search-bar">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search by name or SKU..."
            value={search}
            onChange={e => handleSearch(e.target.value)}
            id="product-search"
          />
        </div>
        <select
          className="filter-select"
          value={categoryFilter}
          onChange={e => handleCategory(e.target.value)}
          id="category-filter"
        >
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--color-text-secondary)', padding: '0 var(--space-2)' }}>
          <input
            type="checkbox"
            checked={lowStockOnly}
            onChange={e => { setLowStockOnly(e.target.checked); setPage(1); }}
            id="low-stock-filter"
            style={{ accentColor: 'var(--color-danger)' }}
          />
          Low stock only
        </label>
      </div>

      <div className="table-container">
        {isLoading ? (
          <LoadingState message="Loading products..." />
        ) : error ? (
          <ErrorState message={error} onRetry={loadProducts} />
        ) : products.length === 0 ? (
          <EmptyState
            icon="📦"
            title="No products found"
            message="No products match your filters."
            action={hasRole('ADMIN', 'WAREHOUSE') ? (
              <Link to="/products/new" className="btn btn-primary">+ Add Product</Link>
            ) : undefined}
          />
        ) : (
          <>
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Unit Price</th>
                  <th>Stock</th>
                  <th>Min Stock</th>
                  <th>Location</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => {
                  const isLow = p.current_stock <= p.minimum_stock;
                  return (
                    <tr key={p.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{p.name}</div>
                        {isLow && <LowStockBadge />}
                      </td>
                      <td>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                          {p.sku}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-sm)', color: 'var(--color-text-secondary)' }}>
                          {p.category}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{formatCurrency(p.unit_price)}</td>
                      <td>
                        <div style={{ minWidth: 120 }}>
                          <StockBar
                            current={p.current_stock}
                            minimum={p.minimum_stock}
                            max={Math.max(p.current_stock, p.minimum_stock) * 3}
                          />
                        </div>
                      </td>
                      <td style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{p.minimum_stock}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {p.warehouse_location || '—'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => navigate(`/inventory/${p.id}/movements`)}
                            title="View movements"
                          >
                            📈
                          </button>
                          {hasRole('ADMIN', 'WAREHOUSE') && (
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => navigate(`/products/${p.id}/edit`)}
                              id={`edit-product-${p.id}`}
                            >
                              ✎
                            </button>
                          )}
                        </div>
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
