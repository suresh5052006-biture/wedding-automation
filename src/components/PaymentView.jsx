import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWeddings } from '../hooks/useWeddings';
import { useVendors } from '../hooks/useVendors';
import { useAuth } from '../hooks/useAuth';

export default function PaymentView() {
  const { weddingId } = useParams();
  const navigate = useNavigate();
  const { planner } = useAuth();
  const { weddings } = useWeddings(planner?.id);
  const { vendors, updateVendor } = useVendors(weddingId);

  const [wedding, setWedding] = useState(null);
  const [allPayments, setAllPayments] = useState([]);

  useEffect(() => {
    const found = weddings.find(w => w.id === weddingId);
    setWedding(found);
  }, [weddings, weddingId]);

  useEffect(() => {
    const payments = [];
    vendors.forEach(vendor => {
      (vendor.payments || []).forEach((payment, index) => {
        payments.push({
          ...payment,
          vendorId: vendor.id,
          vendorName: vendor.name,
          vendorPhone: vendor.phone,
          paymentIndex: index
        });
      });
    });

    // Sort by due date
    payments.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    setAllPayments(payments);
  }, [vendors]);

  const markAsPaid = async (vendorId, paymentIndex) => {
    const vendor = vendors.find(v => v.id === vendorId);
    const updatedPayments = [...vendor.payments];
    updatedPayments[paymentIndex] = {
      ...updatedPayments[paymentIndex],
      status: 'paid'
    };
    await updateVendor(vendorId, { payments: updatedPayments });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getDaysUntil = (dateString) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(dateString);
    targetDate.setHours(0, 0, 0, 0);
    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getPaymentClass = (payment) => {
    if (payment.status === 'paid') return 'paid';
    const daysUntil = getDaysUntil(payment.dueDate);
    if (daysUntil < 0) return 'overdue';
    if (daysUntil <= 3) return 'urgent';
    return 'pending';
  };

  const totalPending = allPayments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPaid = allPayments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);

  if (!wedding) return <div className="loading">Loading...</div>;

  return (
    <div className="payment-view">
      <header>
        <button onClick={() => navigate(`/wedding/${weddingId}`)} className="btn-back">← Back to Wedding</button>
        <div className="wedding-info">
          <h1>Payments - {wedding.coupleName}</h1>
        </div>
      </header>

      <div className="payment-summary">
        <div className="summary-card">
          <h3>Total Pending</h3>
          <p className="amount pending">₹{totalPending.toLocaleString()}</p>
        </div>
        <div className="summary-card">
          <h3>Total Paid</h3>
          <p className="amount paid">₹{totalPaid.toLocaleString()}</p>
        </div>
        <div className="summary-card">
          <h3>Upcoming (3 days)</h3>
          <p className="amount urgent">
            {allPayments.filter(p => p.status === 'pending' && getDaysUntil(p.dueDate) <= 3 && getDaysUntil(p.dueDate) >= 0).length}
          </p>
        </div>
      </div>

      <div className="payments-table-container">
        {allPayments.length === 0 ? (
          <div className="empty-state">
            <p>No payment milestones added yet.</p>
          </div>
        ) : (
          <table className="payments-table">
            <thead>
              <tr>
                <th>Vendor</th>
                <th>Milestone</th>
                <th>Amount</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {allPayments.map((payment, i) => (
                <tr key={`${payment.vendorId}-${payment.paymentIndex}`} className={getPaymentClass(payment)}>
                  <td>
                    <strong>{payment.vendorName}</strong>
                    <br />
                    <span className="phone">{payment.vendorPhone}</span>
                  </td>
                  <td className="capitalize">{payment.milestone}</td>
                  <td>₹{payment.amount.toLocaleString()}</td>
                  <td>
                    {formatDate(payment.dueDate)}
                    {payment.status === 'pending' && (
                      <span className="days-until">
                        {getDaysUntil(payment.dueDate) < 0
                          ? `${Math.abs(getDaysUntil(payment.dueDate))} days overdue`
                          : getDaysUntil(payment.dueDate) === 0
                            ? 'Due today'
                            : `${getDaysUntil(payment.dueDate)} days left`}
                      </span>
                    )}
                  </td>
                  <td>
                    <span className={`status-badge ${payment.status}`}>
                      {payment.status}
                    </span>
                  </td>
                  <td>
                    {payment.status === 'pending' && (
                      <button
                        onClick={() => markAsPaid(payment.vendorId, payment.paymentIndex)}
                        className="btn-primary btn-sm"
                      >
                        Mark Paid
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
