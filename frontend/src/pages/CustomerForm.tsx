import { useState, useEffect, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { customerService } from '../services';
import { Customer } from '../types';
import { LoadingState } from '../components';
import { getErrorMessage } from '../services/api';
import { useToast } from '../context/ToastContext';

interface CustomerFormData {
  name: string;
  mobile: string;
  email: string;
  business_name: string;
  gst_number: string;
  customer_type: string;
  address: string;
  status: string;
  follow_up_date: string;
  notes: string;
}

const INITIAL: CustomerFormData = {
  name: '', mobile: '', email: '', business_name: '', gst_number: '',
  customer_type: 'RETAIL', address: '', status: 'LEAD', follow_up_date: '', notes: '',
};

export default function CustomerFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState<CustomerFormData>(INITIAL);
  const [errors, setErrors] = useState<Partial<CustomerFormData>>({});
  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    customerService.get(parseInt(id!, 10))
      .then(res => {
        const c: Customer = res.data.data;
        setForm({
          name: c.name || '',
          mobile: c.mobile || '',
          email: c.email || '',
          business_name: c.business_name || '',
          gst_number: c.gst_number || '',
          customer_type: c.customer_type || 'RETAIL',
          address: c.address || '',
          status: c.status || 'LEAD',
          follow_up_date: c.follow_up_date ? c.follow_up_date.split('T')[0] : '',
          notes: c.notes || '',
        });
      })
      .catch(err => toast.error(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, [id, isEdit]);

  const validate = (): boolean => {
    const errs: Partial<CustomerFormData> = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.mobile.trim()) errs.mobile = 'Mobile is required';
    else if (!/^[6-9]\d{9}$/.test(form.mobile)) errs.mobile = 'Invalid Indian mobile (10 digits, starts with 6-9)';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email';
    if (form.gst_number && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(form.gst_number)) {
      errs.gst_number = 'Invalid GST number';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSaving(true);
    try {
      const payload = {
        ...form,
        customer_type: form.customer_type as import('../types').CustomerType,
        status: form.status as import('../types').CustomerStatus,
        email: form.email || undefined,
        gst_number: form.gst_number || undefined,
        follow_up_date: form.follow_up_date || undefined,
        notes: form.notes || undefined,
      };

      if (isEdit) {
        await customerService.update(parseInt(id!, 10), payload);
        toast.success('Customer updated successfully!');
        navigate(`/customers/${id}`);
      } else {
        const res = await customerService.create(payload);
        toast.success('Customer created successfully!');
        navigate(`/customers/${res.data.data.id}`);
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const update = (field: keyof CustomerFormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  if (isLoading) return <LoadingState />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{isEdit ? 'Edit Customer' : 'New Customer'}</h1>
          <p className="page-subtitle">{isEdit ? 'Update customer information' : 'Add a new customer to your CRM'}</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 800 }}>
        <form onSubmit={handleSubmit} id="customer-form">
          {/* Basic Info */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="cust-name">Name <span className="required">*</span></label>
              <input id="cust-name" type="text" className={`form-input${errors.name ? ' error' : ''}`}
                placeholder="Customer name" value={form.name} onChange={e => update('name', e.target.value)} />
              {errors.name && <span className="form-error">⚠ {errors.name}</span>}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="cust-mobile">Mobile <span className="required">*</span></label>
              <input id="cust-mobile" type="tel" className={`form-input${errors.mobile ? ' error' : ''}`}
                placeholder="9876543210" value={form.mobile} onChange={e => update('mobile', e.target.value)} />
              {errors.mobile && <span className="form-error">⚠ {errors.mobile}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="cust-email">Email</label>
              <input id="cust-email" type="email" className={`form-input${errors.email ? ' error' : ''}`}
                placeholder="email@example.com" value={form.email} onChange={e => update('email', e.target.value)} />
              {errors.email && <span className="form-error">⚠ {errors.email}</span>}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="cust-business">Business Name</label>
              <input id="cust-business" type="text" className="form-input"
                placeholder="Business / company name" value={form.business_name} onChange={e => update('business_name', e.target.value)} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="cust-gst">GST Number</label>
              <input id="cust-gst" type="text" className={`form-input${errors.gst_number ? ' error' : ''}`}
                placeholder="27AABCU9603R1ZX" value={form.gst_number} onChange={e => update('gst_number', e.target.value.toUpperCase())} />
              {errors.gst_number && <span className="form-error">⚠ {errors.gst_number}</span>}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="cust-type">Customer Type <span className="required">*</span></label>
              <select id="cust-type" className="form-select" value={form.customer_type} onChange={e => update('customer_type', e.target.value)}>
                <option value="RETAIL">Retail</option>
                <option value="WHOLESALE">Wholesale</option>
                <option value="DISTRIBUTOR">Distributor</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="cust-status">Status <span className="required">*</span></label>
              <select id="cust-status" className="form-select" value={form.status} onChange={e => update('status', e.target.value)}>
                <option value="LEAD">Lead</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="cust-followup">Next Follow-up Date</label>
              <input id="cust-followup" type="date" className="form-input"
                value={form.follow_up_date} onChange={e => update('follow_up_date', e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="cust-address">Address</label>
            <textarea id="cust-address" className="form-textarea" rows={3}
              placeholder="Full address..." value={form.address} onChange={e => update('address', e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="cust-notes">Notes</label>
            <textarea id="cust-notes" className="form-textarea" rows={3}
              placeholder="Additional notes..." value={form.notes} onChange={e => update('notes', e.target.value)} />
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-border)' }}>
            <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isSaving} id="save-customer-btn">
              {isSaving ? <><div className="spinner" /> Saving...</> : isEdit ? 'Update Customer' : 'Create Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
