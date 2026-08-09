// Shared reusable components

import React from 'react';
import { CustomerStatus, ChallanStatus, MovementType, CustomerType } from '../types';

// ── Loading ───────────────────────────────────────────────────
export function LoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="loading-state">
      <div className="spinner spinner-lg" />
      <p>{message}</p>
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────
export function EmptyState({
  icon = '📭',
  title = 'No data found',
  message = 'Nothing to show here yet.',
  action,
}: {
  icon?: string;
  title?: string;
  message?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{message}</p>
      {action}
    </div>
  );
}

// ── Error State ───────────────────────────────────────────────
export function ErrorState({
  message = 'An error occurred',
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="error-state">
      <div className="error-state-icon">⚠</div>
      <h3>Something went wrong</h3>
      <p>{message}</p>
      {onRetry && (
        <button className="btn btn-secondary" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'default' | 'lg' | 'xl';
}

export function Modal({ isOpen, onClose, title, children, footer, size = 'default' }: ModalProps) {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose} id="modal-overlay">
      <div
        className={`modal${size === 'lg' ? ' modal-lg' : size === 'xl' ? ' modal-xl' : ''}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onClose} id="modal-close-btn">×</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

// ── Confirm Dialog ────────────────────────────────────────────
interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  confirmVariant?: 'danger' | 'success' | 'primary';
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirm',
  confirmVariant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title="">
      <div style={{ textAlign: 'center', padding: 'var(--space-4) 0' }}>
        <div className="confirm-dialog-icon">
          {confirmVariant === 'danger' ? '⚠' : confirmVariant === 'success' ? '✓' : '?'}
        </div>
        <div className="confirm-dialog-title">{title}</div>
        <p className="confirm-dialog-message">{message}</p>
      </div>
      <div className="modal-footer" style={{ justifyContent: 'center', paddingTop: 'var(--space-5)' }}>
        <button className="btn btn-secondary" onClick={onCancel} disabled={isLoading} id="confirm-cancel-btn">
          Cancel
        </button>
        <button
          className={`btn btn-${confirmVariant}`}
          onClick={onConfirm}
          disabled={isLoading}
          id="confirm-ok-btn"
        >
          {isLoading ? <><div className="spinner" /> Processing...</> : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

// ── Pagination ────────────────────────────────────────────────
interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, total, limit, onPageChange }: PaginationProps) {
  const start = Math.min((page - 1) * limit + 1, total);
  const end = Math.min(page * limit, total);

  return (
    <div className="pagination">
      <span className="pagination-info">
        Showing {total === 0 ? 0 : start}–{end} of {total} results
      </span>
      <div className="pagination-buttons">
        <button
          className="pagination-btn"
          onClick={() => onPageChange(1)}
          disabled={page <= 1}
        >«</button>
        <button
          className="pagination-btn"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >‹</button>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let pageNum: number;
          if (totalPages <= 5) {
            pageNum = i + 1;
          } else if (page <= 3) {
            pageNum = i + 1;
          } else if (page >= totalPages - 2) {
            pageNum = totalPages - 4 + i;
          } else {
            pageNum = page - 2 + i;
          }
          return (
            <button
              key={pageNum}
              className={`pagination-btn${pageNum === page ? ' active' : ''}`}
              onClick={() => onPageChange(pageNum)}
            >
              {pageNum}
            </button>
          );
        })}
        <button
          className="pagination-btn"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >›</button>
        <button
          className="pagination-btn"
          onClick={() => onPageChange(totalPages)}
          disabled={page >= totalPages}
        >»</button>
      </div>
    </div>
  );
}

// ── Badges ────────────────────────────────────────────────────
export function CustomerStatusBadge({ status }: { status: CustomerStatus }) {
  const map: Record<CustomerStatus, { cls: string; label: string }> = {
    ACTIVE:   { cls: 'badge-success', label: 'Active' },
    LEAD:     { cls: 'badge-warning', label: 'Lead' },
    INACTIVE: { cls: 'badge-gray',    label: 'Inactive' },
  };
  const { cls, label } = map[status];
  return <span className={`badge ${cls}`}>{label}</span>;
}

export function CustomerTypeBadge({ type }: { type: CustomerType }) {
  const map: Record<CustomerType, { cls: string }> = {
    RETAIL:      { cls: 'badge-info' },
    WHOLESALE:   { cls: 'badge-purple' },
    DISTRIBUTOR: { cls: 'badge-teal' },
  };
  return <span className={`badge ${map[type].cls}`}>{type}</span>;
}

export function ChallanStatusBadge({ status }: { status: ChallanStatus }) {
  const map: Record<ChallanStatus, { cls: string; label: string }> = {
    DRAFT:     { cls: 'badge-warning', label: 'Draft' },
    CONFIRMED: { cls: 'badge-success', label: 'Confirmed' },
    CANCELLED: { cls: 'badge-danger',  label: 'Cancelled' },
  };
  const { cls, label } = map[status];
  return <span className={`badge ${cls}`}>{label}</span>;
}

export function MovementTypeBadge({ type }: { type: MovementType }) {
  return (
    <span className={`badge ${type === 'IN' ? 'badge-success' : 'badge-danger'}`}>
      {type === 'IN' ? '▲ IN' : '▼ OUT'}
    </span>
  );
}

export function LowStockBadge() {
  return <span className="low-stock-badge">⚠ Low Stock</span>;
}

// ── Stock Bar ─────────────────────────────────────────────────
export function StockBar({ current, minimum, max }: { current: number; minimum: number; max: number }) {
  const pct = max > 0 ? Math.min((current / max) * 100, 100) : 0;
  const level = current <= minimum ? 'low' : pct < 50 ? 'medium' : 'high';

  return (
    <div className="stock-bar">
      <div className="stock-bar-track">
        <div
          className={`stock-bar-fill ${level}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', minWidth: '40px', textAlign: 'right' }}>
        {current}
      </span>
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────
interface KPICardProps {
  icon: string;
  iconColor: string;
  label: string;
  value: string | number;
}

export function KPICard({ icon, iconColor, label, value }: KPICardProps) {
  return (
    <div className="kpi-card">
      <div className={`kpi-icon ${iconColor}`}>{icon}</div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-label">{label}</div>
    </div>
  );
}

// ── Format Helpers ────────────────────────────────────────────
export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}
