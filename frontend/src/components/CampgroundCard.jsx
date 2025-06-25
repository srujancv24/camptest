import axios from 'axios';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from './Toast.jsx';

const CampgroundCard = ({ campground, showCreateAlert = true, searchParams }) => {
    const { getAuthToken } = useAuth();
    const { showSuccess, showError } = useToast();
    const [showAlertForm, setShowAlertForm] = useState(false);
    const [alertData, setAlertData] = useState({
        start_date: '',
        end_date: '',
        site_type: 'any',
        party_size: 1
    });
    const [alertLoading, setAlertLoading] = useState(false);
    // --- Availability State ---
    const [availability, setAvailability] = useState(null);
    const [availabilityLoading, setAvailabilityLoading] = useState(false);
    const [availabilityError, setAvailabilityError] = useState('');

    useEffect(() => {
        if (!campground.recreation_gov_id || !searchParams?.start_date || !searchParams?.end_date || !searchParams?.nights) return;
        setAvailabilityLoading(true);
        setAvailabilityError('');
        axios.get(`/api/campgrounds/${campground.recreation_gov_id}/availability`, {
            params: {
                start_date: searchParams.start_date,
                end_date: searchParams.end_date,
                nights: searchParams.nights
            }
        })
            .then(res => setAvailability(res.data))
            .catch(err => setAvailabilityError('Failed to fetch availability'))
            .finally(() => setAvailabilityLoading(false));
    }, [campground.recreation_gov_id, searchParams]);

    const handleCreateAlert = async (e) => {
        e.preventDefault();
        setAlertLoading(true);

        try {
            const response = await axios.post(
                `/api/campgrounds/${campground.recreation_gov_id || campground.id}/alerts`,
                alertData,
                {
                    headers: {
                        Authorization: `Bearer ${getAuthToken()}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.success) {
                showSuccess(`Alert created for ${campground.name}! You'll be notified when sites become available.`);
                setShowAlertForm(false);
                setAlertData({
                    start_date: '',
                    end_date: '',
                    site_type: 'any',
                    party_size: 1
                });
            }
        } catch (err) {
            console.error('Error creating alert:', err);
            showError(err.response?.data?.error || 'Failed to create alert');
        } finally {
            setAlertLoading(false);
        }
    };

    const handleAlertInputChange = (e) => {
        const { name, value } = e.target;
        setAlertData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const formatActivities = (activities) => {
        if (!activities || activities.length === 0) return 'No activities listed';
        return activities.slice(0, 3).join(', ') + (activities.length > 3 ? '...' : '');
    };

    const getLocationString = (campground) => {
        const parts = [];
        if (campground.city) parts.push(campground.city);
        if (campground.state) parts.push(campground.state);
        return parts.length > 0 ? parts.join(', ') : 'Location not specified';
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {campground.name || 'Unnamed Campground'}
                    </h3>
                    <p className="text-sm text-gray-600 mb-1">
                        📍 {getLocationString(campground)}
                    </p>
                    {campground.latitude && campground.longitude && (
                        <p className="text-xs text-gray-500">
                            Coordinates: {campground.latitude.toFixed(4)}, {campground.longitude.toFixed(4)}
                        </p>
                    )}
                </div>

                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {campground.state || 'Unknown State'}
                </span>
            </div>

            {/* Description */}
            {campground.description && (
                <div className="mb-4">
                    <p className="text-sm text-gray-700 line-clamp-3">
                        {(() => {
                            // Strip HTML tags and decode entities
                            const cleanDescription = campground.description
                                .replace(/<[^>]*>/g, ' ')
                                .replace(/&nbsp;/g, ' ')
                                .replace(/&amp;/g, '&')
                                .replace(/&lt;/g, '<')
                                .replace(/&gt;/g, '>')
                                .replace(/\s+/g, ' ')
                                .trim();
                            return cleanDescription.length > 200
                                ? `${cleanDescription.substring(0, 200)}...`
                                : cleanDescription;
                        })()}
                    </p>
                </div>
            )}

            {/* Facility Information */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl mb-1">
                        {campground.activities && campground.activities.length > 0 ? campground.activities.length : 'N/A'}
                    </div>
                    <div className="text-xs text-gray-600 font-medium">Activities</div>
                </div>

                <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl mb-1">
                        {campground.reservation_url ? '✅' : '❌'}
                    </div>
                    <div className="text-xs text-gray-600 font-medium">Reservable</div>
                </div>
            </div>

            {/* Activities */}
            <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">🎯 Activities</h4>
                <p className="text-sm text-gray-600">
                    {formatActivities(campground.activities)}
                </p>
            </div>

            {/* --- Availability Section --- */}
            <div className="mb-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">⏰ Availability</h4>
                {availabilityLoading && <div className="text-blue-600">Loading availability...</div>}
                {availabilityError && <div className="text-red-500">{availabilityError}</div>}
                {availability && availability.success && (
                    <div>
                        <div className="text-green-700 font-semibold">
                            {availability.total_sites_found} site{availability.total_sites_found !== 1 ? 's' : ''} available
                        </div>
                        <div className="text-sm text-gray-700">
                            Dates: {availability.available_dates && availability.available_dates.length > 0
                                ? availability.available_dates.slice(0, 3).join(', ') + (availability.available_dates.length > 3 ? '...' : '')
                                : 'None'}
                        </div>
                        <a
                            href={campground.reservation_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline text-sm"
                        >
                            Book on Recreation.gov
                        </a>
                    </div>
                )}
                {availability && !availability.success && (
                    <div className="text-gray-500">No availability for selected dates.</div>
                )}
            </div>

            {/* Contact Info */}
            {(campground.phone || campground.email) && (
                <div className="mb-4 space-y-1">
                    {campground.phone && (
                        <p className="text-sm text-gray-600">📞 {campground.phone}</p>
                    )}
                    {campground.email && (
                        <p className="text-sm text-gray-600">📧 {campground.email}</p>
                    )}
                </div>
            )}

            {/* Alert Form */}
            {showAlertForm && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Create Availability Alert</h4>

                    <form onSubmit={handleCreateAlert} className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Check-in Date
                                </label>
                                <input
                                    type="date"
                                    name="start_date"
                                    value={alertData.start_date}
                                    onChange={handleAlertInputChange}
                                    required
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Check-out Date
                                </label>
                                <input
                                    type="date"
                                    name="end_date"
                                    value={alertData.end_date}
                                    onChange={handleAlertInputChange}
                                    required
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Site Type
                                </label>
                                <select
                                    name="site_type"
                                    value={alertData.site_type}
                                    onChange={handleAlertInputChange}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="any">Any</option>
                                    <option value="tent">Tent</option>
                                    <option value="rv">RV</option>
                                    <option value="cabin">Cabin</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Party Size
                                </label>
                                <input
                                    type="number"
                                    name="party_size"
                                    min="1"
                                    max="20"
                                    value={alertData.party_size}
                                    onChange={handleAlertInputChange}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div className="flex space-x-2">
                            <button
                                type="submit"
                                disabled={alertLoading}
                                className="flex-1 bg-green-600 text-white py-2 px-3 text-sm font-medium rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 transition duration-150"
                            >
                                {alertLoading ? 'Creating...' : 'Create Alert'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowAlertForm(false)}
                                className="px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50 transition duration-150"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Availability */}
            {availabilityLoading && <p className="text-sm text-gray-500">Checking availability...</p>}
            {availabilityError && <p className="text-sm text-red-500">{availabilityError}</p>}
            {availability && (
                <div className="mb-4 p-4 bg-green-50 rounded-lg">
                    <h4 className="text-sm font-medium text-green-800 mb-2">Availability</h4>
                    <p className="text-sm text-green-700">
                        {availability.available ? 'Sites are available!' : 'No sites available for the selected dates.'}
                    </p>
                </div>
            )}

            {/* Actions */}
            <div className="flex space-x-3">
                {campground.reservation_url && (
                    <a
                        href={campground.reservation_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-blue-600 text-white text-center py-2 px-4 text-sm font-medium rounded hover:bg-blue-700 transition duration-150"
                    >
                        View on Recreation.gov
                    </a>
                )}
                {showCreateAlert && (
                    <button
                        onClick={() => setShowAlertForm(!showAlertForm)}
                        className="px-4 py-2 border border-green-600 text-green-600 hover:bg-green-50 text-sm font-medium rounded transition duration-150"
                    >
                        {showAlertForm ? 'Cancel Alert' : '🔔 Set Alert'}
                    </button>
                )}
            </div>
        </div>
    );
};

export default CampgroundCard;