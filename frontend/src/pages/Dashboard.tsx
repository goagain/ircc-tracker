import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Alert } from 'react-bootstrap';
import credentialService from '../services/credentialService';
import CredentialsList from '../components/CredentialsList';
import { User } from '../types/user';

interface Credential {
  id: string;
  user_id: string;
  ircc_username: string;
  email: string;
  is_active: boolean;
  last_status: string;
  last_checked: string;
  last_timestamp: string;
  application_number: string;
}

interface DashboardProps {
  user: User;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadCredentials();
  }, []);

  const loadCredentials = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await credentialService.getMyCredentials();
      setCredentials(response.credentials);
    } catch (error: any) {
      setError('Failed to load credentials: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCredential = async (irccUsername: string): Promise<void> => {
    if (window.confirm(`Are you sure you want to delete the credential "${irccUsername}"?`)) {
      try {
        await credentialService.deleteCredential(irccUsername);
        await loadCredentials(); // Reload the list
      } catch (error: any) {
        setError('Failed to delete credential: ' + (error.response?.data?.error || error.message));
      }
    }
  };

  if (loading) {
    return (
      <Container className="py-5">
        <div className="loading-spinner">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col>
          <h1 className="display-6">
            <span className="canada-flag">🍁</span>
            My Dashboard
          </h1>
          <p className="lead text-muted">
            Welcome back, {user.email}! Check your IRCC application status.
          </p>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Row className="mb-4">
        <Col md={4}>
          <Card className="text-center h-100">
            <Card.Body>
              <div className="display-4 text-primary mb-3">📊</div>
              <Card.Title>Tracked Applications</Card.Title>
              <Card.Text className="display-6 text-primary">
                {credentials.length}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center h-100">
            <Card.Body>
              <div className="display-4 text-success mb-3">✅</div>
              <Card.Title>Active Monitoring</Card.Title>
              <Card.Text className="display-6 text-success">
                {credentials.filter(c => c.is_active).length}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center h-100">
            <Card.Body>
              <div className="display-4 text-info mb-3">🔄</div>
              <Card.Title>Recently Checked</Card.Title>
              <Card.Text className="text-info">
                {credentials.length > 0 && credentials[0].last_checked
                  ? new Date(credentials[0].last_checked).toLocaleString()
                  : 'No data'
                }
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col>
          <CredentialsList 
            credentials={credentials}
            onDelete={handleDeleteCredential}
            title="My IRCC Credentials"
          />
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard; 