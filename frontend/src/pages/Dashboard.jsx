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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50">
            {/* Navigation */}
            <nav className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        {/* Left spacer for centering on desktop */}
                        <div className="hidden md:flex flex-1"></div>

                        {/* Centered Logo/Title */}
                        <div className="flex items-center justify-center flex-1 md:flex-none">
                            <button
                                onClick={() => setActiveTab('search')}
                                className="flex items-center space-x-2 sm:space-x-3 text-white hover:text-emerald-100 transition-all duration-300 transform hover:scale-105 group"
                            >
                                <div className="text-2xl sm:text-3xl group-hover:animate-bounce">🏕️</div>
                                <h1 className="text-xl sm:text-2xl font-bold tracking-wide">CampScout</h1>
                            </button>
                        </div>

                        {/* Right side user info */}
                        <div className="flex-1 flex items-center justify-end space-x-2 sm:space-x-4">
                            {isAuthenticated ? (
                                <>
                                    <span className="hidden sm:inline text-xs sm:text-sm text-emerald-100 bg-white/10 px-2 sm:px-3 py-1 rounded-full backdrop-blur-sm">
                                        Welcome, {user?.first_name}! 👋
                                    </span>
                                    <button
                                        onClick={logout}
                                        className="text-xs sm:text-sm text-white hover:text-emerald-100 bg-white/10 hover:bg-white/20 px-3 sm:px-4 py-2 rounded-full transition-all duration-200 backdrop-blur-sm"
                                    >
                                        Logout
                                    </button>
                                </>
                            ) : (
                                <a
                                    href="/auth"
                                    className="bg-white text-emerald-600 px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-semibold hover:bg-emerald-50 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                                >
                                    <span className="hidden sm:inline">Login / Register</span>
                                    <span className="sm:hidden">Login</span>
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
                    <div className="bg-gradient-to-r from-white via-emerald-50 to-teal-50 rounded-2xl shadow-lg p-8 border border-emerald-100">
                        <div className={isAuthenticated ? "" : "flex flex-col items-center justify-center text-center"}>
                            <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-3">
                                {isAuthenticated
                                    ? `Welcome to your CampScout Dashboard! 🎉`
                                    : `Welcome to CampScout! 🏕️`
                                }
                            </h2>
                            <p className="text-gray-700 text-lg">
                                {isAuthenticated
                                    ? "Your campsite availability monitoring center"
                                    : (
                                        <>
                                            Discover and book the perfect campsite for your next outdoor adventure.<br />
                                            Search thousands of campsites across the United States.
                                        </>
                                    )
                                }
                            </p>
                        </div>
                        {!isAuthenticated && (
                            <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl shadow-sm">
                                <p className="text-blue-800 text-sm flex items-center space-x-2">
                                    <span className="text-xl">💡</span>
                                    <span><strong>Tip:</strong> Create an account to set up alerts and save your favorite campgrounds!</span>
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="mb-8">
                    <div className="bg-white rounded-xl shadow-md p-2">
                        <nav className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setActiveTab('search')}
                                className={`flex items-center space-x-2 px-4 sm:px-6 py-3 rounded-lg font-semibold text-xs sm:text-sm transition-all duration-200 transform hover:scale-105 ${activeTab === 'search'
                                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                                    : 'text-gray-600 hover:text-emerald-600 hover:bg-emerald-50'
                                    }`}
                            >
                                <span className="text-lg">🔍</span>
                                <span>Search Campgrounds</span>
                            </button>
                            {isAuthenticated && (
                                <button
                                    onClick={() => setActiveTab('alerts')}
                                    className={`flex items-center space-x-2 px-4 sm:px-6 py-3 rounded-lg font-semibold text-xs sm:text-sm transition-all duration-200 transform hover:scale-105 ${activeTab === 'alerts'
                                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
                                        : 'text-gray-600 hover:text-amber-600 hover:bg-amber-50'
                                        }`}
                                >
                                    <span className="text-lg">🔔</span>
                                    <span>My Alerts</span>
                                    {stats.watchedCampsites > 0 && (
                                        <span className="bg-white/20 text-xs px-2 py-1 rounded-full">
                                            {stats.watchedCampsites}
                                        </span>
                                    )}
                                </button>
                            )}
                            <button
                                onClick={() => setActiveTab('results')}
                                className={`flex items-center space-x-2 px-4 sm:px-6 py-3 rounded-lg font-semibold text-xs sm:text-sm transition-all duration-200 transform hover:scale-105 ${activeTab === 'results'
                                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg'
                                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                                    }`}
                            >
                                <span className="text-lg">📋</span>
                                <span>Search Results</span>
                                {searchResults.length > 0 && (
                                    <span className="bg-white/20 text-xs px-2 py-1 rounded-full">
                                        {searchResults.length}
                                    </span>
                                )}
                            </button>
                            {isAuthenticated && (
                                <button
                                    onClick={() => setActiveTab('profile')}
                                    className={`flex items-center space-x-2 px-4 sm:px-6 py-3 rounded-lg font-semibold text-xs sm:text-sm transition-all duration-200 transform hover:scale-105 ${activeTab === 'profile'
                                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                                        : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                                        }`}
                                >
                                    <span className="text-lg">👤</span>
                                    <span>Profile</span>
                                </button>
                            )}
                        </nav>
                    </div>
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
                                searchParams={lastSearchParams}
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
                            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-all duration-200">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                            <span className="text-2xl">🏕️</span>
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-emerald-100">Watched Campsites</p>
                                        <p className="text-3xl font-bold text-white">
                                            {statsLoading ? <Loading size="small" /> : stats.watchedCampsites}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-all duration-200">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                            <span className="text-2xl">🔔</span>
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-amber-100">Notifications Sent</p>
                                        <p className="text-3xl font-bold text-white">
                                            {statsLoading ? <Loading size="small" /> : stats.notificationsSent}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-all duration-200">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                            <span className="text-2xl">✅</span>
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-purple-100">Successful Bookings</p>
                                        <p className="text-3xl font-bold text-white">
                                            {statsLoading ? <Loading size="small" /> : stats.successfulBookings}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-all duration-200">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                            <span className="text-2xl">🏕️</span>
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-blue-100">Available Campgrounds</p>
                                        <p className="text-3xl font-bold text-white">418+</p>
                                        <p className="text-xs text-blue-200">California campgrounds</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-all duration-200">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                            <span className="text-2xl">🔍</span>
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-emerald-100">Real-Time Search</p>
                                        <p className="text-3xl font-bold text-white">Live</p>
                                        <p className="text-xs text-emerald-200">Recreation.gov data</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-all duration-200">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                            <span className="text-2xl">🎯</span>
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-rose-100">Success Rate</p>
                                        <p className="text-3xl font-bold text-white">80%</p>
                                        <p className="text-xs text-rose-200">Find availability</p>
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