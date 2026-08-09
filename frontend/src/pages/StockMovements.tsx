import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { inventoryService, productService } from '../services';
import { StockMovement, Product } from '../types';
import { LoadingState, ErrorState, EmptyState, MovementTypeBadge, formatDateTime, Pagination } from '../components';
import { getErrorMessage } from '../services/api';

export default function StockMovementsPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();

  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const LIMIT = 20;

  useEffect(() => {
    if (!productId) return;
    const pid = parseInt(productId, 10);
    setIsLoading(true);

    Promise.all([
      productService.get(pid),
      inventoryService.getMovements(pid, { page, limit: LIMIT }),
    ]).then(([pRes, mRes]) => {
      setProduct(pRes.data.data);
      setMovements(mRes.data.data);
      setTotal((mRes.data as any).total || 0);
      setTotalPages((mRes.data as any).totalPages || 1);
    }).catch(err => {
      setError(getErrorMessage(err));
    }).finally(() => setIsLoading(false));
  }, [productId, page]);

  if (isLoading) return <LoadingState />;
  if (error)     return <ErrorState message={error} />;

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>← Back</button>
          <div>
            <h1 className="page-title">Stock Movements</h1>
            {product && (
              <p className="page-subtitle">
                {product.name} · <span style={{ fontFamily: 'var(--font-mono)' }}>{product.sku}</span>
                {' · '}Current stock: <strong>{product.current_stock}</strong> units
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="table-container">
        {movements.length === 0 ? (
          <EmptyState icon="📈" title="No movements" message="No stock movements recorded for this product." />
        ) : (
          <>
            <table className="table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Type</th>
                  <th>Quantity</th>
                  <th>Reason</th>
                  <th>Created By</th>
                </tr>
              </thead>
              <tbody>
                {movements.map(m => (
                  <tr key={m.id}>
                    <td style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      {formatDateTime(m.created_at)}
                    </td>
                    <td><MovementTypeBadge type={m.movement_type} /></td>
                    <td style={{ fontWeight: 700, fontSize: '1.1rem', color: m.movement_type === 'IN' ? 'var(--color-success)' : 'var(--color-danger)' }}>
                      {m.movement_type === 'IN' ? '+' : '-'}{m.quantity}
                    </td>
                    <td style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', maxWidth: 300 }}>
                      {m.reason || '—'}
                    </td>
                    <td style={{ fontSize: '0.875rem' }}>{m.created_by_name}</td>
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
