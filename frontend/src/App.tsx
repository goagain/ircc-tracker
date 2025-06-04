import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { Layout, Menu, message } from 'antd';
import ApplicationStatusPage from './components/ApplicationStatusPage';
import ApplicationList from './components/ApplicationList';

const { Header, Content } = Layout;

const App: React.FC = () => {
    useEffect(() => {
        // Check if user is logged in
        const userId = localStorage.getItem('userId');
        if (!userId) {
            message.warning('Please login first');
            // Redirect to login page
            // navigate('/login');
        }
    }, []);

    return (
        <Router>
            <Layout className="layout" style={{ minHeight: '100vh' }}>
                <Header>
                    <Menu theme="dark" mode="horizontal">
                        <Menu.Item key="home">
                            <Link to="/">Home</Link>
                        </Menu.Item>
                    </Menu>
                </Header>
                <Content style={{ padding: '24px', minHeight: 'calc(100vh - 64px)' }}>
                    <Routes>
                        <Route path="/" element={<ApplicationList />} />
                        <Route path="/application/:applicationNumber" element={<ApplicationStatusPage />} />
                    </Routes>
                </Content>
            </Layout>
        </Router>
    );
};

const ApplicationStatusPage: React.FC = () => {
    const [applicationRecord, setApplicationRecord] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const navigate = useNavigate();

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const applicationNumber = window.location.pathname.split('/').pop();
                if (applicationNumber) {
                    const data = await applicationService.getApplicationStatus(applicationNumber);
                    setApplicationRecord(data);
                }
            } catch (err: any) {
                if (err.response) {
                    switch (err.response.status) {
                        case 401:
                            message.error('Please login first');
                            navigate('/login');
                            break;
                        case 403:
                            message.error('No permission to access this application record');
                            navigate('/');
                            break;
                        case 404:
                            message.error('Application record not found');
                            navigate('/');
                            break;
                        default:
                            message.error(err.response.data.error || 'Failed to fetch data');
                    }
                } else {
                    message.error('Failed to fetch data');
                }
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [navigate]);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;
    if (!applicationRecord) return <div>Application record not found</div>;

    return <ApplicationStatusPage applicationRecord={applicationRecord} />;
};

export default App; 