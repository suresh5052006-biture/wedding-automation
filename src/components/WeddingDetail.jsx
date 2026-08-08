import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWeddings } from '../hooks/useWeddings';
import { useVendors } from '../hooks/useVendors';
import { useConflictDetection } from '../hooks/useConflictDetection';
import { useAuth } from '../hooks/useAuth';

const CATEGORIES = ['caterer', 'decorator', 'photographer', 'band', 'florist', 'makeup', 'mehendi', 'dj', 'other'];
const MILESTONES = ['advance', 'midway', 'final'];

export default function WeddingDetail() {
  const { weddingId } = useParams();
  const navigate = useNavigate();
  const { planner } = useAuth();
  const { weddings } = useWeddings(planner?.id);
  const { vendors, addVendor, updateVendor, deleteVendor } = useVendors(weddingId);
  const { conflicts, checkConflicts } = useConflictDetection(planner?.id);

  const [wedding, setWedding] = useState(null);
  const [showVendorForm, setShowVendorForm] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [vendorForm, setVendorForm] = useState({
    name: '',
    category: 'caterer',
    phone: '',
    status: 'pending',
    slots: [],
    payments: [],
    notes: ''
  });
  const [slotForm, setSlotForm] = useState({ eventName: '', start: '', end: '' });
  const [paymentForm, setPaymentForm] = useState({ milestone: 'advance', amount: '', dueDate: '', status: 'pending' });

  useEffect(() => {
    const found = weddings.find(w => w.id === weddingId);
    setWedding(found);
  }, [weddings, weddingId]);

  const handleVendorSubmit = async (e) => {
    e.preventDefault();

    // Check for conflicts before saving
    if (vendorForm.slots.length > 0) {
      const foundConflicts = await checkConflicts(
        vendorForm.phone,
        vendorForm.slots,
        weddingId
      );

      if (foundConflicts.length > 0) {
        if (!confirm(`Warning: ${foundConflicts.length} conflict(s) detected with other weddings. Save anyway?`)) {
          return;
        }
      }
    }

    if (editingVendor) {
      await updateVendor(editingVendor.id, vendorForm);
    } else {
      await addVendor(vendorForm);
    }

    resetVendorForm();
  };

  const resetVendorForm = () => {
    setVendorForm({
      name: '',
      category: 'caterer',
      phone: '',
      status: 'pending',
      slots: [],
      payments: [],
      notes: ''
    });
    setSlotForm({ eventName: '', start: '', end: '' });
    setPaymentForm({ milestone: 'advance', amount: '', dueDate: '', status: 'pending' });
    setShowVendorForm(false);
    setEditingVendor(null);
  };

  const addSlot = () => {
    if (!slotForm.eventName || !slotForm.start || !slotForm.end) return;
    const newSlots = [...vendorForm.slots, {
      ...slotForm,
      start: new Date(slotForm.start).toISOString(),
      end: new Date(slotForm.end).toISOString()
    }];
    setVendorForm({ ...vendorForm, slots: newSlots });
    setSlotForm({ eventName: '', start: '', end: '' });
  };

  const removeSlot = (index) => {
    const newSlots = vendorForm.slots.filter((_, i) => i !== index);
    setVendorForm({ ...vendorForm, slots: newSlots });
  };

  const addPayment = () => {
    if (!paymentForm.amount || !paymentForm.dueDate) return;
    const newPayments = [...vendorForm.payments, {
      ...paymentForm,
      amount: parseFloat(paymentForm.amount),
      dueDate: new Date(paymentForm.dueDate).toISOString()
    }];
    setVendorForm({ ...vendorForm, payments: newPayments });
    setPaymentForm({ milestone: 'advance', amount: '', dueDate: '', status: 'pending' });
  };

  const removePayment = (index) => {
    const newPayments = vendorForm.payments.filter((_, i) => i !== index);
    setVendorForm({ ...vendorForm, payments: newPayments });
  };

  const editVendor = (vendor) => {
    setVendorForm({
      name: vendor.name,
      category: vendor.category,
      phone: vendor.phone,
      status: vendor.status,
      slots: vendor.slots || [],
      payments: vendor.payments || [],
      notes: vendor.notes || ''
    });
    setEditingVendor(vendor);
    setShowVendorForm(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!wedding) return <div className="loading">Loading...</div>;

  return (
    <div className="wedding-detail">
      <header>
        <button onClick={() => navigate('/')} className="btn-back">← Back</button>
        <div className="wedding-info">
          <h1>{wedding.coupleName}</h1>
          <p>{formatDate(wedding.weddingDate)} • {wedding.venue}</p>
        </div>
        <button onClick={() => navigate(`/wedding/${weddingId}/payments`)} className="btn-secondary">
          View Payments
        </button>
      </header>

      {conflicts.length > 0 && (
        <div className="conflict-banner">
          <strong>⚠️ Conflicts Detected</strong>
          <ul>
            {conflicts.map((conflict, i) => (
              <li key={i}>
                {conflict.vendorName} ({conflict.vendorPhone}) is double-booked with {conflict.weddingName}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="section-header">
        <h2>Vendors ({vendors.length})</h2>
        <button onClick={() => setShowVendorForm(true)} className="btn-primary">
          + Add Vendor
        </button>
      </div>

      {showVendorForm && (
        <div className="modal-overlay">
          <div className="modal vendor-form">
            <h3>{editingVendor ? 'Edit Vendor' : 'Add Vendor'}</h3>
            <form onSubmit={handleVendorSubmit}>
              <div className="form-row">
                <input
                  type="text"
                  placeholder="Vendor Name"
                  value={vendorForm.name}
                  onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })}
                  required
                />
                <select
                  value={vendorForm.category}
                  onChange={(e) => setVendorForm({ ...vendorForm, category: e.target.value })}
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={vendorForm.phone}
                  onChange={(e) => setVendorForm({ ...vendorForm, phone: e.target.value })}
                  required
                />
                <select
                  value={vendorForm.status}
                  onChange={(e) => setVendorForm({ ...vendorForm, status: e.target.value })}
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <textarea
                placeholder="Notes"
                value={vendorForm.notes}
                onChange={(e) => setVendorForm({ ...vendorForm, notes: e.target.value })}
              />

              <div className="form-section">
                <h4>Event Slots</h4>
                {vendorForm.slots.length > 0 && (
                  <div className="slots-list">
                    {vendorForm.slots.map((slot, i) => (
                      <div key={i} className="slot-item">
                        <span>{slot.eventName} - {formatDateTime(slot.start)}</span>
                        <button type="button" onClick={() => removeSlot(i)} className="btn-sm">×</button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="form-row">
                  <input
                    type="text"
                    placeholder="Event Name (e.g., Mehendi)"
                    value={slotForm.eventName}
                    onChange={(e) => setSlotForm({ ...slotForm, eventName: e.target.value })}
                  />
                  <input
                    type="datetime-local"
                    value={slotForm.start}
                    onChange={(e) => setSlotForm({ ...slotForm, start: e.target.value })}
                  />
                  <input
                    type="datetime-local"
                    value={slotForm.end}
                    onChange={(e) => setSlotForm({ ...slotForm, end: e.target.value })}
                  />
                </div>
                <button type="button" onClick={addSlot} className="btn-secondary btn-sm">+ Add Slot</button>
              </div>

              <div className="form-section">
                <h4>Payment Milestones</h4>
                {vendorForm.payments.length > 0 && (
                  <div className="payments-list">
                    {vendorForm.payments.map((payment, i) => (
                      <div key={i} className="payment-item">
                        <span>₹{payment.amount} - {payment.milestone} ({formatDate(payment.dueDate)})</span>
                        <button type="button" onClick={() => removePayment(i)} className="btn-sm">×</button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="form-row">
                  <select
                    value={paymentForm.milestone}
                    onChange={(e) => setPaymentForm({ ...paymentForm, milestone: e.target.value })}
                  >
                    {MILESTONES.map(m => (
                      <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Amount (₹)"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  />
                  <input
                    type="date"
                    value={paymentForm.dueDate}
                    onChange={(e) => setPaymentForm({ ...paymentForm, dueDate: e.target.value })}
                  />
                </div>
                <button type="button" onClick={addPayment} className="btn-secondary btn-sm">+ Add Payment</button>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={resetVendorForm}>Cancel</button>
                <button type="submit" className="btn-primary">
                  {editingVendor ? 'Update Vendor' : 'Add Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {vendors.length === 0 ? (
        <div className="empty-state">
          <p>No vendors added yet. Add your first vendor to start tracking.</p>
        </div>
      ) : (
        <div className="vendors-list">
          {vendors.map(vendor => (
            <div key={vendor.id} className={`vendor-card status-${vendor.status}`}>
              <div className="vendor-header">
                <div>
                  <h3>{vendor.name}</h3>
                  <span className="category">{vendor.category}</span>
                </div>
                <span className={`status-badge ${vendor.status}`}>{vendor.status}</span>
              </div>
              <div className="vendor-details">
                <p><strong>Phone:</strong> {vendor.phone}</p>
                {vendor.slots?.length > 0 && (
                  <div>
                    <strong>Slots:</strong>
                    <ul>
                      {vendor.slots.map((slot, i) => (
                        <li key={i}>{slot.eventName} - {formatDateTime(slot.start)}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {vendor.payments?.length > 0 && (
                  <p><strong>Payments:</strong> {vendor.payments.length} milestone(s)</p>
                )}
                {vendor.notes && <p className="notes"><strong>Notes:</strong> {vendor.notes}</p>}
              </div>
              <div className="vendor-actions">
                <button onClick={() => editVendor(vendor)} className="btn-secondary btn-sm">Edit</button>
                <button
                  onClick={() => {
                    if (confirm('Delete this vendor?')) {
                      deleteVendor(vendor.id);
                    }
                  }}
                  className="btn-danger btn-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
