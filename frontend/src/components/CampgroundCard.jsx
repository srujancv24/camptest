import axios from 'axios';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import CampsiteCard from './CampsiteCard.jsx';
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
    const [showAllSites, setShowAllSites] = useState(false);

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
            .then(res => {

                setAvailability(res.data);
            })
            .catch(err => {
                console.error('Availability error:', err);
                setAvailabilityError('Failed to fetch availability');
            })
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

        // If no city/state, try to use coordinates first, then extract from name
        if (parts.length === 0) {
            if (campground.latitude && campground.longitude) {
                return `${campground.latitude.toFixed(2)}°, ${campground.longitude.toFixed(2)}°`;
            }
            if (campground.name && campground.name.toLowerCase().includes('national')) {
                return 'National Park/Forest';
            }
            return 'Location not specified';
        }

        return parts.join(', ');
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-gray-100">
            {/* Header with enhanced styling */}
            <div className="flex justify-between items-start mb-6">
                <div className="flex-1">
                    <div className="mb-2">
                        <h3 className="text-xl font-bold text-gray-900">
                            {campground.name || 'Unnamed Campground'}
                        </h3>
                    </div>
                    <div className="flex items-center gap-1 text-gray-600 mb-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-medium">{getLocationString(campground)}</span>
                    </div>
                    {campground.latitude && campground.longitude && (
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                            {campground.latitude.toFixed(4)}, {campground.longitude.toFixed(4)}
                        </p>
                    )}
                </div>

                <div className="flex flex-col items-end gap-2">
                    {campground.recreation_gov_id && (
                        <span className="text-xs text-gray-500 font-mono">
                            ID: {campground.recreation_gov_id}
                        </span>
                    )}
                </div>
            </div>

            {/* Enhanced Description */}
            {campground.description && (
                <div className="mb-6">
                    <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500">
                        <p className="text-sm text-gray-700 leading-relaxed">
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

                                // Filter out generic/unhelpful text
                                if (cleanDescription.toLowerCase().includes('campground in unknown') ||
                                    cleanDescription.toLowerCase() === 'unknown' ||
                                    cleanDescription.length < 10) {
                                    return 'No description available.';
                                }

                                return cleanDescription.length > 250
                                    ? `${cleanDescription.substring(0, 250)}...`
                                    : cleanDescription;
                            })()}
                        </p>
                    </div>
                </div>
            )}



            {/* Enhanced Activities Section */}
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <h4 className="text-sm font-bold text-gray-900">Available Activities</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                    {campground.activities && campground.activities.length > 0 ? (
                        campground.activities.slice(0, 6).map((activity, index) => (
                            <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                {activity}
                            </span>
                        ))
                    ) : (
                        <span className="text-sm text-gray-500 italic">No activities listed</span>
                    )}
                    {campground.activities && campground.activities.length > 6 && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            +{campground.activities.length - 6} more
                        </span>
                    )}
                </div>
            </div>

            {/* Enhanced Availability Section */}
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    <h4 className="text-sm font-bold text-gray-900">Availability Status</h4>
                </div>

                {/* Show availability check button if no search params */}
                {(!searchParams?.start_date || !searchParams?.end_date) && (
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <div className="text-blue-800 font-medium mb-2">
                            Check Availability
                        </div>
                        <div className="text-sm text-blue-700 mb-3">
                            Search with dates to see detailed campsite availability and enhanced cards.
                        </div>
                        <div className="bg-blue-100 p-2 rounded text-xs text-blue-800">
                            💡 Tip: Use the search form above with check-in/check-out dates to see enhanced campsite cards with detailed information!
                        </div>
                    </div>
                )}

                {availabilityLoading && <div className="text-blue-600">Loading availability...</div>}
                {availabilityError && <div className="text-red-500">{availabilityError}</div>}
                {availability && availability.success && availability.total_sites_found > 0 && (
                    <div className="space-y-3">
                        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                            <div className="text-green-800 font-semibold mb-1">
                                ✅ {availability.total_sites_found} site{availability.total_sites_found !== 1 ? 's' : ''} available
                            </div>
                            <div className="text-sm text-green-700">
                                {availability.total_available_dates} date{availability.total_available_dates !== 1 ? 's' : ''} with availability
                            </div>
                        </div>

                        {/* Available Sites Details */}
                        {availability.available_sites && availability.available_sites.length > 0 && (
                            <div className="space-y-2">
                                <h5 className="text-sm font-medium text-gray-900">Available Campsites:</h5>
                                <div className="max-h-64 overflow-y-auto space-y-2">
                                    {(showAllSites ? availability.available_sites : availability.available_sites.slice(0, 3)).map((site, index) => (
                                        <CampsiteCard
                                            key={index}
                                            site={site}
                                            campgroundName={campground.name}
                                        />
                                    ))}
                                    {availability.available_sites.length > 3 && (
                                        <div className="text-center py-2">
                                            <button
                                                onClick={() => setShowAllSites(!showAllSites)}
                                                className="text-blue-600 hover:text-blue-800 underline text-sm font-medium"
                                            >
                                                {showAllSites
                                                    ? 'Show Less'
                                                    : `Show All ${availability.available_sites.length} Sites`
                                                }
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* General booking link */}
                        <div className="pt-2 border-t border-gray-200">
                            <a
                                href={campground.reservation_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-blue-600 hover:text-blue-800 underline text-sm font-medium"
                            >
                                View All Sites on Recreation.gov →
                            </a>
                        </div>
                    </div>
                )}
                {availability && availability.success && availability.total_sites_found === 0 && (
                    <div className="space-y-3">
                        <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                            <div className="text-orange-800 font-semibold mb-1">
                                ❌ No availability for selected dates
                            </div>
                            <div className="text-sm text-orange-700">
                                Try different dates or check back later for cancellations.
                            </div>
                        </div>

                        {campground.reservation_url && (
                            <div className="mt-2">
                                <a
                                    href={campground.reservation_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center text-orange-600 hover:text-orange-800 underline text-sm font-medium"
                                >
                                    Check Recreation.gov for updates →
                                </a>
                            </div>
                        )}
                    </div>
                )}

                {/* API error message */}
                {availability && !availability.success && (
                    <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                        <div className="text-red-800 font-semibold mb-1">
                            ⚠️ Unable to check availability
                        </div>
                        <div className="text-sm text-red-700">
                            There was an issue checking availability. Please try again later.
                        </div>
                        {campground.reservation_url && (
                            <div className="mt-2">
                                <a
                                    href={campground.reservation_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center text-red-600 hover:text-red-800 underline text-sm font-medium"
                                >
                                    Check Recreation.gov directly →
                                </a>
                            </div>
                        )}
                    </div>
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