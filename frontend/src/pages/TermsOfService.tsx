import React from 'react';
import { Container } from 'react-bootstrap';

const TermsOfService: React.FC = () => {
  return (
    <Container className="py-5">
      <h1 className="mb-4">Terms of Service</h1>
      <p className="text-muted">Last Updated: {new Date().toLocaleDateString()}</p>

      <section className="mb-4">
        <h2>1. Acceptance of Terms</h2>
        <p>By accessing and using this service, you agree to be bound by these Terms of Service. If you do not agree to any part of these terms, please do not use the service.</p>
      </section>

      <section className="mb-4">
        <h2>2. Service Description</h2>
        <p>This service is designed to help users track their Canadian immigration application progress. We provide tools and services to assist users in managing and monitoring their immigration application status.</p>
      </section>

      <section className="mb-4">
        <h2>3. User Responsibilities</h2>
        <p>As a service user, you agree to:</p>
        <ul>
          <li>Provide accurate and complete personal information</li>
          <li>Protect your account security</li>
          <li>Update your personal information promptly</li>
          <li>Comply with all applicable laws and regulations</li>
        </ul>
      </section>

      <section className="mb-4">
        <h2>4. Data Usage and Privacy</h2>
        <p>We value your privacy and data security. Regarding data usage, please note the following:</p>
        <ul>
          <li>We do not store your username and password in plain text</li>
          <li>When necessary, we may use your credentials or application details for system debugging and troubleshooting</li>
          <li>All data used for debugging purposes will be kept strictly confidential and will not be disclosed to any third parties</li>
          <li>If we publish statistics and reports in the future, all data will be anonymized to ensure individual identities cannot be identified</li>
          <li>We commit to implementing appropriate technical and organizational measures to protect your data security</li>
        </ul>
      </section>

      <section className="mb-4">
        <h2>5. Service Limitations</h2>
        <p>We reserve the following rights:</p>
        <ul>
          <li>To modify or terminate the service at any time</li>
          <li>To restrict or prohibit access for users who violate the Terms of Service</li>
          <li>To update the Terms of Service and Privacy Policy</li>
        </ul>
      </section>

      <section className="mb-4">
        <h2>6. Privacy Policy</h2>
        <p>Our Privacy Policy details how we collect, use, and protect your personal information. Please review our <a href="/privacy">Privacy Policy</a> for more information.</p>
      </section>

      <section className="mb-4">
        <h2>7. Terms Modifications</h2>
        <p>We reserve the right to modify these Terms of Service at any time. Modified terms will take effect when posted on the website. Continued use of the service indicates your acceptance of the modified terms.</p>
      </section>

      <section className="mb-4">
        <h2>8. Termination Rights</h2>
        <p>We reserve the right to terminate or suspend your account under the following circumstances:</p>
        <ul>
          <li>Violation of Terms of Service</li>
          <li>Engagement in fraudulent or illegal activities</li>
          <li>Extended period of account inactivity</li>
        </ul>
      </section>

      <section className="mb-4">
        <h2>9. Contact Us</h2>
        <p>If you have any questions about these Terms of Service, please contact us through:</p>
        <ul>
          <li>Email: me@goagain.me</li>
          <li>Website: tracker.goagain.me</li>
        </ul>
      </section>
    </Container>
  );
};

export default TermsOfService; 