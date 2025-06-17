import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Alert } from 'react-bootstrap';
import CredentialsList from '../components/CredentialsList';
import { generateDemoCredentials } from '../utils/demoData';
import { Credential } from '../types/tracking';

const Demo: React.FC = () => {
  const [credentials, setCredentials] = useState<Credential[]>([]);

  useEffect(() => {
    // Load demo data when component mounts
    const demoCredentials = generateDemoCredentials();
    setCredentials(demoCredentials);
  }, []);

  const handleDelete = (irccUsername: string) => {
    // In demo mode, we don't actually delete anything
    console.log('Delete requested for:', irccUsername);
  };

  return (
    <Container className="py-4">
      <Alert variant="info" className="mb-4">
        <Alert.Heading>Demo Mode</Alert.Heading>
        <p>
          This is a demonstration of the IRCC Tracker interface. The data shown here is for demonstration purposes only.
        </p>
      </Alert>

      <Row>
        <Col>
          <h2 className="mb-4">Sample IRCC Credentials</h2>
          <CredentialsList
            credentials={credentials}
            onDelete={handleDelete}
            title="Demo Credentials"
            isDemo={true}
          />
        </Col>
      </Row>
    </Container>
  );
};

export default Demo; 