import { useEffect, useState } from 'react';
import AlertsList from '../components/AlertsList.jsx';
import CampgroundSearch from '../components/CampgroundSearch.jsx';
import Loading from '../components/Loading.jsx';
import SearchResults from '../components/SearchResults.jsx';
import { useToast } from '../components/Toast.jsx';
import UserProfile from '../components/UserProfile.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';

const Dashboard = () => {
    const { user, logout, getAuthToken, isAuthenticated } = useAuth();
    const { showSuccess, showError } = useToast();
    const [activeTab, setActiveTab] = useState('search');
    const [searchResults, setSearchResults] = useState(() => {
        // Load search results from localStorage on initialization
        const savedResults = localStorage.getItem('campscout_search_results');
        return savedResults ? JSON.parse(savedResults) : [];
    });
    const [totalCount, setTotalCount] = useState(() => {
        // Load total count from localStorage on initialization
        const savedCount = localStorage.getItem('campscout_search_total_count');
        return savedCount ? parseInt(savedCount, 10) : 0;
    });
    const [searchLoading, setSearchLoading] = useState(false);
    const [offset, setOffset] = useState(0);
    const [statsLoading, setStatsLoading] = useState(false);
    const [stats, setStats] = useState({
        watchedCampsites: 0,
        notificationsSent: 0,
        successfulBookings: 0
    });
    const [lastSearchParams, setLastSearchParams] = useState(() => {
        // Load last search parameters from localStorage
        const savedParams = localStorage.getItem('campscout_last_search_params');
        return savedParams ? JSON.parse(savedParams) : null;
    });

    // Fetch user stats
    useEffect(() => {
        fetchUserStats();
    }, []);

    const fetchUserStats = async () => {
        try {
            setStatsLoading(true);
            // For now, we'll use mock data since the backend alerts endpoint might not be implemented yet
            setStats({
                watchedCampsites: 0,
                notificationsSent: 0,
                successfulBookings: 0
            });
        } catch (err) {
            console.error('Error fetching stats:', err);
            showError('Failed to load dashboard statistics');
        } finally {
            setStatsLoading(false);
        }
    };

    const handleSearchResults = (results, total, searchParams = null) => {
        setSearchResults(results);
        setTotalCount(total);
        setOffset(results.length);
        setActiveTab('results');

        // Save search results and parameters to localStorage for persistence
        localStorage.setItem('campscout_search_results', JSON.stringify(results));
        localStorage.setItem('campscout_search_total_count', total.toString());

        if (searchParams) {
            setLastSearchParams(searchParams);
            localStorage.setItem('campscout_last_search_params', JSON.stringify(searchParams));
        }

        showSuccess(`Found ${total} campground${total !== 1 ? 's' : ''} matching your search!`);
    };

    const clearSearchResults = () => {
        setSearchResults([]);
        setTotalCount(0);
        setLastSearchParams(null);
        localStorage.removeItem('campscout_search_results');
        localStorage.removeItem('campscout_search_total_count');
        localStorage.removeItem('campscout_last_search_params');
        showSuccess('Search results cleared');
    };

    const handleLoadMore = async () => {
        // This would implement pagination for search results
        setSearchLoading(true);
        // Add pagination logic here
        setSearchLoading(false);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation */}
            <nav className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <h1 className="text-xl font-bold text-gray-900">🏕️ CampScout</h1>
                        </div>

                        <div className="flex items-center space-x-4">
                            {isAuthenticated ? (
                                <>
                                    <span className="text-sm text-gray-700">
                                        Welcome, {user?.first_name}!
                                    </span>
                                    <button
                                        onClick={logout}
                                        className="text-sm text-gray-500 hover:text-gray-700 transition duration-150"
                                    >
                                        Logout
                                    </button>
                                </>
                            ) : (
                                <a
                                    href="/auth"
                                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition duration-150"
                                >
                                    Login / Register
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome Section */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {isAuthenticated
                            ? `Welcome to your CampScout Dashboard! 🎉`
                            : `Welcome to CampScout! 🏕️`
                        }
                    </h2>
                    <p className="text-gray-600">
                        {isAuthenticated
                            ? "Your campsite availability monitoring center"
                            : "Find and monitor campsite availability across recreational areas"
                        }
                    </p>
                    {!isAuthenticated && (
                        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-blue-800 text-sm">
                                💡 <strong>Tip:</strong> Create an account to set up alerts and save your favorite campgrounds!
                            </p>
                        </div>
                    )}
                </div>

                {/* Tab Navigation */}
                <div className="border-b border-gray-200 mb-8">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            onClick={() => setActiveTab('search')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'search'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            🔍 Search Campgrounds
                        </button>
                        {isAuthenticated && (
                            <button
                                onClick={() => setActiveTab('alerts')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'alerts'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                🔔 My Alerts ({stats.watchedCampsites})
                            </button>
                        )}
                        <button
                            onClick={() => setActiveTab('results')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'results'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            📋 Search Results {searchResults.length > 0 ? `(${searchResults.length})` : ''}
                        </button>
                        {isAuthenticated && (
                            <button
                                onClick={() => setActiveTab('profile')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'profile'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                👤 Profile
                            </button>
                        )}
                    </nav>
                </div>

                {/* Tab Content */}
                <div className="mb-8">
                    {activeTab === 'search' && (
                        <div>
                            <CampgroundSearch onSearchResults={handleSearchResults} />

                            {searchResults.length === 0 && (
                                <div className="mt-8 bg-white rounded-lg shadow-md p-8">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-6">🚀 Get Started</h3>

                                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                                            <h4 className="font-medium text-blue-900 mb-2">1. Search Campgrounds</h4>
                                            <p className="text-sm text-blue-800">
                                                Use the search form above to find campgrounds by state, activity, and dates.
                                            </p>
                                        </div>

                                        <div className="text-center p-4 bg-green-50 rounded-lg">
                                            <h4 className="font-medium text-green-900 mb-2">2. Set Up Alerts</h4>
                                            <p className="text-sm text-green-800">
                                                Create availability alerts for fully booked campgrounds to get notified when sites open up.
                                            </p>
                                        </div>

                                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                                            <h4 className="font-medium text-purple-900 mb-2">3. Get Notifications</h4>
                                            <p className="text-sm text-purple-800">
                                                Receive instant alerts via email when your watched campsites become available.
                                            </p>
                                        </div>

                                        <div className="text-center p-4 bg-orange-50 rounded-lg">
                                            <h4 className="font-medium text-orange-900 mb-2">4. Book Your Site</h4>
                                            <p className="text-sm text-orange-800">
                                                Click through to Recreation.gov to complete your reservation.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'alerts' && isAuthenticated && (
                        <AlertsList />
                    )}

                    {activeTab === 'alerts' && !isAuthenticated && (
                        <div className="bg-white rounded-lg shadow-md p-8 text-center">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">🔔 Alerts Feature</h3>
                            <p className="text-gray-600 mb-6">
                                Create an account to set up availability alerts for your favorite campgrounds!
                            </p>
                            <a
                                href="/auth"
                                className="bg-blue-600 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-700 transition duration-150"
                            >
                                Sign Up Now
                            </a>
                        </div>
                    )}

                    {activeTab === 'results' && (
                        <div>
                            {searchResults.length > 0 && (
                                <div className="mb-6 bg-white rounded-lg shadow-md p-4">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">Search Results</h3>
                                            {lastSearchParams && (
                                                <p className="text-sm text-gray-600 mt-1">
                                                    Last search: {lastSearchParams.location || 'All locations'}
                                                    {lastSearchParams.start_date && lastSearchParams.end_date && (
                                                        <span> • {lastSearchParams.start_date} to {lastSearchParams.end_date}</span>
                                                    )}
                                                    {lastSearchParams.nights && (
                                                        <span> • {lastSearchParams.nights} night{lastSearchParams.nights !== 1 ? 's' : ''}</span>
                                                    )}
                                                </p>
                                            )}
                                        </div>
                                        <button
                                            onClick={clearSearchResults}
                                            className="text-sm text-red-600 hover:text-red-800 font-medium"
                                        >
                                            Clear Results
                                        </button>
                                    </div>
                                </div>
                            )}
                            <SearchResults
                                results={searchResults}
                                totalCount={totalCount}
                                loading={searchLoading}
                                onLoadMore={handleLoadMore}
                                hasMore={searchResults.length < totalCount}
                            />
                        </div>
                    )}

                    {activeTab === 'profile' && isAuthenticated && (
                        <UserProfile />
                    )}

                    {activeTab === 'profile' && !isAuthenticated && (
                        <div className="bg-white rounded-lg shadow-md p-8 text-center">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">👤 User Profile</h3>
                            <p className="text-gray-600 mb-6">
                                Sign in to manage your profile and preferences!
                            </p>
                            <a
                                href="/auth"
                                className="bg-blue-600 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-700 transition duration-150"
                            >
                                Sign In
                            </a>
                        </div>
                    )}
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {isAuthenticated ? (
                        <>
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                            <span className="text-white text-sm">🏕️</span>
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-500">Watched Campsites</p>
                                        <p className="text-2xl font-semibold text-gray-900">
                                            {statsLoading ? <Loading size="small" /> : stats.watchedCampsites}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow-md p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                            <span className="text-white text-sm">🔔</span>
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-500">Notifications Sent</p>
                                        <p className="text-2xl font-semibold text-gray-900">
                                            {statsLoading ? <Loading size="small" /> : stats.notificationsSent}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow-md p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                                            <span className="text-white text-sm">✅</span>
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-500">Successful Bookings</p>
                                        <p className="text-2xl font-semibold text-gray-900">
                                            {statsLoading ? <Loading size="small" /> : stats.successfulBookings}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                            <span className="text-white text-sm">🏕️</span>
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-500">Available Campgrounds</p>
                                        <p className="text-2xl font-semibold text-gray-900">418+</p>
                                        <p className="text-xs text-gray-400">California campgrounds</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow-md p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                            <span className="text-white text-sm">🔍</span>
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-500">Real-Time Search</p>
                                        <p className="text-2xl font-semibold text-gray-900">Live</p>
                                        <p className="text-xs text-gray-400">Recreation.gov data</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow-md p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                                            <span className="text-white text-sm">🎯</span>
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-500">Success Rate</p>
                                        <p className="text-2xl font-semibold text-gray-900">80%</p>
                                        <p className="text-xs text-gray-400">Find availability</p>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;