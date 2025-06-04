import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Tag, Timeline, Spin, message } from 'antd';
import { ApplicationRecord } from '../types/application';
import { applicationService } from '../services/applicationService';

const ApplicationStatusPage: React.FC = () => {
    const { applicationNumber } = useParams<{ applicationNumber: string }>();
    const [application, setApplication] = useState<ApplicationRecord | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchApplication = async () => {
            if (!applicationNumber) return;
            
            try {
                const data = await applicationService.getApplicationStatus(applicationNumber);
                setApplication(data);
            } catch (err: any) {
                if (err.response?.status === 401) {
                    message.error('Please login first');
                    navigate('/');
                } else if (err.response?.status === 403) {
                    message.error('You do not have permission to view this application');
                    navigate('/');
                } else if (err.response?.status === 404) {
                    message.error('Application record not found');
                    navigate('/');
                } else {
                    message.error(err.response?.data?.error || 'Failed to fetch application status');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchApplication();
    }, [applicationNumber, navigate]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'inProgress':
                return 'processing';
            case 'completed':
                return 'success';
            case 'notStarted':
                return 'default';
            default:
                return 'default';
        }
    };

    const formatDateTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return <Spin size="large" />;
    }

    if (!application) {
        return <div>Application record not found</div>;
    }

    return (
        <div style={{ padding: '24px' }}>
            <Card title="Application Details">
                <Descriptions bordered>
                    <Descriptions.Item label="Application Number">{application.application_number}</Descriptions.Item>
                    <Descriptions.Item label="UCI">{application.uci}</Descriptions.Item>
                    <Descriptions.Item label="Status">
                        <Tag color={getStatusColor(application.status)}>
                            {application.status === 'inProgress' ? 'In Progress' : 
                             application.status === 'completed' ? 'Completed' : 'Not Started'}
                        </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Last Updated">
                        {formatDateTime(application.last_updated_time)}
                    </Descriptions.Item>
                </Descriptions>
            </Card>

            <Card title="Application Progress" style={{ marginTop: '24px' }}>
                <Timeline>
                    {application.activities.map((activity, index) => (
                        <Timeline.Item 
                            key={index}
                            color={activity.status === 'completed' ? 'green' : 
                                   activity.status === 'inProgress' ? 'blue' : 'gray'}
                        >
                            <p>
                                {activity.activity === 'language' ? 'Language Test' :
                                 activity.activity === 'backgroundVerification' ? 'Background Verification' :
                                 activity.activity === 'residency' ? 'Residency Requirement' :
                                 activity.activity === 'prohibitions' ? 'Prohibitions' :
                                 activity.activity === 'citizenshipTest' ? 'Citizenship Test' :
                                 activity.activity === 'citizenshipOath' ? 'Citizenship Oath' :
                                 activity.activity}
                            </p>
                            <Tag color={getStatusColor(activity.status)}>
                                {activity.status === 'inProgress' ? 'In Progress' : 
                                 activity.status === 'completed' ? 'Completed' : 'Not Started'}
                            </Tag>
                        </Timeline.Item>
                    ))}
                </Timeline>
            </Card>

            <Card title="Application History" style={{ marginTop: '24px' }}>
                <Timeline>
                    {application.history.map((record, index) => (
                        <Timeline.Item key={index}>
                            <p>{record.description}</p>
                            <p style={{ color: '#999' }}>{formatDateTime(record.timestamp)}</p>
                        </Timeline.Item>
                    ))}
                </Timeline>
            </Card>
        </div>
    );
};

export default ApplicationStatusPage; 