import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerService, productService, challanService } from '../services';
import { Customer, Product } from '../types';
import { LoadingState } from '../components';
import { getErrorMessage } from '../services/api';
import { useToast } from '../context/ToastContext';

interface LineItem {
  product_id: number;
  product_name: string;
  sku: string;
  unit_price: number;
  available_stock: number;
  quantity: number;
}

export default function ChallanFormPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [items, setItems] = useState<LineItem[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      customerService.list({ limit: 100, status: 'ACTIVE' }),
      productService.list({ page: 1, limit: 200 }),
    ]).then(([cRes, pRes]) => {
      setCustomers(cRes.data.data);
      setProducts(pRes.data.data);
    }).catch(err => toast.error(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, []);

  const addProduct = (product: Product) => {
    if (items.some(i => i.product_id === product.id)) {
      toast.warning('Product already added. Update the quantity below.');
      return;
    }
    setItems(prev => [...prev, {
      product_id: product.id,
      product_name: product.name,
      sku: product.sku,
      unit_price: product.unit_price,
      available_stock: product.current_stock,
      quantity: 1,
    }]);
    setProductSearch('');
  };

  const updateQuantity = (idx: number, qty: number) => {
    setItems(prev => prev.map((item, i) =>
      i === idx ? { ...item, quantity: Math.max(1, qty) } : item
    ));
  };

  const removeItem = (idx: number) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const totalQty = items.reduce((sum, i) => sum + i.quantity, 0);

  const filteredCustomers = customers.filter(c =>
    !customerSearch ||
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    (c.business_name || '').toLowerCase().includes(customerSearch.toLowerCase())
  );

  const filteredProducts = products.filter(p =>
    productSearch &&
    (p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(productSearch.toLowerCase()))
  );

  const handleSave = async (asDraft: boolean) => {
    setError('');
    if (!selectedCustomerId) {
      setError('Please select a customer.');
      return;
    }
    if (items.length === 0) {
      setError('Please add at least one product.');
      return;
    }
    // Validate quantities
    for (const item of items) {
      if (item.quantity <= 0) {
        setError(`Invalid quantity for ${item.product_name}`);
        return;
      }
      if (!asDraft && item.quantity > item.available_stock) {
        setError(`Insufficient stock for ${item.product_name}. Available: ${item.available_stock}, Requested: ${item.quantity}`);
        return;
      }
    }

    setIsSaving(true);
    try {
      const res = await challanService.create({
        customer_id: parseInt(selectedCustomerId, 10),
        items: items.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
      });
      const challanId = res.data.data.id;

      if (!asDraft) {
        // Confirm immediately
        await challanService.confirm(challanId);
        toast.success('Challan created and confirmed! Stock has been deducted.');
      } else {
        toast.success('Challan saved as draft.');
      }
      navigate(`/challans/${challanId}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <LoadingState message="Loading form data..." />;

  const selectedCustomer = customers.find(c => c.id === parseInt(selectedCustomerId, 10));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Create Sales Challan</h1>
          <p className="page-subtitle">Select customer and products, then save as draft or confirm</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: 'var(--space-5)' }}>
          <span>⚠</span> {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
        {/* Left Column */}
        <div>
          {/* Customer Selection */}
          <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
            <div className="card-header">
              <h3 className="card-title">1. Select Customer</h3>
            </div>
            <div className="form-group">
              <input
                type="text"
                className="form-input"
                placeholder="Search customer..."
                value={customerSearch}
                onChange={e => setCustomerSearch(e.target.value)}
                id="customer-search-challan"
              />
            </div>
            <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {filteredCustomers.slice(0, 10).map(c => (
                <button
                  key={c.id}
                  type="button"
                  className={`btn ${selectedCustomerId === String(c.id) ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ justifyContent: 'flex-start', textAlign: 'left' }}
                  onClick={() => setSelectedCustomerId(String(c.id))}
                  id={`select-customer-${c.id}`}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>{c.name}</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>{c.business_name}</div>
                  </div>
                </button>
              ))}
              {filteredCustomers.length === 0 && (
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: 'var(--space-4)' }}>
                  No active customers found.
                </p>
              )}
            </div>
            {selectedCustomer && (
              <div style={{ marginTop: 'var(--space-3)', padding: 'var(--space-3)', background: 'rgba(99,102,241,0.08)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(99,102,241,0.2)' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-brand-500)' }}>
                  ✓ {selectedCustomer.name}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  {selectedCustomer.business_name} · {selectedCustomer.mobile}
                </div>
              </div>
            )}
          </div>

          {/* Product Search */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">2. Add Products</h3>
            </div>
            <div className="form-group">
              <input
                type="text"
                className="form-input"
                placeholder="Search products by name or SKU..."
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                id="product-search-challan"
              />
            </div>
            {productSearch && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', maxHeight: 250, overflowY: 'auto' }}>
                {filteredProducts.slice(0, 8).map(p => (
                  <button
                    key={p.id}
                    type="button"
                    className="btn btn-secondary"
                    style={{ justifyContent: 'space-between' }}
                    onClick={() => addProduct(p)}
                    id={`add-product-${p.id}`}
                  >
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{p.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {p.sku}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '0.8rem', color: p.current_stock <= p.minimum_stock ? 'var(--color-danger)' : 'var(--color-success)' }}>
                        Stock: {p.current_stock}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                        + Add
                      </div>
                    </div>
                  </button>
                ))}
                {filteredProducts.length === 0 && (
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: 'var(--space-3)' }}>
                    No products found.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column — Items */}
        <div>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">3. Review Items</h3>
              {items.length > 0 && (
                <span className="badge badge-info">{items.length} product{items.length !== 1 ? 's' : ''}</span>
              )}
            </div>

            {items.length === 0 ? (
              <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-3)' }}>📦</div>
                <p>Search and add products on the left.</p>
              </div>
            ) : (
              <div>
                <div className="challan-items-table">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Avail.</th>
                        <th style={{ width: 100 }}>Qty</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, idx) => {
                        const overStock = item.quantity > item.available_stock;
                        return (
                          <tr key={item.product_id}>
                            <td>
                              <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>{item.product_name}</div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                                {item.sku}
                              </div>
                            </td>
                            <td style={{ fontSize: '0.8rem', color: item.available_stock <= 5 ? 'var(--color-danger)' : 'var(--color-text-muted)' }}>
                              {item.available_stock}
                            </td>
                            <td>
                              <input
                                type="number"
                                min="1"
                                max={item.available_stock}
                                value={item.quantity}
                                onChange={e => updateQuantity(idx, parseInt(e.target.value) || 1)}
                                className={`form-input${overStock ? ' error' : ''}`}
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
                                id={`qty-${item.product_id}`}
                              />
                              {overStock && (
                                <div style={{ fontSize: '0.65rem', color: 'var(--color-danger)' }}>Exceeds stock!</div>
                              )}
                            </td>
                            <td>
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={() => removeItem(idx)}
                                style={{ color: 'var(--color-danger)', padding: '0.25rem 0.5rem' }}
                                id={`remove-item-${item.product_id}`}
                              >
                                ×
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Total */}
                <div className="challan-total-row">
                  <span className="challan-total-label">Total Quantity:</span>
                  <span className="challan-total-value">{totalQty} units</span>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
                  <button
                    className="btn btn-secondary"
                    style={{ flex: 1 }}
                    onClick={() => handleSave(true)}
                    disabled={isSaving}
                    id="save-draft-btn"
                  >
                    {isSaving ? <div className="spinner" /> : '💾 Save Draft'}
                  </button>
                  <button
                    className="btn btn-success"
                    style={{ flex: 1 }}
                    onClick={() => handleSave(false)}
                    disabled={isSaving}
                    id="confirm-challan-btn"
                  >
                    {isSaving ? <div className="spinner" /> : '✓ Confirm Challan'}
                  </button>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 'var(--space-3)', textAlign: 'center' }}>
                  Confirming will deduct stock and create OUT movements.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
