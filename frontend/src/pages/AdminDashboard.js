import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Alert, Tabs, Tab } from 'react-bootstrap';
import credentialService from '../services/credentialService';
import CredentialsList from '../components/CredentialsList';

const AdminDashboard = ({ user }) => {
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadAllCredentials();
  }, []);

  const loadAllCredentials = async () => {
    try {
      setLoading(true);
      const response = await credentialService.getAllCredentials();
      setCredentials(response.data.credentials);
    } catch (error) {
      setError('Failed to load data: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    if (!status) return <Badge bg="secondary">Unknown</Badge>;

    const statusLower = status.toLowerCase();
    if (statusLower.includes('processing') || statusLower.includes('progress')) {
      return <Badge bg="warning">Processing</Badge>;
    } else if (statusLower.includes('approved') || statusLower.includes('completed')) {
      return <Badge bg="success">Approved</Badge>;
    } else if (statusLower.includes('refused') || statusLower.includes('rejected')) {
      return <Badge bg="danger">Rejected</Badge>;
    } else if (statusLower.includes('submitted')) {
      return <Badge bg="info">Submitted</Badge>;
    } else {
      return <Badge bg="secondary">{status}</Badge>;
    }
  };

  const getStatusStats = () => {
    const stats = {};
    credentials.forEach(credential => {
      const status = credential.last_status || 'Unknown';
      stats[status] = (stats[status] || 0) + 1;
    });
    return stats;
  };

  const getActiveCredentials = () => {
    return credentials.filter(c => c.is_active);
  };

  const getRecentlyChecked = () => {
    return credentials.filter(c => {
      if (!c.last_checked) return false;
      const lastChecked = new Date(c.last_checked);
      const now = new Date();
      const diffMinutes = (now - lastChecked) / (1000 * 60);
      return diffMinutes <= 60; // Checked within the last hour
    });
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

  const handleTriggerCheckAll = async () => {
    try {
      const response = await credentialService.triggerCheckAll();
      setSuccess(response.data.message);
    } catch (error) {
      setError('Failed to trigger check: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleSendTestEmail = async () => {
    try {
      const response = await credentialService.sendTestEmail();
      setSuccess(response.data.message);
    } catch (error) {
      setError('Failed to send test email: ' + (error.response?.data?.error || error.message));
    }
  };

  const statusStats = getStatusStats();
  const activeCredentials = getActiveCredentials();
  const recentlyChecked = getRecentlyChecked();

  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col>
          <h1 className="display-6">
            <span className="canada-flag">🍁</span>
            Admin Dashboard
          </h1>
          <p className="lead text-muted">
            System Overview and User Management
          </p>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Statistics Card */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center h-100 border-primary">
            <Card.Body>
              <div className="display-4 text-primary mb-3">👥</div>
              <Card.Title>Total Users</Card.Title>
              <Card.Text className="display-6 text-primary">
                {new Set(credentials.map(c => c.user_id)).size}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100 border-success">
            <Card.Body>
              <div className="display-4 text-success mb-3">📊</div>
              <Card.Title>Active Credentials</Card.Title>
              <Card.Text className="display-6 text-success">
                {activeCredentials.length}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100 border-info">
            <Card.Body>
              <div className="display-4 text-info mb-3">🔄</div>
              <Card.Title>Recently Checked</Card.Title>
              <Card.Text className="display-6 text-info">
                {recentlyChecked.length}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100 border-warning">
            <Card.Body>
              <div className="display-4 text-warning mb-3">📈</div>
              <Card.Title>Status Types</Card.Title>
              <Card.Text className="display-6 text-warning">
                {Object.keys(statusStats).length}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Tabs defaultActiveKey="credentials" className="mb-4">
        <Tab eventKey="credentials" title="User Credentials">
          <CredentialsList 
            credentials={credentials}
            showUserColumn={true}
            showActions={false}
            title="All User Credentials"
            emptyMessage="No user credentials yet"
            emptySubMessage="Waiting for users to add IRCC credentials"
          />
        </Tab>

        <Tab eventKey="statistics" title="Statistics">
          <Row>
            <Col md={6}>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">Status Distribution</h5>
                </Card.Header>
                <Card.Body>
                  {Object.keys(statusStats).length === 0 ? (
                    <p className="text-muted">No status data</p>
                  ) : (
                    <Table>
                      <thead>
                        <tr>
                          <th>Status</th>
                          <th>Count</th>
                          <th>Percentage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(statusStats).map(([status, count]) => (
                          <tr key={status}>
                            <td>{getStatusBadge(status)}</td>
                            <td>{count}</td>
                            <td>
                              {((count / credentials.length) * 100).toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </Card.Body>
              </Card>
            </Col>

            <Col md={6}>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">System Health Status</h5>
                </Card.Header>
                <Card.Body>
                  <div className="mb-3">
                    <div className="d-flex justify-content-between">
                      <span>Active Credential Rate</span>
                      <span className="text-success">
                        {credentials.length > 0
                          ? ((activeCredentials.length / credentials.length) * 100).toFixed(1)
                          : 0
                        }%
                      </span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="d-flex justify-content-between">
                      <span>Recently Checked Rate</span>
                      <span className="text-info">
                        {credentials.length > 0
                          ? ((recentlyChecked.length / credentials.length) * 100).toFixed(1)
                          : 0
                        }%
                      </span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="d-flex justify-content-between">
                      <span>System Status</span>
                      <Badge bg="success">Running</Badge>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        <Tab eventKey="system" title="System Management">
          <Card>
            <Card.Header>
              <h5 className="mb-0">System Operations</h5>
            </Card.Header>
            <Card.Body>
              <Row className="g-3">
                <Col md={6}>
                  <Card className="h-100">
                    <Card.Body className="text-center">
                      <div className="display-4 text-primary mb-3">🔄</div>
                      <Card.Title>Immediate Check</Card.Title>
                      <Card.Text>
                        Trigger an immediate status check
                      </Card.Text>
                      <Button variant="primary"
                        onClick={handleTriggerCheckAll}
                      >
                        Check All Statuses
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>

                <Col md={6}>
                  <Card className="h-100">
                    <Card.Body className="text-center">
                      <div className="display-4 text-info mb-3">📧</div>
                      <Card.Title>Email Test</Card.Title>
                      <Card.Text>
                        Test email service to ensure it's working
                      </Card.Text>
                      <Button variant="info"
                        onClick={handleSendTestEmail}
                      >
                        Send Test Email
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
    </Container>
  );
};

export default AdminDashboard; 