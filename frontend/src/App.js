import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Container } from 'react-bootstrap';

// Import components
import NavigationBar from './components/NavigationBar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import CredentialForm from './pages/CredentialForm';
import ProtectedRoute from './components/ProtectedRoute';

// Import services
import authService from './services/authService';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check token stored locally
    const token = localStorage.getItem('token');
    if (token) {
      authService.verifyToken(token)
        .then(response => {
          if (response.data.valid) {
            setUser(response.data.user);
          } else {
            localStorage.removeItem('token');
          }
        })
        .catch(error => {
          console.error('Token verification failed:', error);
          localStorage.removeItem('token');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = (userData, token) => {
    setUser(userData);
    localStorage.setItem('token', token);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App d-flex flex-column min-vh-100">
        <NavigationBar user={user} onLogout={handleLogout} />
        
        <main className="flex-grow-1">
          <Routes>
            {/* Public routes */}
            <Route 
              path="/" 
              element={user ? <Navigate to="/dashboard" replace /> : <Home />} 
            />
            <Route 
              path="/login" 
              element={user ? <Navigate to="/dashboard" replace /> : <Login onLogin={handleLogin} />} 
            />
            <Route 
              path="/register" 
              element={user ? <Navigate to="/dashboard" replace /> : <Register />} 
            />
            
            {/* Protected routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute user={user}>
                  <Dashboard user={user} />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/credentials/new"
              element={
                <ProtectedRoute user={user}>
                  <CredentialForm user={user} />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/credentials/edit/:credentialId"
              element={
                <ProtectedRoute user={user}>
                  <CredentialForm user={user} />
                </ProtectedRoute>
              }
            />
            
            {/* Admin routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute user={user} requireAdmin={true}>
                  <AdminDashboard user={user} />
                </ProtectedRoute>
              }
            />
            
            {/* 404 route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        
        <Footer />
      </div>
    </Router>
  );
}

// 404 page component
const NotFound = () => (
  <Container className="text-center py-5">
    <h1 className="display-1">404</h1>
    <h2>Page Not Found</h2>
    <p className="lead">Sorry, the page you are looking for does not exist.</p>
    <a href="/" className="btn btn-primary">Back to Home</a>
  </Container>
);

// Footer component
const Footer = () => (
  <footer className="footer">
    <Container>
      <div className="row">
        <div className="col-md-6">
          <h5>IRCC Tracker</h5>
          <p className="mb-0">Keep you informed about your Canadian immigration application progress</p>
        </div>
        <div className="col-md-6 text-md-end">
          <p className="mb-0">
            © 2024 IRCC Tracker. All rights reserved.
          </p>
        </div>
      </div>
    </Container>
  </footer>
);

export default App; 