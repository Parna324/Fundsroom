import { useState, useEffect, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { productService } from '../services';
import { Product } from '../types';
import { LoadingState } from '../components';
import { getErrorMessage } from '../services/api';
import { useToast } from '../context/ToastContext';

interface ProductFormData {
  name: string; sku: string; category: string; unit_price: string;
  current_stock: string; minimum_stock: string; warehouse_location: string;
}

const INITIAL: ProductFormData = {
  name: '', sku: '', category: '', unit_price: '',
  current_stock: '0', minimum_stock: '0', warehouse_location: '',
};

export default function ProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState<ProductFormData>(INITIAL);
  const [errors, setErrors] = useState<Partial<ProductFormData>>({});
  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    productService.get(parseInt(id!, 10))
      .then(res => {
        const p: Product = res.data.data;
        setForm({
          name: p.name, sku: p.sku, category: p.category,
          unit_price: String(p.unit_price), current_stock: String(p.current_stock),
          minimum_stock: String(p.minimum_stock), warehouse_location: p.warehouse_location || '',
        });
      })
      .catch(err => toast.error(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, [id, isEdit]);

  const validate = (): boolean => {
    const errs: Partial<ProductFormData> = {};
    if (!form.name.trim())     errs.name = 'Name is required';
    if (!form.sku.trim())      errs.sku = 'SKU is required';
    if (!form.category.trim()) errs.category = 'Category is required';
    if (!form.unit_price || parseFloat(form.unit_price) < 0) errs.unit_price = 'Valid price required';
    if (parseInt(form.current_stock) < 0) errs.current_stock = 'Stock cannot be negative';
    if (parseInt(form.minimum_stock) < 0) errs.minimum_stock = 'Min stock cannot be negative';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSaving(true);
    try {
      const payload = {
        name: form.name, sku: form.sku, category: form.category,
        unit_price: parseFloat(form.unit_price),
        current_stock: parseInt(form.current_stock),
        minimum_stock: parseInt(form.minimum_stock),
        warehouse_location: form.warehouse_location || undefined,
      };
      if (isEdit) {
        await productService.update(parseInt(id!, 10), payload);
        toast.success('Product updated!');
      } else {
        await productService.create(payload);
        toast.success('Product created!');
      }
      navigate('/products');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const update = (field: keyof ProductFormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  if (isLoading) return <LoadingState />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{isEdit ? 'Edit Product' : 'New Product'}</h1>
          <p className="page-subtitle">{isEdit ? 'Update product details' : 'Add a product to the catalog'}</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 700 }}>
        <form onSubmit={handleSubmit} id="product-form">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="prod-name">Product Name <span className="required">*</span></label>
              <input id="prod-name" type="text" className={`form-input${errors.name ? ' error' : ''}`}
                placeholder="e.g. HP Laptop 15s" value={form.name} onChange={e => update('name', e.target.value)} />
              {errors.name && <span className="form-error">⚠ {errors.name}</span>}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="prod-sku">SKU <span className="required">*</span></label>
              <input id="prod-sku" type="text" className={`form-input${errors.sku ? ' error' : ''}`}
                placeholder="e.g. LAP-HP-001" value={form.sku}
                onChange={e => update('sku', e.target.value.toUpperCase())}
                style={{ fontFamily: 'var(--font-mono)' }} />
              {errors.sku && <span className="form-error">⚠ {errors.sku}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="prod-cat">Category <span className="required">*</span></label>
              <input id="prod-cat" type="text" list="categories-list" className={`form-input${errors.category ? ' error' : ''}`}
                placeholder="e.g. Electronics" value={form.category} onChange={e => update('category', e.target.value)} />
              <datalist id="categories-list">
                {['Electronics', 'Peripherals', 'Networking', 'Storage', 'Accessories'].map(c => <option key={c} value={c} />)}
              </datalist>
              {errors.category && <span className="form-error">⚠ {errors.category}</span>}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="prod-price">Unit Price (₹) <span className="required">*</span></label>
              <input id="prod-price" type="number" min="0" step="0.01" className={`form-input${errors.unit_price ? ' error' : ''}`}
                placeholder="0.00" value={form.unit_price} onChange={e => update('unit_price', e.target.value)} />
              {errors.unit_price && <span className="form-error">⚠ {errors.unit_price}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="prod-stock">Current Stock</label>
              <input id="prod-stock" type="number" min="0" className={`form-input${errors.current_stock ? ' error' : ''}`}
                value={form.current_stock} onChange={e => update('current_stock', e.target.value)} />
              {errors.current_stock && <span className="form-error">⚠ {errors.current_stock}</span>}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="prod-min">Minimum Stock (Alert threshold)</label>
              <input id="prod-min" type="number" min="0" className={`form-input${errors.minimum_stock ? ' error' : ''}`}
                value={form.minimum_stock} onChange={e => update('minimum_stock', e.target.value)} />
              {errors.minimum_stock && <span className="form-error">⚠ {errors.minimum_stock}</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="prod-loc">Warehouse Location</label>
            <input id="prod-loc" type="text" className="form-input"
              placeholder="e.g. A-01-01" value={form.warehouse_location}
              onChange={e => update('warehouse_location', e.target.value)}
              style={{ fontFamily: 'var(--font-mono)' }} />
            <span className="form-hint">Format: Section-Rack-Slot (e.g. A-01-02)</span>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-border)' }}>
            <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isSaving} id="save-product-btn">
              {isSaving ? <><div className="spinner" /> Saving...</> : isEdit ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
