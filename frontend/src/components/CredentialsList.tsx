import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button, Collapse, ProgressBar, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import applicationService from '../services/applicationService';
import { formatDate } from '../utils/dateUtils';
import { Credential, Activity, HistoryRecord } from '../types/tracking';
import { generateDemoCredentials } from '../utils/demoData';

interface ApplicationDetails {
  details: any; // TODO: Define proper type for application details
}

interface CredentialsListProps {
  credentials: Credential[];
  onDelete: (username: string) => void;
  showUserColumn?: boolean;
  showActions?: boolean;
  title?: string;
  emptyMessage?: string;
  emptySubMessage?: string;
  addButtonText?: string;
  addButtonLink?: string;
  isDemo?: boolean;
}

const CredentialsList: React.FC<CredentialsListProps> = ({
  credentials,
  onDelete,
  showUserColumn = false,
  showActions = true,
  title = "IRCC Credentials",
  emptyMessage = "No credentials have been added yet",
  emptySubMessage = "Add your IRCC username and password to start tracking application status",
  addButtonText = "Add New Credential",
  addButtonLink = "/credentials/new",
  isDemo = false
}) => {
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});
  const [applicationDetails, setApplicationDetails] = useState<Record<string, ApplicationDetails>>({});
  const [loadingDetails, setLoadingDetails] = useState<Record<string, boolean>>({});

  const toggleRow = async (index: number, credential: Credential): Promise<void> => {
    const newExpandedState = !expandedRows[index];
    setExpandedRows(prev => ({
      ...prev,
      [index]: newExpandedState
    }));

    if (isDemo) {
      setApplicationDetails(prev => ({
        ...prev,
        [credential.application_number]: {
          details: generateDemoCredentials()[index].details
        }
      }));
      return;
    }

    // If expanded and details not loaded, then load
    if (newExpandedState && !applicationDetails[credential.application_number]) {
      try {
        setLoadingDetails(prev => ({ ...prev, [credential.application_number]: true }));
        const [details] = await Promise.all([
          applicationService.getApplicationByTimestamp(credential.application_number, 'latest')
        ]);

        setApplicationDetails(prev => ({
          ...prev,
          [credential.application_number]: {
            details: details.data
          }
        }));
      } catch (error) {
        console.error('Failed to load application details:', error);
      } finally {
        setLoadingDetails(prev => ({ ...prev, [credential.application_number]: false }));
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'inprogress':
        return <Badge bg="primary">In Progress</Badge>;
      case 'completed':
        return <Badge bg="success">Completed</Badge>;
      case 'notstarted':
        return <Badge bg="secondary">Not Started</Badge>;
      default:
        return <Badge bg="secondary">{status || 'Unknown'}</Badge>;
    }
  };

  const getActivityStatusBadge = (status: string): React.ReactElement => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <Badge bg="success">Completed</Badge>;
      case 'inprogress':
        return <Badge bg="primary">In Progress</Badge>;
      case 'notstarted':
        return <Badge bg="secondary">Not Started</Badge>;
      case 'rejected':
        return <Badge bg="danger">Rejected</Badge>;
      case 'refused':
        return <Badge bg="danger">Refused</Badge>;
      case 'withdrawn':
        return <Badge bg="danger">Withdrawn</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  const getActivityName = (activity: string): string => {
    switch (activity) {
      case 'citizenshipOath':
        return 'Citizenship Oath';
      case 'citizenshipTest':
        return 'Citizenship Test';
      case 'prohibitions':
        return 'Prohibitions';
      case 'residency':
        return 'Residency';
      case 'backgroundVerification':
        return 'Background Verification';
      case 'language':
        return 'Language';
      default:
        return activity;
    }
  };

  const renderActivities = (activities: Activity[] | undefined): React.ReactElement => {
    if (!activities || activities.length === 0) {
      return <p className="text-muted mb-0">No activity information</p>;
    }

    // Calculate completion progress
    const completedCount = activities.filter(a => a.status.toLowerCase() === 'completed').length;
    const progress = (completedCount / activities.length) * 100;

    return (
      <div>
        <div className="mb-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span>Overall Progress</span>
            <span>{progress.toFixed(1)}%</span>
          </div>
          <ProgressBar now={progress} />
        </div>
        <div className="activities-list">
          {activities.sort((a, b) => b.order - a.order).map((activity, idx) => (
            <div key={idx} className="activity-item mb-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <strong>{getActivityName(activity.activity)}</strong>
                </div>
                {getActivityStatusBadge(activity.status)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderHistory = (history: HistoryRecord[] | undefined): React.ReactElement => {
    if (!history || history.length === 0) {
      return <p className="text-muted mb-0">No history records</p>;
    }

    return (
      <div className="timeline">
        {history.sort((a, b) => b.time - a.time).map((record, idx) => (
          <div key={idx} className="timeline-item mb-3">
            <div className="d-flex">
              <div className="timeline-marker me-3">
                {record.isNew ? (
                  <Badge bg="success">New</Badge>
                ) : record.isWaiting ? (
                  <Badge bg="warning">Waiting</Badge>
                ) : (
                  <Badge bg="info">{record.type}</Badge>
                )}
              </div>
              <div className="timeline-content flex-grow-1">
                <div className="d-flex justify-content-between">
                  <strong>{record.title.en || record.title.fr}</strong>
                  <small className="text-muted">
                    {formatDate(new Date(record.time).toString())}
                  </small>
                </div>
                <div className="text-muted small mt-1">
                  {record.text.en || record.text.fr}
                </div>
                {record.activity && (
                  <div className="text-muted small mt-1">
                    Activity: {record.activity}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card>
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5 className="mb-0">{title}</h5>
        {showActions && (
          <Link to={addButtonLink} className="btn btn-primary">
            <i className="bi bi-plus-circle me-2"></i>
            {addButtonText}
          </Link>
        )}
      </Card.Header>
      <Card.Body>
        {credentials.length === 0 ? (
          <div className="text-center py-5">
            <div className="display-1 text-muted mb-3">📝</div>
            <h4>{emptyMessage}</h4>
            <p className="text-muted mb-4">
              {emptySubMessage}
            </p>
            {showActions && (
              <Link to={addButtonLink} className="btn btn-primary">
                Add First Credential
              </Link>
            )}
          </div>
        ) : (
          <Table responsive hover>
            <thead>
              <tr>
                <th style={{ width: '40px' }}></th>
                {showUserColumn && <th>User Email</th>}
                <th>IRCC Username</th>
                <th>Notification Email</th>
                <th>Current Status</th>
                <th>Last Checked</th>
                <th>Status Time</th>
                {showActions && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {credentials.map((credential, index) => (
                <React.Fragment key={index}>
                  <tr
                    className="cursor-pointer"
                    onClick={() => toggleRow(index, credential)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <i className={`bi bi-chevron-${expandedRows[index] ? 'down' : 'right'}`}></i>
                    </td>
                    {showUserColumn && (
                      <td>
                        <strong>{credential.user_id}</strong>
                      </td>
                    )}
                    <td>
                      <strong>{credential.ircc_username}</strong>
                      {!credential.is_active && (
                        <Badge bg="secondary" className="ms-2">Inactive</Badge>
                      )}
                    </td>
                    <td>{credential.email}</td>
                    <td>{getStatusBadge(credential.last_status)}</td>
                    <td>
                      {credential.last_checked
                        ? formatDate(credential.last_checked)
                        : 'Never Checked'
                      }
                    </td>
                    <td>
                      {credential.last_timestamp
                        ? formatDate(credential.last_timestamp)
                        : '-'
                      }
                    </td>
                    {showActions && (
                      <td>
                        <Link
                          to={`/credentials/edit/${credential.id}`}
                          className="btn btn-outline-primary btn-sm me-2"
                          title="Edit Credential"
                        >
                          <i className="bi bi-pencil"></i>
                        </Link>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => onDelete(credential.ircc_username)}
                        >
                          <i className="bi bi-trash"></i>
                        </Button>
                      </td>
                    )}
                  </tr>
                  <tr>
                    <td colSpan={showActions ? 8 : 7} className="p-0">
                      <Collapse in={expandedRows[index]}>
                        <div className="p-3 bg-light">
                          {loadingDetails[credential.application_number] ? (
                            <div className="text-center py-3">
                              <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                              </div>
                            </div>
                          ) : applicationDetails[credential.application_number] ? (
                            <div>
                              <Row className="g-0">
                                <Col md={6} className="pe-3">
                                  <h6 className="mb-3">Application Details</h6>
                                  {renderActivities(applicationDetails[credential.application_number].details.activities)}
                                </Col>
                                <Col md={6} className="ps-3 border-start">
                                  <h6 className="mb-3">History</h6>
                                  {renderHistory(applicationDetails[credential.application_number].details.history)}
                                </Col>
                              </Row>
                            </div>
                          ) : (
                            <div className="text-center py-3">
                              <p className="text-muted mb-0">No application details available</p>
                            </div>
                          )}
                        </div>
                      </Collapse>
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </Table>
        )}
      </Card.Body>
    </Card>
  );
};

export default CredentialsList; 