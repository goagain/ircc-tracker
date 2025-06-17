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
import tokenService from './services/tokenService';
import configService from './services/configService';
import { User } from './types/user';
import GoogleAnalytics from './components/GoogleAnalytics';
import Demo from './pages/Demo';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import { Link } from 'react-router-dom';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  }
});

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [configError, setConfigError] = useState<string | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // load token and config in parallel
        const [token] = await Promise.all([
          tokenService.getToken(),
          configService.getConfig().catch(error => {
            console.error('Failed to load config:', error);
            setConfigError('Failed to load config, please refresh the page');
          })
        ]);

        if (token) {
          try {
            const response = await authService.verifyToken(token);
            if (response.data.valid && response.data.user) {
              setUser(response.data.user);
            } else {
              tokenService.removeToken();
            }
          } catch (error) {
            console.error('Token verification failed:', error);
            tokenService.removeToken();
          }
        }
      } catch (error) {
        console.error('App initialization failed:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
  }, []);

  const handleLogin = (userData: User, token: string): void => {
    setUser(userData);
    tokenService.setToken(token);
  };

  const handleLogout = (): void => {
    setUser(null);
    tokenService.removeToken();
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

  if (configError) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="alert alert-danger" role="alert">
          {configError}
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <GoogleAnalytics />
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
                <Route path="/demo" element={<Demo />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />

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
                    <ProtectedRoute user={user} requireAdmin>
                      {user && <AdminDashboard user={user} />}
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/demo"
                  element={<Demo />}
                />

                {/* 404 route */}
                <Route path="*" element={<Navigate to="/" replace />} />
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
  <footer className="footer mt-auto py-3 bg-light">
    <Container>
      <div className="row">
        <div className="col-md-6">
          <h5>Goagain's IRCC Tracker</h5>
          <p className="mb-0">Keep you informed about your Canadian immigration application progress</p>
        </div>
        <div className="col-md-6 text-md-end">
          <p className="mb-0">
            © 2024 Goagain's IRCC Tracker. All rights reserved.
          </p>
          <div className="mt-2">
            <Link to="/privacy" className="text-decoration-none me-3">Privacy Policy</Link>
            <Link to="/terms" className="text-decoration-none">Terms of Service</Link>
          </div>
        </div>
      </div>
    </Container>
  </footer>
);

export default App; 