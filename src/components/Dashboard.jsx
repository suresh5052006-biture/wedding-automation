import { useState } from 'react';
import { useWeddings } from '../hooks/useWeddings';
import { useAuth } from '../hooks/useAuth';

export default function Dashboard() {
  const { planner, logout } = useAuth();
  const { weddings, loading, addWedding, deleteWedding } = useWeddings(planner?.id);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    coupleName: '',
    weddingDate: '',
    venue: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await addWedding({
      ...formData,
      weddingDate: new Date(formData.weddingDate).toISOString()
    });
    setFormData({ coupleName: '', weddingDate: '', venue: '' });
    setShowForm(false);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getVendorCount = (wedding) => {
    return wedding.vendorCount || 0;
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="dashboard">
      <header>
        <div>
          <h1>Wedding Planner Dashboard</h1>
          <p>Welcome, {planner?.name}</p>
        </div>
        <button onClick={logout} className="btn-secondary">Logout</button>
      </header>

      <div className="dashboard-content">
        <div className="section-header">
          <h2>Your Weddings ({weddings.length})</h2>
          <button onClick={() => setShowForm(true)} className="btn-primary">
            + Add Wedding
          </button>
        </div>

        {showForm && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>Add New Wedding</h3>
              <form onSubmit={handleSubmit}>
                <input
                  type="text"
                  name="coupleName"
                  placeholder="Couple Name (e.g., Rahul & Priya)"
                  value={formData.coupleName}
                  onChange={handleChange}
                  required
                />
                <input
                  type="date"
                  name="weddingDate"
                  value={formData.weddingDate}
                  onChange={handleChange}
                  required
                />
                <input
                  type="text"
                  name="venue"
                  placeholder="Venue"
                  value={formData.venue}
                  onChange={handleChange}
                  required
                />
                <div className="modal-actions">
                  <button type="button" onClick={() => setShowForm(false)}>Cancel</button>
                  <button type="submit" className="btn-primary">Add Wedding</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {weddings.length === 0 ? (
          <div className="empty-state">
            <p>No weddings yet. Add your first wedding to get started.</p>
          </div>
        ) : (
          <div className="weddings-grid">
            {weddings.map(wedding => (
              <a
                key={wedding.id}
                href={`/wedding/${wedding.id}`}
                className="wedding-card"
              >
                <div className="wedding-header">
                  <h3>{wedding.coupleName}</h3>
                  <span className={`status ${new Date(wedding.weddingDate) > new Date() ? 'upcoming' : 'past'}`}>
                    {new Date(wedding.weddingDate) > new Date() ? 'Upcoming' : 'Past'}
                  </span>
                </div>
                <div className="wedding-details">
                  <p><strong>Date:</strong> {formatDate(wedding.weddingDate)}</p>
                  <p><strong>Venue:</strong> {wedding.venue}</p>
                  <p><strong>Vendors:</strong> {getVendorCount(wedding)}</p>
                </div>
                <div className="wedding-actions">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (confirm('Delete this wedding?')) {
                        deleteWedding(wedding.id);
                      }
                    }}
                    className="btn-danger btn-sm"
                  >
                    Delete
                  </button>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
