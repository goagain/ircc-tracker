import React, { useEffect, useState } from 'react';
import { Navbar as BootstrapNavbar, Container, Nav, NavDropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { User, UserRole } from '../types/user';

interface NavigationBarProps {
  user: User | null;
  onLogout: () => void;
}

const Navbar: React.FC<NavigationBarProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [starCount, setStarCount] = useState<number | null>(null);

  useEffect(() => {
    const fetchStarCount = async () => {
      try {
        const response = await fetch('https://api.github.com/repos/goagain/ircc-tracker');
        const data = await response.json();
        setStarCount(data.stargazers_count);
      } catch (error) {
        console.error('Failed to fetch GitHub stars:', error);
      }
    };

    fetchStarCount();
  }, []);

  const handleLogout = (): void => {
    onLogout();
    navigate('/login');
  };

  const GitHubStarButton = () => (
    <Nav.Link
      href="https://github.com/goagain/ircc-tracker"
      target="_blank"
      rel="noopener noreferrer"
      className="d-flex align-items-center"
      style={{
        background: '#f8f9fa',
        borderRadius: '6px',
        padding: '4px 12px',
        marginRight: '8px',
        border: '1px solid #e9ecef'
      }}
    >
      <svg
        height="16"
        width="16"
        viewBox="0 0 16 16"
        fill="currentColor"
        style={{ marginRight: '4px' }}
      >
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
      </svg>
      {starCount !== null && (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          background: '#e9ecef',
          borderRadius: '12px',
          padding: '0 8px',
          fontSize: '0.875rem',
          color: '#495057'
        }}>
          <svg
            height="14"
            width="14"
            viewBox="0 0 24 24"
            fill="currentColor"
            style={{ marginRight: '2px' }}
          >
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
          {starCount}
        </span>
      )}
    </Nav.Link>
  );

  const BuyMeACoffeeButton = () => (
    <Nav.Link
      href="https://www.buymeacoffee.com/goagain"
      target="_blank"
      rel="noopener noreferrer"
      style={{ padding: 0, marginRight: '8px', height: '40px' }}
    >
      <img src="https://cdn.buymeacoffee.com/buttons/v2/arial-blue.png" alt="Buy Me A Coffee" style={{ height: '40px' }} />
    </Nav.Link>
  );

  return (
    <BootstrapNavbar bg="light" expand="lg" className="border-bottom">
      <Container>
        <BootstrapNavbar.Brand as={Link} to="/">
          <span className="canada-flag">🍁</span> Goagain's IRCC Tracker
        </BootstrapNavbar.Brand>
        <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />
        <BootstrapNavbar.Collapse id="basic-navbar-nav">
          {user ? (
            <>
              <Nav className="me-auto">
                <Nav.Link as={Link} to="/dashboard">Dashboard</Nav.Link>
                <Nav.Link as={Link} to="/credentials/new">Add Credential</Nav.Link>
                {user.role === UserRole.ADMIN && (
                  <Nav.Link as={Link} to="/admin">Admin</Nav.Link>
                )}
              </Nav>
              <Nav>
                <BuyMeACoffeeButton />
                <GitHubStarButton />
                <NavDropdown title={user.email} id="basic-nav-dropdown" align="end">
                  <NavDropdown.Item as={Link} to="/change-password">
                    Change Password
                  </NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={handleLogout}>
                    Logout
                  </NavDropdown.Item>
                </NavDropdown>
              </Nav>
            </>
          ) : (
            <>
              <Nav className="me-auto">
                <Nav.Link as={Link} to="/demo">Demo</Nav.Link>
              </Nav>
              <Nav className="ms-auto">
                <BuyMeACoffeeButton />
                <GitHubStarButton />
                <Nav.Link as={Link} to="/login">Login</Nav.Link>
                <Nav.Link as={Link} to="/register">Register</Nav.Link>
              </Nav>
            </>
          )}
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  );
};

export default Navbar;