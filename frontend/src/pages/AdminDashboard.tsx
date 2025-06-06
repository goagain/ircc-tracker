import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Alert, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import credentialService from '../services/credentialService';
import { User } from '../types/user';

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
    } catch (error: any) {
      if (error.response?.status === 403) {
        setError('您没有权限访问管理员仪表盘');
        navigate('/dashboard');
      } else {
        setError(error.response?.data?.error || '加载管理员统计数据失败');
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
            管理员仪表盘
          </h1>
          <p className="lead text-muted">
            欢迎，{user.email}！管理您的应用程序。
          </p>
        </Col>
        <Col xs="auto">
          <Button variant="primary" onClick={handleRefresh}>
            刷新统计
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
                  <Card.Title>总用户数</Card.Title>
                  <Card.Text className="display-6 text-primary">
                    {stats.users.total}
                  </Card.Text>
                  <Card.Text className="text-muted">
                    {stats.users.active} 活跃用户
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="text-center h-100">
                <Card.Body>
                  <div className="display-4 text-success mb-3">🔑</div>
                  <Card.Title>总凭证数</Card.Title>
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
                  <Card.Title>系统状态</Card.Title>
                  <Card.Text className="text-info">
                    {stats.system_status}
                  </Card.Text>
                  <Card.Text className="text-muted">
                    调度器: {stats.scheduler.status}
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row>
            <Col>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">系统统计</h5>
                </Card.Header>
                <Card.Body>
                  <Table responsive>
                    <thead>
                      <tr>
                        <th>指标</th>
                        <th>数值</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>总用户数</td>
                        <td>{stats.users.total}</td>
                      </tr>
                      <tr>
                        <td>活跃用户</td>
                        <td>{stats.users.active}</td>
                      </tr>
                      <tr>
                        <td>非活跃用户</td>
                        <td>{stats.users.inactive}</td>
                      </tr>
                      <tr>
                        <td>总凭证数</td>
                        <td>{stats.credentials.total}</td>
                      </tr>
                      {Object.entries(stats.credentials.status_distribution).map(([status, count]) => (
                        <tr key={status}>
                          <td>{status} 状态</td>
                          <td>{count}</td>
                        </tr>
                      ))}
                      <tr>
                        <td>系统状态</td>
                        <td>{stats.system_status}</td>
                      </tr>
                      <tr>
                        <td>调度器状态</td>
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
    </Container>
  );
};

export default AdminDashboard; 