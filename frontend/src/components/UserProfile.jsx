import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from './Toast.jsx';

const UserProfile = () => {
    const { user, logout } = useAuth();
    const { showSuccess, showError } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        notification_preferences: {
            email: user?.notification_preferences?.email ?? true,
            sms: user?.notification_preferences?.sms ?? false,
            push: user?.notification_preferences?.push ?? true
        }
    });
    const [loading, setLoading] = useState(false);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name.startsWith('notification_')) {
            const prefType = name.replace('notification_', '');
            setFormData(prev => ({
                ...prev,
                notification_preferences: {
                    ...prev.notification_preferences,
                    [prefType]: checked
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // This would typically make an API call to update user profile
            // For now, we'll just simulate success
            await new Promise(resolve => setTimeout(resolve, 1000));

            showSuccess('Profile updated successfully!');
            setIsEditing(false);
        } catch (error) {
            showError('Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setFormData({
            first_name: user?.first_name || '',
            last_name: user?.last_name || '',
            email: user?.email || '',
            phone: user?.phone || '',
            notification_preferences: {
                email: user?.notification_preferences?.email ?? true,
                sms: user?.notification_preferences?.sms ?? false,
                push: user?.notification_preferences?.push ?? true
            }
        });
        setIsEditing(false);
    };

    const handleLogout = () => {
        if (window.confirm('Are you sure you want to log out?')) {
            logout();
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Profile Header */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                            {user?.first_name?.[0]}{user?.last_name?.[0]}
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">
                                {user?.first_name} {user?.last_name}
                            </h2>
                            <p className="text-gray-600">{user?.email}</p>
                        </div>
                    </div>

                    {!isEditing && (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition duration-150"
                        >
                            Edit Profile
                        </button>
                    )}
                </div>

                {isEditing ? (
                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    First Name
                                </label>
                                <input
                                    type="text"
                                    name="first_name"
                                    value={formData.first_name}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Last Name
                                </label>
                                <input
                                    type="text"
                                    name="last_name"
                                    value={formData.last_name}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email Address
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Phone Number (Optional)
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                placeholder="(555) 123-4567"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="flex space-x-3">
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition duration-150"
                            >
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition duration-150"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="font-medium text-gray-700">First Name:</span>
                                <p className="text-gray-900">{user?.first_name || 'Not set'}</p>
                            </div>
                            <div>
                                <span className="font-medium text-gray-700">Last Name:</span>
                                <p className="text-gray-900">{user?.last_name || 'Not set'}</p>
                            </div>
                        </div>
                        <div className="text-sm">
                            <span className="font-medium text-gray-700">Email:</span>
                            <p className="text-gray-900">{user?.email}</p>
                        </div>
                        <div className="text-sm">
                            <span className="font-medium text-gray-700">Phone:</span>
                            <p className="text-gray-900">{user?.phone || 'Not set'}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Notification Preferences */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h3>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-medium text-gray-900">Email Notifications</h4>
                            <p className="text-sm text-gray-600">Receive campsite availability alerts via email</p>
                        </div>
                        <input
                            type="checkbox"
                            name="notification_email"
                            checked={formData.notification_preferences.email}
                            onChange={handleInputChange}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-medium text-gray-900">SMS Notifications</h4>
                            <p className="text-sm text-gray-600">Receive text messages for urgent alerts</p>
                        </div>
                        <input
                            type="checkbox"
                            name="notification_sms"
                            checked={formData.notification_preferences.sms}
                            onChange={handleInputChange}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-medium text-gray-900">Push Notifications</h4>
                            <p className="text-sm text-gray-600">Receive browser push notifications</p>
                        </div>
                        <input
                            type="checkbox"
                            name="notification_push"
                            checked={formData.notification_preferences.push}
                            onChange={handleInputChange}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                    </div>
                </div>
            </div>

            {/* Account Actions */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Actions</h3>

                <div className="space-y-3">
                    <button
                        onClick={handleLogout}
                        className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition duration-150"
                    >
                        Sign Out
                    </button>

                    <button
                        className="w-full border border-red-600 text-red-600 py-2 px-4 rounded-md hover:bg-red-50 transition duration-150"
                    >
                        Delete Account
                    </button>
                </div>
            </div>

            {/* Account Stats */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Statistics</h3>

                <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">0</div>
                        <div className="text-sm text-gray-600">Active Alerts</div>
                    </div>

                    <div className="p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">0</div>
                        <div className="text-sm text-gray-600">Notifications Sent</div>
                    </div>

                    <div className="p-3 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">0</div>
                        <div className="text-sm text-gray-600">Successful Bookings</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfile;