import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ChangePassword from './components/ChangePassword';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import AdminDashboard from './pages/AdminDashboard';
import CredentialForm from './pages/CredentialForm';
import ProtectedRoute from './components/ProtectedRoute';
import authService from './services/authService';
import { User } from './types/user';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check token stored locally
    const token = localStorage.getItem('token');
    if (token) {
      authService.verifyToken(token)
        .then(response => {
          if (response.data.valid && response.data.user) {
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

  const handleLogin = (userData: User, token: string): void => {
    setUser(userData);
    localStorage.setItem('token', token);
  };

  const handleLogout = (): void => {
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
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <div className="App d-flex flex-column min-vh-100">
            <Navbar user={user} onLogout={handleLogout} />
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
                      {user && <Dashboard user={user} />}
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/change-password"
                  element={
                    <ProtectedRoute user={user}>
                      <ChangePassword />
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/credentials/new"
                  element={
                    <ProtectedRoute user={user}>
                      {user && <CredentialForm user={user} />}
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/credentials/edit/:credentialId"
                  element={
                    <ProtectedRoute user={user}>
                      {user && <CredentialForm user={user} />}
                    </ProtectedRoute>
                  }
                />
                
                {/* Admin routes */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute user={user} requireAdmin={true}>
                      {user && <AdminDashboard user={user} />}
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
      </AuthProvider>
    </ThemeProvider>
  );
};

// 404 page component
const NotFound: React.FC = () => (
  <Container className="text-center py-5">
    <h1 className="display-1">404</h1>
    <h2>Page Not Found</h2>
    <p className="lead">Sorry, the page you are looking for does not exist.</p>
    <a href="/" className="btn btn-primary">Back to Home</a>
  </Container>
);

// Footer component
const Footer: React.FC = () => (
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