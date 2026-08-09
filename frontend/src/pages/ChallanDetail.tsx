import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { challanService } from '../services';
import { Challan } from '../types';
import {
  LoadingState, ErrorState, ChallanStatusBadge, ConfirmDialog,
  formatDateTime, formatDate, formatCurrency,
} from '../components';
import { getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function ChallanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const toast = useToast();

  const [challan, setChallan] = useState<Challan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const load = () => {
    if (!id) return;
    setIsLoading(true);
    challanService.get(parseInt(id, 10))
      .then(res => setChallan(res.data.data))
      .catch(err => setError(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const handleConfirm = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      const res = await challanService.confirm(parseInt(id, 10));
      setChallan(res.data.data);
      setShowConfirmDialog(false);
      toast.success('Challan confirmed! Stock has been deducted.');
    } catch (err) {
      toast.error(getErrorMessage(err));
      setShowConfirmDialog(false);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      const res = await challanService.cancel(parseInt(id, 10));
      setChallan(res.data.data);
      setShowCancelDialog(false);
      toast.success('Challan cancelled.');
    } catch (err) {
      toast.error(getErrorMessage(err));
      setShowCancelDialog(false);
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) return <LoadingState />;
  if (error)     return <ErrorState message={error} />;
  if (!challan)  return null;

  const canConfirm = challan.status === 'DRAFT' && hasRole('ADMIN', 'SALES');
  const canCancel  = challan.status === 'DRAFT' && hasRole('ADMIN', 'SALES');

  const totalValue = (challan.items || []).reduce(
    (sum, item) => sum + item.unit_price * item.quantity, 0
  );

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>← Back</button>
          <div>
            <h1 className="page-title" style={{ fontFamily: 'var(--font-mono)' }}>
              {challan.challan_number}
            </h1>
            <p className="page-subtitle">
              Created by {challan.created_by_name} · {formatDateTime(challan.created_at)}
            </p>
          </div>
        </div>
        <div className="page-actions" style={{ alignItems: 'center', gap: 'var(--space-3)' }}>
          <ChallanStatusBadge status={challan.status} />
          {canConfirm && (
            <button
              className="btn btn-success"
              onClick={() => setShowConfirmDialog(true)}
              id="confirm-challan-action-btn"
            >
              ✓ Confirm Challan
            </button>
          )}
          {canCancel && (
            <button
              className="btn btn-danger"
              onClick={() => setShowCancelDialog(true)}
              id="cancel-challan-btn"
            >
              ✕ Cancel
            </button>
          )}
        </div>
      </div>

      {/* Stock deduction notice */}
      {challan.status === 'CONFIRMED' && (
        <div className="alert alert-success" style={{ marginBottom: 'var(--space-6)' }}>
          <span>✓</span>
          <span>This challan has been confirmed. Stock has been deducted and OUT movements recorded.</span>
        </div>
      )}
      {challan.status === 'CANCELLED' && (
        <div className="alert alert-danger" style={{ marginBottom: 'var(--space-6)' }}>
          <span>✕</span>
          <span>This challan has been cancelled. No stock was deducted.</span>
        </div>
      )}

      {/* Customer & Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Customer</h3>
          </div>
          <div className="detail-grid" style={{ gridTemplateColumns: '1fr' }}>
            <div className="detail-field">
              <span className="detail-label">Name</span>
              <span className="detail-value">{challan.customer_name}</span>
            </div>
            {challan.business_name && (
              <div className="detail-field">
                <span className="detail-label">Business</span>
                <span className="detail-value">{challan.business_name}</span>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Summary</h3>
          </div>
          <div className="detail-grid">
            <div className="detail-field">
              <span className="detail-label">Total Quantity</span>
              <span className="detail-value" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-brand-500)' }}>
                {challan.total_quantity}
              </span>
            </div>
            <div className="detail-field">
              <span className="detail-label">Total Value</span>
              <span className="detail-value" style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                {formatCurrency(totalValue)}
              </span>
            </div>
            <div className="detail-field">
              <span className="detail-label">Items</span>
              <span className="detail-value">{(challan.items || []).length} products</span>
            </div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Challan Items (Snapshot at time of creation)</h3>
        </div>
        <div className="table-container" style={{ border: 'none' }}>
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Product</th>
                <th>SKU</th>
                <th>Unit Price</th>
                <th>Quantity</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {(challan.items || []).map((item, idx) => (
                <tr key={item.id}>
                  <td style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{idx + 1}</td>
                  <td style={{ fontWeight: 600 }}>{item.product_name}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    {item.sku}
                  </td>
                  <td>{formatCurrency(item.unit_price)}</td>
                  <td style={{ fontWeight: 700 }}>{item.quantity}</td>
                  <td style={{ fontWeight: 700, color: 'var(--color-brand-500)' }}>
                    {formatCurrency(item.unit_price * item.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4} />
                <td style={{ fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                  TOTAL
                </td>
                <td style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-brand-500)' }}>
                  {formatCurrency(totalValue)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--color-bg-surface)', borderTop: '1px solid var(--color-border)', fontSize: '0.75rem', color: 'var(--color-text-muted)', borderRadius: '0 0 var(--radius-md) var(--radius-md)' }}>
          ℹ Product name, SKU, and price shown are snapshots captured at challan creation time and will not change even if product data is updated later.
        </div>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        title="Confirm Challan?"
        message={`This will deduct ${challan.total_quantity} units from inventory and mark the challan as Confirmed. This action cannot be undone.`}
        onConfirm={handleConfirm}
        onCancel={() => setShowConfirmDialog(false)}
        confirmLabel="Yes, Confirm"
        confirmVariant="success"
        isLoading={actionLoading}
      />

      {/* Cancel Dialog */}
      <ConfirmDialog
        isOpen={showCancelDialog}
        title="Cancel Challan?"
        message="Are you sure you want to cancel this draft challan? No stock will be affected."
        onConfirm={handleCancel}
        onCancel={() => setShowCancelDialog(false)}
        confirmLabel="Yes, Cancel Challan"
        confirmVariant="danger"
        isLoading={actionLoading}
      />
    </div>
  );
}
