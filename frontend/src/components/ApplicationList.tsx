import React, { useEffect, useState } from 'react';
import { Card, List, Tag, Typography, Space, Spin, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ApplicationRecord, ActivityStatus, ActivityType, BilingualText } from '../types/application';
import applicationService from '../services/applicationService';

const { Title, Text } = Typography;

const ApplicationList: React.FC = () => {
    const [applications, setApplications] = useState<ApplicationRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchApplications = async () => {
            try {
                const response = await applicationService.getAllApplications();
                const appRecords: ApplicationRecord[] = response.data.applications.map(app => ({
                    application_number: app.uci,
                    uci: app.uci,
                    status: app.status,
                    last_updated_time: Date.now(),
                    activities: app.activities,
                    history: app.history.map(record => ({
                        time: record.time,
                        is_new: record.isNew,
                        title: {
                            en: record.title.en || '',
                            fr: record.title.fr || ''
                        },
                        text: {
                            en: record.text.en || '',
                            fr: record.text.fr || ''
                        },
                        description: record.text.en || record.text.fr || '',
                        timestamp: record.time
                    }))
                }));
                setApplications(appRecords);
            } catch (err: any) {
                message.error(err.response?.data?.error || 'Failed to fetch application list');
            } finally {
                setLoading(false);
            }
        };

        fetchApplications();
    }, []);

    const getStatusColor = (status: ActivityStatus) => {
        switch (status) {
            case ActivityStatus.IN_PROGRESS:
                return 'processing';
            case ActivityStatus.COMPLETED:
                return 'success';
            case ActivityStatus.NOT_STARTED:
                return 'default';
            default:
                return 'default';
        }
    };

    const getActivityLabel = (activity: ActivityType): string => {
        switch (activity) {
            case ActivityType.LANGUAGE:
                return 'Language Test';
            case ActivityType.BACKGROUND_VERIFICATION:
                return 'Background Verification';
            case ActivityType.RESIDENCY:
                return 'Residency Requirement';
            case ActivityType.PROHIBITIONS:
                return 'Prohibitions';
            case ActivityType.CITIZENSHIP_TEST:
                return 'Citizenship Test';
            case ActivityType.CITIZENSHIP_OATH:
                return 'Citizenship Oath';
            default:
                return activity;
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
                                        {application.status === ActivityStatus.IN_PROGRESS ? 'In Progress' : 
                                         application.status === ActivityStatus.COMPLETED ? 'Completed' : 'Not Started'}
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
                                                {getActivityLabel(activity.activity)}
                                            </Text>
                                            <Tag color={getStatusColor(activity.status)}>
                                                {activity.status === ActivityStatus.IN_PROGRESS ? 'In Progress' : 
                                                 activity.status === ActivityStatus.COMPLETED ? 'Completed' : 'Not Started'}
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