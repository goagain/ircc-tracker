import React, { useState, useEffect } from 'react';
import { Timeline, Card, Tag, Typography, Space, Select, Spin } from 'antd';
import { ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { ApplicationRecord, ActivityType, ActivityStatus, HistoryType } from '../types/application';

const { Title, Text } = Typography;
const { Option } = Select;

interface ApplicationStatusProps {
    applicationRecord: ApplicationRecord;
}

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

const getStatusIcon = (status: string) => {
    switch (status) {
        case 'inProgress':
            return <ClockCircleOutlined />;
        case 'completed':
            return <CheckCircleOutlined />;
        case 'notStarted':
            return <CloseCircleOutlined />;
        default:
            return null;
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

const ApplicationStatus: React.FC<ApplicationStatusProps> = ({ applicationRecord }) => {
    const [selectedHistory, setSelectedHistory] = useState<number | null>(null);

    const activities = applicationRecord.activities.sort((a, b) => a.order - b.order);
    const history = applicationRecord.history.sort((a, b) => b.time - a.time);

    const getActivityLabel = (activity: ActivityType) => {
        const labels: Record<ActivityType, string> = {
            [ActivityType.LANGUAGE]: 'Language Test',
            [ActivityType.BACKGROUND_VERIFICATION]: 'Background Verification',
            [ActivityType.RESIDENCY]: 'Residency Requirement',
            [ActivityType.PROHIBITIONS]: 'Prohibitions',
            [ActivityType.CITIZENSHIP_TEST]: 'Citizenship Test',
            [ActivityType.CITIZENSHIP_OATH]: 'Citizenship Oath'
        };
        return labels[activity] || activity;
    };

    return (
        <div style={{ padding: '24px' }}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                {/* Application Basic Information */}
                <Card>
                    <Space direction="vertical" size="small">
                        <Title level={4}>Application Status</Title>
                        <Space>
                            <Text>Application Number: {applicationRecord.application_number}</Text>
                            <Text>UCI: {applicationRecord.uci}</Text>
                            <Text>Last Updated: {formatDateTime(applicationRecord.last_updated_time)}</Text>
                        </Space>
                        <Tag color={getStatusColor(applicationRecord.status)}>
                            {applicationRecord.status === 'inProgress' ? 'In Progress' : 
                             applicationRecord.status === 'completed' ? 'Completed' : 'Not Started'}
                        </Tag>
                    </Space>
                </Card>

                {/* Application Progress */}
                <Card title="Application Progress">
                    <Space direction="vertical" style={{ width: '100%' }}>
                        {activities.map((activity) => (
                            <div key={activity.activity} style={{ marginBottom: '16px' }}>
                                <Space>
                                    {getStatusIcon(activity.status)}
                                    <Text strong>{getActivityLabel(activity.activity)}</Text>
                                    <Tag color={getStatusColor(activity.status)}>
                                        {activity.status === 'inProgress' ? 'In Progress' : 
                                         activity.status === 'completed' ? 'Completed' : 'Not Started'}
                                    </Tag>
                                </Space>
                            </div>
                        ))}
                    </Space>
                </Card>

                {/* History Timeline */}
                <Card 
                    title="History" 
                    extra={
                        <Select
                            style={{ width: 200 }}
                            placeholder="Select History Record"
                            onChange={(value) => setSelectedHistory(value)}
                            value={selectedHistory}
                        >
                            {history.map((record, index) => (
                                <Option key={index} value={index}>
                                    {formatDateTime(record.time)}
                                </Option>
                            ))}
                        </Select>
                    }
                >
                    <Timeline>
                        {history.map((record, index) => (
                            <Timeline.Item 
                                key={index}
                                color={record.is_new ? 'green' : 'blue'}
                                style={{ 
                                    display: selectedHistory === null || selectedHistory === index ? 'block' : 'none'
                                }}
                            >
                                <Space direction="vertical" size="small">
                                    <Text strong>{record.title.en}</Text>
                                    <Text>{record.text.en}</Text>
                                    <Text type="secondary">{formatDateTime(record.time)}</Text>
                                </Space>
                            </Timeline.Item>
                        ))}
                    </Timeline>
                </Card>
            </Space>
        </div>
    );
};

export default ApplicationStatus; 