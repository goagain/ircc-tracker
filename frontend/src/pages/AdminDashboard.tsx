import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Alert, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import credentialService, { Credential } from '../services/credentialService';
import { User } from '../types/user';
import CredentialsList from '../components/CredentialsList';

interface AdminDashboardProps {
  user: User;
}

interface UserStats {
  total: number;
  active: number;
  inactive: number;
}

interface CredentialStats {
  total: number;
  status_distribution: Record<string, number>;
}

interface AdminStats {
  users: UserStats;
  credentials: CredentialStats;
  scheduler: any;
  system_status: string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await authService.getAdminStats();
      setStats(response.data);
      const credentialsResponse = await credentialService.getAllCredentials();
      setCredentials(credentialsResponse.credentials);
    } catch (error: any) {
      if (error.response?.status === 403) {
        setError('You do not have permission to access the admin dashboard');
        navigate('/dashboard');
      } else {
        setError(error.response?.data?.error || 'Failed to load admin statistics');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = (): void => {
    loadStats();
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
            Admin Dashboard
          </h1>
          <p className="lead text-muted">
            Welcome, {user.email}! Manage your application.
          </p>
        </Col>
        <Col xs="auto">
          <Button variant="primary" onClick={handleRefresh}>
            Refresh Statistics
          </Button>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {stats && (
        <>
          <Row className="mb-4">
            <Col md={4}>
              <Card className="text-center h-100">
                <Card.Body>
                  <div className="display-4 text-primary mb-3">👥</div>
                  <Card.Title>Total Users</Card.Title>
                  <Card.Text className="display-6 text-primary">
                    {stats.users.total}
                  </Card.Text>
                  <Card.Text className="text-muted">
                    {stats.users.active} Active Users
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="text-center h-100">
                <Card.Body>
                  <div className="display-4 text-success mb-3">🔑</div>
                  <Card.Title>Total Credentials</Card.Title>
                  <Card.Text className="display-6 text-success">
                    {stats.credentials.total}
                  </Card.Text>
                  <Card.Text className="text-muted">
                    {Object.entries(stats.credentials.status_distribution).map(([status, count]) => (
                      <div key={status}>
                        {status}: {count}
                      </div>
                    ))}
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="text-center h-100">
                <Card.Body>
                  <div className="display-4 text-info mb-3">🔄</div>
                  <Card.Title>System Status</Card.Title>
                  <Card.Text className="text-info">
                    {stats.system_status}
                  </Card.Text>
                  <Card.Text className="text-muted">
                    Scheduler: {stats.scheduler.status}
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row>
            <Col>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">System Statistics</h5>
                </Card.Header>
                <Card.Body>
                  <Table responsive>
                    <thead>
                      <tr>
                        <th>Metric</th>
                        <th>Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Total Users</td>
                        <td>{stats.users.total}</td>
                      </tr>
                      <tr>
                        <td>Active Users</td>
                        <td>{stats.users.active}</td>
                      </tr>
                      <tr>
                        <td>Inactive Users</td>
                        <td>{stats.users.inactive}</td>
                      </tr>
                      <tr>
                        <td>Total Credentials</td>
                        <td>{stats.credentials.total}</td>
                      </tr>
                      {Object.entries(stats.credentials.status_distribution).map(([status, count]) => (
                        <tr key={status}>
                          <td>{status} Status</td>
                          <td>{count}</td>
                        </tr>
                      ))}
                      <tr>
                        <td>System Status</td>
                        <td>{stats.system_status}</td>
                      </tr>
                      <tr>
                        <td>Scheduler Status</td>
                        <td>{stats.scheduler.status}</td>
                      </tr>
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}

      <Row className="mt-4">
        <Col>
          <CredentialsList
            credentials={credentials}
            onDelete={async (id) => {
              try {
                await credentialService.deleteCredential(id);
                await loadStats();
              } catch (error: any) {
                setError(error.response?.data?.error || 'Failed to delete credential');
              }
            }}
          />
        </Col>
      </Row>
    </Container>
  );
};

export default AdminDashboard; 