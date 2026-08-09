import { useState, useEffect } from 'react';
import { inventoryService } from '../services';
import { StockMovement } from '../types';
import { LoadingState, ErrorState, EmptyState, MovementTypeBadge, formatDateTime } from '../components';
import { getErrorMessage } from '../services/api';

export default function AllStockMovementsPage() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    inventoryService.getAllMovements()
      .then(res => setMovements(res.data.data))
      .catch(err => setError(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Stock Log</h1>
          <p className="page-subtitle">All recent stock movements across the warehouse</p>
        </div>
      </div>

      <div className="table-container">
        {isLoading ? (
          <LoadingState message="Loading movements..." />
        ) : error ? (
          <ErrorState message={error} />
        ) : movements.length === 0 ? (
          <EmptyState icon="📈" title="No movements" message="No stock movements recorded yet." />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Product</th>
                <th>SKU</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Reason</th>
                <th>By</th>
              </tr>
            </thead>
            <tbody>
              {movements.map(m => (
                <tr key={m.id}>
                  <td style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                    {formatDateTime(m.created_at)}
                  </td>
                  <td style={{ fontWeight: 500 }}>{m.product_name}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    {m.sku}
                  </td>
                  <td><MovementTypeBadge type={m.movement_type} /></td>
                  <td style={{ fontWeight: 700, color: m.movement_type === 'IN' ? 'var(--color-success)' : 'var(--color-danger)' }}>
                    {m.movement_type === 'IN' ? '+' : '-'}{m.quantity}
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', maxWidth: 250 }} className="truncate">
                    {m.reason || '—'}
                  </td>
                  <td style={{ fontSize: '0.8rem' }}>{m.created_by_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
