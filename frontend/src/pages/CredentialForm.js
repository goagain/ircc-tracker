import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import credentialService from '../services/credentialService';

const CredentialForm = ({ user }) => {
  const { credentialId } = useParams();
  const isEditMode = !!credentialId;
  const [loading, setLoading] = useState(isEditMode);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    irccUsername: '',
    irccPassword: '',
    notificationEmail: user?.email || '',
    applicationType: 'citizen'
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCredential = async () => {
      if (isEditMode) {
        try {
          const response = await credentialService.getCredential(credentialId);
          const credential = response.data;
          setFormData({
            irccUsername: credential.ircc_username,
            irccPassword: '',
            notificationEmail: credential.email,
            applicationType: credential.application_type
          });
        } catch (error) {
          setError('Failed to fetch credential information: ' + (error.response?.data?.error || error.message));
        } finally {
          setLoading(false);
        }
      }
    };

    fetchCredential();
  }, [credentialId, isEditMode]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      let response;
      if (isEditMode) {
        response = await credentialService.updateCredential(
          credentialId,
          formData.irccPassword,
          formData.notificationEmail
        );
      } else {
        response = await credentialService.uploadCredential(
          formData.irccUsername,
          formData.irccPassword,
          formData.notificationEmail,
          formData.applicationType
        );
      }

      if (response.data.message) {
        setSuccess(isEditMode ? 'Credential updated successfully!' : 'IRCC credential added successfully! The system will start monitoring your application status.');
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      }
    } catch (error) {
      setError(error.response?.data?.error || (isEditMode ? 'Failed to update credential, please try again later' : 'Failed to add credential, please try again later'));
    } finally {
      setLoading(false);
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
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="shadow">
            <Card.Header className="bg-primary text-white">
              <h4 className="mb-0">
                <span className="canada-flag">🍁</span>
                {isEditMode ? 'Edit IRCC Credential' : 'Add IRCC Credential'}
              </h4>
            </Card.Header>
            <Card.Body className="p-4">
              <div className="mb-4">
                <Alert variant="info">
                  <i className="bi bi-info-circle me-2"></i>
                  <strong>Security Tip:</strong> Your IRCC password will be securely stored using AES-256 encryption technology. We do not store your password in plain text.
                </Alert>
              </div>

              {error && (
                <Alert variant="danger" className="mb-3">
                  {error}
                </Alert>
              )}

              {success && (
                <Alert variant="success" className="mb-3">
                  {success}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-4">
                  <Form.Label>
                    <i className="bi bi-card-list me-2"></i>
                    Application Type
                  </Form.Label>
                  <div className="d-flex gap-4">
                    <Form.Check
                      type="radio"
                      id="citizen"
                      name="applicationType"
                      value="citizen"
                      label="Citizenship Application"
                      checked={formData.applicationType === 'citizen'}
                      onChange={handleChange}
                    />
                    <Form.Check
                      type="radio"
                      id="immigrant"
                      name="applicationType"
                      value="immigrant"
                      label="Visa/PR Application (Not Supported Yet)"
                      checked={formData.applicationType === 'immigrant'}
                      onChange={handleChange}
                      disabled
                    />
                  </div>
                  <Form.Text className="text-muted">
                    Currently only citizenship application type is supported. Visa/PR application feature is under development.
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>
                    <i className="bi bi-person me-2"></i>
                    IRCC Username (UCI/Party ID)
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="irccUsername"
                    value={formData.irccUsername}
                    onChange={handleChange}
                    placeholder="Please enter your IRCC account username"
                    required
                    disabled={isEditMode}
                    className={isEditMode ? 'bg-light' : ''}
                  />
                  <Form.Text className="text-muted">
                    This is the username you use to log in to the IRCC website
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>
                    <i className="bi bi-lock me-2"></i>
                    IRCC Password
                  </Form.Label>
                  <Form.Control
                    type="password"
                    name="irccPassword"
                    value={formData.irccPassword}
                    onChange={handleChange}
                    placeholder={isEditMode ? "Leave blank to keep current password" : "Please enter your IRCC account password"}
                    required={!isEditMode}
                  />
                  <Form.Text className="text-muted">
                    {isEditMode ? "Leave blank to keep current password" : "The password will be stored encrypted and used only for automatic status checking"}
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>
                    <i className="bi bi-envelope me-2"></i>
                    Notification Email
                  </Form.Label>
                  <Form.Control
                    type="email"
                    name="notificationEmail"
                    value={formData.notificationEmail}
                    onChange={handleChange}
                    placeholder="Email to receive status update notifications"
                    required
                  />
                  <Form.Text className="text-muted">
                    We will send notifications to this email when your application status changes
                  </Form.Text>
                </Form.Group>

                <div className="d-grid gap-2">
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={loading}
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        {isEditMode ? 'Updating...' : 'Adding...'}
                      </>
                    ) : (
                      <>
                        <i className={`bi ${isEditMode ? 'bi-save' : 'bi-plus-circle'} me-2`}></i>
                        {isEditMode ? 'Save Changes' : 'Add Credential'}
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline-secondary"
                    onClick={() => navigate('/dashboard')}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </div>
              </Form>

              {!isEditMode && (
                <>
                  <hr className="my-4" />

                  <div className="text-center">
                    <h6 className="text-muted mb-3">工作原理</h6>
                    <Row className="g-3">
                      <Col md={4} className="text-center">
                        <div className="text-primary mb-2">
                          <i className="bi bi-shield-lock" style={{ fontSize: '2rem' }}></i>
                        </div>
                        <small className="text-muted">安全加密存储</small>
                      </Col>
                      <Col md={4} className="text-center">
                        <div className="text-primary mb-2">
                          <i className="bi bi-arrow-repeat" style={{ fontSize: '2rem' }}></i>
                        </div>
                        <small className="text-muted">每10分钟检查</small>
                      </Col>
                      <Col md={4} className="text-center">
                        <div className="text-primary mb-2">
                          <i className="bi bi-bell" style={{ fontSize: '2rem' }}></i>
                        </div>
                        <small className="text-muted">状态变更通知</small>
                      </Col>
                    </Row>
                  </div>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default CredentialForm; 