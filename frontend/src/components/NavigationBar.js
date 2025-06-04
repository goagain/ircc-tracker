import React from 'react';
import { Navbar, Nav, NavDropdown, Container } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';

const NavigationBar = ({ user, onLogout }) => {
  return (
    <Navbar bg="light" expand="lg" className="shadow-sm">
      <Container>
        <LinkContainer to="/">
          <Navbar.Brand>
            <span className="canada-flag">🍁</span>
            IRCC Tracker
          </Navbar.Brand>
        </LinkContainer>
        
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            {user && (
              <>
                <LinkContainer to="/dashboard">
                  <Nav.Link>Dashboard</Nav.Link>
                </LinkContainer>
                <LinkContainer to="/credentials/new">
                  <Nav.Link>Add Credentials</Nav.Link>
                </LinkContainer>
                {user.role === 'admin' && (
                  <LinkContainer to="/admin">
                    <Nav.Link>Admin Panel</Nav.Link>
                  </LinkContainer>
                )}
              </>
            )}
          </Nav>
          
          <Nav>
            {user ? (
              <NavDropdown title={`Welcome, ${user.email}`} id="user-nav-dropdown">
                <NavDropdown.Item href="#" onClick={onLogout}>
                  <i className="bi bi-box-arrow-right me-2"></i>
                  Logout
                </NavDropdown.Item>
              </NavDropdown>
            ) : (
              <>
                <LinkContainer to="/login">
                  <Nav.Link>Login</Nav.Link>
                </LinkContainer>
                <LinkContainer to="/register">
                  <Nav.Link>Register</Nav.Link>
                </LinkContainer>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavigationBar; 