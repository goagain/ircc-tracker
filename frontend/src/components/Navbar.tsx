import React from 'react';
import { Navbar as BootstrapNavbar, Container, Nav, NavDropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { User, UserRole } from '../types/user';

interface NavigationBarProps {
  user: User | null;
  onLogout: () => void;
}

const Navbar: React.FC<NavigationBarProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = (): void => {
    onLogout();
    navigate('/login');
  };

  return (
    <BootstrapNavbar bg="light" expand="lg" className="border-bottom">
      <Container>
        <BootstrapNavbar.Brand as={Link} to="/">
          <span className="canada-flag">🍁</span> IRCC Tracker
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
            <Nav className="ms-auto">
              <Nav.Link as={Link} to="/login">Login</Nav.Link>
              <Nav.Link as={Link} to="/register">Register</Nav.Link>
            </Nav>
          )}
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  );
};

export default Navbar;