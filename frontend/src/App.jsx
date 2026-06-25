import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Categories from './pages/Categories';
import Services from './pages/Services';
import Requests from './pages/Requests';
import PublicCatalog from './pages/PublicCatalog';
import Banners from './pages/Banners';
import Profile from './pages/Profile';

function ProtectedRoute({ children }) {
    const token = localStorage.getItem('token');
    if (!token) return <Navigate to="/login" replace />;
    return children;
}

function App() {
    return (
        <Router>
            <Routes>
                {/* Auth */}
                <Route path="/" element={<Navigate to="/login" />} />
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />

                {/* Admin Panel (protected) */}
                <Route path="/admin/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/admin/categories" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
                <Route path="/admin/services" element={<ProtectedRoute><Services /></ProtectedRoute>} />
                <Route path="/admin/requests" element={<ProtectedRoute><Requests /></ProtectedRoute>} />
                <Route path="/admin/banners" element={<ProtectedRoute><Banners /></ProtectedRoute>} />
                <Route path="/admin/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

                {/* Public Customer Pages (no auth) */}
                <Route path="/s/:slug" element={<PublicCatalog />} />
                <Route path="/shop/:providerId" element={<PublicCatalog />} />

                {/* Legacy redirects */}
                <Route path="/dashboard" element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="/categories" element={<Navigate to="/admin/categories" replace />} />
                <Route path="/services" element={<Navigate to="/admin/services" replace />} />
                <Route path="/requests" element={<Navigate to="/admin/requests" replace />} />
                <Route path="/banners" element={<Navigate to="/admin/banners" replace />} />
                <Route path="/profile" element={<Navigate to="/admin/profile" replace />} />
                <Route path="/services/:slug" element={<Navigate to="/s/:slug" replace />} />
                <Route path="/public/:providerId" element={<Navigate to="/shop/:providerId" replace />} />
            </Routes>
        </Router>
    );
}

export default App;
