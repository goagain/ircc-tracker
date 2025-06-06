import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  return (
    <>
      {/* Hero Section */}
      <section className="hero-section">
        <Container>
          <Row className="align-items-center">
            <Col lg={6}>
              <h1 className="display-4 fw-bold mb-4">
                <span className="canada-flag">🍁</span>
                IRCC Tracker
              </h1>
              <p className="lead mb-4">
                Automatically track your Canadian immigration application status and receive timely update notifications for a worry-free immigration journey.
              </p>
              <div className="d-grid gap-2 d-md-flex">
                <Link to="/register" className="btn btn-primary btn-lg me-md-2">
                  Get Started
                </Link>
                <Link to="/login" className="btn btn-outline-light btn-lg">
                  Already have an account? Login
                </Link>
              </div>
            </Col>
            <Col lg={6} className="text-center">
              <div className="display-1 text-white-50">
                📊📧🔒
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Features Section */}
      <Container className="py-5">
        <Row className="text-center mb-5">
          <Col>
            <h2 className="display-5 fw-bold text-primary">Features</h2>
            <p className="lead text-muted">
              Comprehensive IRCC application status tracking services
            </p>
          </Col>
        </Row>

        <Row className="g-4">
          <Col md={4}>
            <Card className="h-100 feature-card border-0 shadow-sm">
              <Card.Body className="text-center p-4">
                <div className="display-4 text-primary mb-3">🔐</div>
                <Card.Title>Secure Encryption</Card.Title>
                <Card.Text>
                  Protect your login credentials with AES-256 encryption technology to ensure information security.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card className="h-100 feature-card border-0 shadow-sm">
              <Card.Body className="text-center p-4">
                <div className="display-4 text-primary mb-3">⏰</div>
                <Card.Title>Automatic Checking</Card.Title>
                <Card.Text>
                  Automatically check your application status every 10 minutes without manual page refresh.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card className="h-100 feature-card border-0 shadow-sm">
              <Card.Body className="text-center p-4">
                <div className="display-4 text-primary mb-3">📧</div>
                <Card.Title>Email Notifications</Card.Title>
                <Card.Text>
                  Instantly send email notifications when status changes occur, keeping you informed of progress in real-time.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card className="h-100 feature-card border-0 shadow-sm">
              <Card.Body className="text-center p-4">
                <div className="display-4 text-primary mb-3">📊</div>
                <Card.Title>Status Tracking</Card.Title>
                <Card.Text>
                  Detailed record of application status change history to help you understand application progress.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card className="h-100 feature-card border-0 shadow-sm">
              <Card.Body className="text-center p-4">
                <div className="display-4 text-primary mb-3">🌐</div>
                <Card.Title>Web Interface</Card.Title>
                <Card.Text>
                  Modern web interface supporting multi-device access, check status anytime, anywhere.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card className="h-100 feature-card border-0 shadow-sm">
              <Card.Body className="text-center p-4">
                <div className="display-4 text-primary mb-3">👥</div>
                <Card.Title>Multi-User Support</Card.Title>
                <Card.Text>
                  Support multiple users simultaneously, administrators can view all user statuses.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* CTA Section */}
        <Row className="mt-5 pt-5 text-center">
          <Col>
            <h3 className="mb-4">Ready to start tracking your application status?</h3>
            <Link to="/register" className="btn btn-primary btn-lg">
              Sign Up Free
            </Link>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default Home; 