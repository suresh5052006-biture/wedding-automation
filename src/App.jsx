import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import WeddingDetail from './components/WeddingDetail';
import PaymentView from './components/PaymentView';
import './index.css';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/wedding/:weddingId" element={<WeddingDetail />} />
        <Route path="/wedding/:weddingId/payments" element={<PaymentView />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
