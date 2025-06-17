import React from 'react';
import { Container } from 'react-bootstrap';

const PrivacyPolicy: React.FC = () => {
  return (
    <Container className="py-5">
      <h1 className="mb-4">Privacy Policy</h1>
      <div className="mb-4">
        <h2>1. Information We Collect</h2>
        <p>We collect information that you provide directly to us, including:</p>
        <ul>
          <li>Email address</li>
          <li>Password (encrypted)</li>
          <li>IRCC application credentials (encrypted)</li>
        </ul>
      </div>

      <div className="mb-4">
        <h2>2. How We Use Your Information</h2>
        <p>We use the information we collect to:</p>
        <ul>
          <li>Provide and maintain our services</li>
          <li>Process your IRCC application status checks</li>
          <li>Send you notifications about your application status</li>
          <li>Improve our services</li>
        </ul>
      </div>

      <div className="mb-4">
        <h2>3. Data Security</h2>
        <p>We implement appropriate security measures to protect your personal information:</p>
        <ul>
          <li>All data is encrypted in transit and at rest</li>
          <li>Passwords are hashed using industry-standard algorithms</li>
          <li>Regular security audits and updates</li>
        </ul>
      </div>

      <div className="mb-4">
        <h2>4. Third-Party Services</h2>
        <p>We use the following third-party services:</p>
        <ul>
          <li>Google Analytics for usage statistics</li>
          <li>Google OAuth for authentication</li>
        </ul>
      </div>

      <div className="mb-4">
        <h2>5. Your Rights</h2>
        <p>You have the right to:</p>
        <ul>
          <li>Access your personal data</li>
          <li>Correct inaccurate data</li>
          <li>Request deletion of your data</li>
          <li>Opt-out of communications</li>
        </ul>
      </div>

      <div className="mb-4">
        <h2>6. Contact Us</h2>
        <p>If you have any questions about this Privacy Policy, please contact us at:</p>
        <p>Email: support@goagain.me</p>
        <p>Website: tracker.goagain.me</p>
      </div>

      <div className="text-muted">
        <p>Last updated: {new Date().toLocaleDateString()}</p>
      </div>
    </Container>
  );
};

export default PrivacyPolicy; 