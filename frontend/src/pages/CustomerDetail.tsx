import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { customerService } from '../services';
import { Customer, CustomerFollowup } from '../types';
import {
  LoadingState, ErrorState, CustomerStatusBadge, CustomerTypeBadge,
  Modal, formatDate, formatDateTime,
} from '../components';
import { getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const toast = useToast();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [followups, setFollowups] = useState<CustomerFollowup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Follow-up modal state
  const [showFollowupModal, setShowFollowupModal] = useState(false);
  const [followupNote, setFollowupNote] = useState('');
  const [followupDate, setFollowupDate] = useState('');
  const [followupLoading, setFollowupLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    const customerId = parseInt(id, 10);
    setIsLoading(true);

    Promise.all([
      customerService.get(customerId),
      customerService.listFollowups(customerId),
    ]).then(([cRes, fRes]) => {
      setCustomer(cRes.data.data);
      setFollowups(fRes.data.data);
    }).catch(err => {
      setError(getErrorMessage(err));
    }).finally(() => setIsLoading(false));
  }, [id]);

  const handleAddFollowup = async () => {
    if (!followupNote.trim() || !id) return;
    setFollowupLoading(true);
    try {
      const res = await customerService.addFollowup(parseInt(id, 10), {
        note: followupNote,
        follow_up_date: followupDate || undefined,
      });
      setFollowups(prev => [res.data.data, ...prev]);
      setFollowupNote('');
      setFollowupDate('');
      setShowFollowupModal(false);
      toast.success('Follow-up added successfully!');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setFollowupLoading(false);
    }
  };

  if (isLoading) return <LoadingState />;
  if (error)     return <ErrorState message={error} />;
  if (!customer) return null;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>← Back</button>
          <div>
            <h1 className="page-title">{customer.name}</h1>
            {customer.business_name && (
              <p className="page-subtitle">{customer.business_name}</p>
            )}
          </div>
        </div>
        {hasRole('ADMIN', 'SALES') && (
          <div className="page-actions">
            <Link
              to={`/customers/${customer.id}/edit`}
              className="btn btn-secondary"
              id="edit-customer-btn"
            >
              ✎ Edit
            </Link>
          </div>
        )}
      </div>

      {/* Customer Info Card */}
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="card-header">
          <h3 className="card-title">Customer Details</h3>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <CustomerTypeBadge type={customer.customer_type} />
            <CustomerStatusBadge status={customer.status} />
          </div>
        </div>

        <div className="detail-grid">
          <div className="detail-field">
            <span className="detail-label">📱 Mobile</span>
            <span className="detail-value" style={{ fontFamily: 'var(--font-mono)' }}>{customer.mobile}</span>
          </div>
          {customer.email && (
            <div className="detail-field">
              <span className="detail-label">✉ Email</span>
              <span className="detail-value">{customer.email}</span>
            </div>
          )}
          {customer.gst_number && (
            <div className="detail-field">
              <span className="detail-label">🏛 GST Number</span>
              <span className="detail-value" style={{ fontFamily: 'var(--font-mono)' }}>{customer.gst_number}</span>
            </div>
          )}
          {customer.follow_up_date && (
            <div className="detail-field">
              <span className="detail-label">📅 Next Follow-up</span>
              <span className="detail-value" style={{ color: 'var(--color-warning)' }}>
                {formatDate(customer.follow_up_date)}
              </span>
            </div>
          )}
          <div className="detail-field">
            <span className="detail-label">📅 Customer Since</span>
            <span className="detail-value">{formatDate(customer.created_at)}</span>
          </div>
        </div>

        {customer.address && (
          <div style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-border)' }}>
            <span className="detail-label" style={{ display: 'block', marginBottom: 'var(--space-2)' }}>📍 Address</span>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>{customer.address}</p>
          </div>
        )}

        {customer.notes && (
          <div style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-border)' }}>
            <span className="detail-label" style={{ display: 'block', marginBottom: 'var(--space-2)' }}>📝 Notes</span>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>{customer.notes}</p>
          </div>
        )}
      </div>

      {/* Follow-up History */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Follow-up History ({followups.length})</h3>
          {hasRole('ADMIN', 'SALES') && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setShowFollowupModal(true)}
              id="add-followup-btn"
            >
              + Add Follow-up
            </button>
          )}
        </div>

        {followups.length === 0 ? (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <div style={{ fontSize: '2rem', marginBottom: 'var(--space-2)' }}>📝</div>
            <p>No follow-ups recorded yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {followups.map(f => (
              <div
                key={f.id}
                style={{
                  display: 'flex',
                  gap: 'var(--space-4)',
                  padding: 'var(--space-4)',
                  background: 'var(--color-bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '1rem', border: '1px solid rgba(99,102,241,0.2)',
                }}>
                  📝
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)', marginBottom: 'var(--space-2)', lineHeight: 1.6 }}>
                    {f.note}
                  </p>
                  <div style={{ display: 'flex', gap: 'var(--space-4)', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    <span>By: {f.created_by_name}</span>
                    <span>{formatDateTime(f.created_at)}</span>
                    {f.follow_up_date && (
                      <span style={{ color: 'var(--color-warning)' }}>
                        📅 Next: {formatDate(f.follow_up_date)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Follow-up Modal */}
      <Modal
        isOpen={showFollowupModal}
        onClose={() => setShowFollowupModal(false)}
        title="Add Follow-up"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowFollowupModal(false)}>Cancel</button>
            <button
              className="btn btn-primary"
              onClick={handleAddFollowup}
              disabled={!followupNote.trim() || followupLoading}
              id="submit-followup-btn"
            >
              {followupLoading ? <><div className="spinner" /> Saving...</> : 'Add Follow-up'}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label" htmlFor="followup-note">
            Note <span className="required">*</span>
          </label>
          <textarea
            id="followup-note"
            className="form-textarea"
            placeholder="Enter follow-up note..."
            value={followupNote}
            onChange={e => setFollowupNote(e.target.value)}
            rows={4}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="followup-date">Next Follow-up Date</label>
          <input
            id="followup-date"
            type="date"
            className="form-input"
            value={followupDate}
            onChange={e => setFollowupDate(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
}
