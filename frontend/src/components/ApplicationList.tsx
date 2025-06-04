import React, { useEffect, useState } from 'react';
import { Card, List, Tag, Typography, Space, Spin, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ApplicationRecord } from '../types/application';
import { applicationService } from '../services/applicationService';

const { Title, Text } = Typography;

const ApplicationList: React.FC = () => {
    const [applications, setApplications] = useState<ApplicationRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchApplications = async () => {
            try {
                const { applications } = await applicationService.getAllApplications();
                setApplications(applications);
            } catch (err: any) {
                message.error(err.response?.data?.error || 'Failed to fetch application list');
            } finally {
                setLoading(false);
            }
        };

        fetchApplications();
    }, []);

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

    return (
        <div style={{ padding: '24px' }}>
            <Title level={2}>My Applications</Title>
            <List
                grid={{ gutter: 16, column: 1 }}
                dataSource={applications}
                renderItem={(application) => (
                    <List.Item>
                        <Card
                            hoverable
                            onClick={() => navigate(`/application/${application.application_number}`)}
                        >
                            <Space direction="vertical" style={{ width: '100%' }}>
                                <Space>
                                    <Text strong>Application Number: {application.application_number}</Text>
                                    <Text>UCI: {application.uci}</Text>
                                </Space>
                                <Space>
                                    <Tag color={getStatusColor(application.status)}>
                                        {application.status === 'inProgress' ? 'In Progress' : 
                                         application.status === 'completed' ? 'Completed' : 'Not Started'}
                                    </Tag>
                                    <Text type="secondary">
                                        Last Updated: {formatDateTime(application.last_updated_time)}
                                    </Text>
                                </Space>
                                <List
                                    size="small"
                                    dataSource={application.activities}
                                    renderItem={(activity) => (
                                        <List.Item>
                                            <Text>
                                                {activity.activity === 'language' ? 'Language Test' :
                                                 activity.activity === 'backgroundVerification' ? 'Background Verification' :
                                                 activity.activity === 'residency' ? 'Residency Requirement' :
                                                 activity.activity === 'prohibitions' ? 'Prohibitions' :
                                                 activity.activity === 'citizenshipTest' ? 'Citizenship Test' :
                                                 activity.activity === 'citizenshipOath' ? 'Citizenship Oath' :
                                                 activity.activity}
                                            </Text>
                                            <Tag color={getStatusColor(activity.status)}>
                                                {activity.status === 'inProgress' ? 'In Progress' : 
                                                 activity.status === 'completed' ? 'Completed' : 'Not Started'}
                                            </Tag>
                                        </List.Item>
                                    )}
                                />
                            </Space>
                        </Card>
                    </List.Item>
                )}
            />
        </div>
    );
};

export default ApplicationList; 