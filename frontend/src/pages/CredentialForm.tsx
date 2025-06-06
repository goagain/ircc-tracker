import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { User } from '../types/user';
import credentialService, { CreateCredentialData } from '../services/credentialService';

interface CredentialFormProps {
  user: User;
}

interface FormData extends CreateCredentialData {}

const CredentialForm: React.FC<CredentialFormProps> = ({ user }) => {
  const { credentialId } = useParams<{ credentialId: string }>();
  const [formData, setFormData] = useState<FormData>({
    ircc_username: '',
    ircc_password: '',
    email: user.email,
    is_active: true,
    application_type: 'citizen'
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCredential = async () => {
      if (credentialId) {
        try {
          setLoading(true);
          const response = await credentialService.getCredential(credentialId);
          const credential = response;
          setFormData({
            ircc_username: credential.ircc_username,
            ircc_password: '',  // Don't load password
            email: credential.email,
            is_active: true,
            application_type: credential.application_type
          });
        } catch (error: any) {
          setError(error.response?.data?.error || 'Failed to load credential');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchCredential();
  }, [credentialId]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>): void => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    });
  };

  const handleApplicationTypeChange = (type: string): void => {
    setFormData({
      ...formData,
      application_type: type
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      if (credentialId) {
        await credentialService.updateCredential(credentialId, formData);
        setSuccess('Credential updated successfully');
      } else {
        await credentialService.createCredential(formData);
        setSuccess('Credential added successfully');
      }

      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Operation failed, please try again later');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="shadow">
            <Card.Body className="p-4">
              <div className="text-center mb-4">
                <h2 className="text-primary">
                  <span className="canada-flag">🍁</span>
                  {credentialId ? 'Edit Credential' : 'Add New Credential'}
                </h2>
                <p className="text-muted">
                  {credentialId 
                    ? 'Update your IRCC credential information'
                    : 'Add your IRCC credential to start tracking your application'
                  }
                </p>
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
                  <Form.Label>Application Type</Form.Label>
                  <div className="d-flex justify-content-between gap-3">
                    <div 
                      className={`flex-grow-1 text-center p-4 rounded-4 cursor-pointer ${formData.application_type === 'citizen' ? 'bg-primary text-white' : 'bg-light'}`}
                      style={{ cursor: credentialId ? 'not-allowed' : 'pointer', opacity: credentialId ? 0.7 : 1 }}
                      onClick={() => !credentialId && handleApplicationTypeChange('citizen')}
                    >
                      <div className="mb-2 d-flex justify-content-center align-items-center" style={{ height: '64px' }}>
                        <img 
                          src="/images/passport.svg" 
                          alt="Passport" 
                          style={{ 
                            width: '64px', 
                            height: '64px'
                          }} 
                        />
                      </div>
                      <div className="h5 mb-0">Citizenship</div>
                    </div>
                    <div 
                      className={`flex-grow-1 text-center p-4 rounded-4 cursor-pointer ${formData.application_type === 'immigrant' ? 'bg-primary text-white' : 'bg-light'}`}
                      style={{ cursor: credentialId ? 'not-allowed' : 'pointer', opacity: credentialId ? 0.7 : 1 }}
                      onClick={() => !credentialId && handleApplicationTypeChange('immigrant')}
                    >
                      <div className="mb-2 d-flex justify-content-center align-items-center" style={{ height: '64px' }}>
                        <span className="display-4">🛃</span>
                      </div>
                      <div className="h5 mb-0">PR/Visa</div>
                    </div>
                  </div>
                  <Form.Text className="text-muted mt-2">
                    Select the type of application you want to track
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>IRCC Username</Form.Label>
                  <Form.Control
                    type="text"
                    name="ircc_username"
                    value={formData.ircc_username}
                    onChange={handleChange}
                    placeholder="Enter your IRCC tracker username"
                    required
                    disabled={loading || !!credentialId}
                  />
                  <Form.Text className="text-muted">
                    This is the username you use to log in to your IRCC Tracker account
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>IRCC Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="ircc_password"
                    value={formData.ircc_password}
                    onChange={handleChange}
                    placeholder={credentialId ? "Leave blank to keep current password" : "Enter your IRCC Tracker password"}
                    required={!credentialId}
                    disabled={loading}
                  />
                  <Form.Text className="text-muted">
                    {credentialId 
                      ? "Leave blank if you don't want to change the password"
                      : "This is the password you use to log in to your IRCC Tracker account"
                    }
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Email Address</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    required
                    disabled={loading}
                  />
                  <Form.Text className="text-muted">
                    We will use this email to send status update notifications
                  </Form.Text>
                </Form.Group>

                <div className="d-grid">
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={loading}
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        {credentialId ? 'Updating...' : 'Adding...'}
                      </>
                    ) : (
                      credentialId ? 'Update Credential' : 'Add Credential'
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default CredentialForm; 