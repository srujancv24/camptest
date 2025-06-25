import axios from 'axios';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import Loading from './Loading.jsx';
import { useToast } from './Toast.jsx';

const AlertsList = () => {
    const { getAuthToken } = useAuth();
    const { showSuccess, showError } = useToast();
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState({});

    useEffect(() => {
        fetchAlerts();
    }, []);

    const fetchAlerts = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/campgrounds/alerts', {
                headers: {
                    Authorization: `Bearer ${getAuthToken()}`
                }
            });

            if (response.data.success) {
                setAlerts(response.data.data);
            }
        } catch (err) {
            console.error('Error fetching alerts:', err);
            showError('Failed to load alerts');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleAlert = async (alertId, isActive) => {
        try {
            setActionLoading(prev => ({ ...prev, [alertId]: true }));

            const response = await axios.patch(
                `/api/campgrounds/alerts/${alertId}`,
                { is_active: !isActive },
                {
                    headers: {
                        Authorization: `Bearer ${getAuthToken()}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.success) {
                setAlerts(prev => prev.map(alert =>
                    alert.id === alertId
                        ? { ...alert, is_active: !isActive }
                        : alert
                ));
                showSuccess(`Alert ${!isActive ? 'activated' : 'deactivated'} successfully`);
            }
        } catch (err) {
            console.error('Error toggling alert:', err);
            showError('Failed to update alert');
        } finally {
            setActionLoading(prev => ({ ...prev, [alertId]: false }));
        }
    };

    const handleDeleteAlert = async (alertId) => {
        if (!window.confirm('Are you sure you want to delete this alert?')) {
            return;
        }

        try {
            setActionLoading(prev => ({ ...prev, [alertId]: true }));

            const response = await axios.delete(`/api/campgrounds/alerts/${alertId}`, {
                headers: {
                    Authorization: `Bearer ${getAuthToken()}`
                }
            });

            if (response.data.success) {
                setAlerts(prev => prev.filter(alert => alert.id !== alertId));
                showSuccess('Alert deleted successfully');
            }
        } catch (err) {
            console.error('Error deleting alert:', err);
            showError('Failed to delete alert');
        } finally {
            setActionLoading(prev => ({ ...prev, [alertId]: false }));
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (loading) {
        return <Loading message="Loading your alerts..." />;
    }

    if (alerts.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
                    <div className="text-6xl">🔔</div>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Alerts Set</h3>
                <p className="text-gray-600 mb-6">
                    You haven't created any campsite availability alerts yet.
                </p>
                <div className="bg-blue-50 rounded-lg p-4 max-w-md mx-auto">
                    <h4 className="font-medium text-blue-900 mb-2">How to create alerts:</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Search for campgrounds in the Search tab</li>
                        <li>• Click "Set Alert" on any campground card</li>
                        <li>• Choose your preferred dates and site type</li>
                        <li>• Get notified when sites become available!</li>
                    </ul>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Your Alerts</h2>
                <button
                    onClick={fetchAlerts}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                    🔄 Refresh
                </button>
            </div>

            <div className="grid gap-4">
                {alerts.map((alert) => (
                    <div
                        key={alert.id}
                        className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${alert.is_active ? 'border-green-500' : 'border-gray-300'
                            }`}
                    >
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        {alert.campground_name || 'Unknown Campground'}
                                    </h3>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${alert.is_active
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-gray-100 text-gray-800'
                                        }`}>
                                        {alert.is_active ? '🟢 Active' : '⚪ Inactive'}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                                    <div>
                                        <span className="font-medium">Check-in:</span>
                                        <br />
                                        {formatDate(alert.start_date)}
                                    </div>
                                    <div>
                                        <span className="font-medium">Check-out:</span>
                                        <br />
                                        {formatDate(alert.end_date)}
                                    </div>
                                    <div>
                                        <span className="font-medium">Site Type:</span>
                                        <br />
                                        {alert.site_type || 'Any'}
                                    </div>
                                    <div>
                                        <span className="font-medium">Party Size:</span>
                                        <br />
                                        {alert.party_size || 1} people
                                    </div>
                                </div>

                                {alert.notification_sent && (
                                    <div className="flex items-center text-sm text-green-600 mb-2">
                                        <span className="mr-1">✅</span>
                                        Last notification sent: {formatDate(alert.updated_at)}
                                    </div>
                                )}

                                <div className="text-xs text-gray-500">
                                    Created: {formatDate(alert.created_at)}
                                </div>
                            </div>

                            <div className="flex flex-col space-y-2 ml-4">
                                <button
                                    onClick={() => handleToggleAlert(alert.id, alert.is_active)}
                                    disabled={actionLoading[alert.id]}
                                    className={`px-3 py-1 text-xs font-medium rounded transition duration-150 ${alert.is_active
                                        ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                        : 'bg-green-100 text-green-800 hover:bg-green-200'
                                        } disabled:opacity-50`}
                                >
                                    {actionLoading[alert.id] ? '...' : (alert.is_active ? 'Pause' : 'Activate')}
                                </button>

                                <button
                                    onClick={() => handleDeleteAlert(alert.id)}
                                    disabled={actionLoading[alert.id]}
                                    className="px-3 py-1 text-xs font-medium rounded bg-red-100 text-red-800 hover:bg-red-200 transition duration-150 disabled:opacity-50"
                                >
                                    {actionLoading[alert.id] ? '...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">💡 How alerts work:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                    <li>• We check campsite availability every 15 minutes</li>
                    <li>• You'll receive an email when sites become available</li>
                    <li>• Alerts automatically pause after sending a notification</li>
                    <li>• Reactivate alerts if you need continued monitoring</li>
                </ul>
            </div>
        </div>
    );
};

export default AlertsList;