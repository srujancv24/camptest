import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';

const CampgroundSearch = ({ onSearchResults }) => {
    const { getAuthToken } = useAuth();
    const [searchParams, setSearchParams] = useState({
        location: '',
        activity: '',
        start_date: '',
        end_date: '',
        nights: 1,
        weekend_only: false,
        limit: 20,
        site_type: '',
        party_size: 1,
        accessibility: false,
        recreation_area_type: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [locationSuggestions, setLocationSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [locationInput, setLocationInput] = useState('');
    const locationInputRef = useRef(null);
    const [availabilityLoading, setAvailabilityLoading] = useState(false);
    const [dateInfo, setDateInfo] = useState({
        weekendCount: 0,
        totalDays: 0,
        dateRange: ''
    });

    // State name to abbreviation mapping
    const stateAbbreviations = {
        'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
        'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
        'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
        'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
        'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS', 'Missouri': 'MO',
        'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
        'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
        'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
        'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT',
        'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY'
    };

    // National Parks to state mapping (for location-based searches)
    const nationalParksToState = {
        'Yellowstone National Park': 'WY',
        'Yosemite National Park': 'CA',
        'Grand Canyon National Park': 'AZ',
        'Zion National Park': 'UT',
        'Great Smoky Mountains National Park': 'TN',
        'Rocky Mountain National Park': 'CO',
        'Acadia National Park': 'ME',
        'Olympic National Park': 'WA',
        'Glacier National Park': 'MT',
        'Joshua Tree National Park': 'CA',
        'Bryce Canyon National Park': 'UT',
        'Arches National Park': 'UT',
        'Canyonlands National Park': 'UT',
        'Capitol Reef National Park': 'UT',
        'Death Valley National Park': 'CA',
        'Sequoia National Park': 'CA',
        'Kings Canyon National Park': 'CA',
        'Mammoth Cave National Park': 'KY',
        'Hot Springs National Park': 'AR',
        'Everglades National Park': 'FL',
        'Biscayne National Park': 'FL',
        'Dry Tortugas National Park': 'FL',
        'Shenandoah National Park': 'VA',
        'Great Sand Dunes National Park': 'CO',
        'Mesa Verde National Park': 'CO',
        'Black Canyon of the Gunnison National Park': 'CO',
        'Crater Lake National Park': 'OR',
        'Mount Rainier National Park': 'WA',
        'North Cascades National Park': 'WA',
        'Badlands National Park': 'SD',
        'Wind Cave National Park': 'SD',
        'Theodore Roosevelt National Park': 'ND',
        'Voyageurs National Park': 'MN',
        'Isle Royale National Park': 'MI',
        'Indiana Dunes National Park': 'IN',
        'Cuyahoga Valley National Park': 'OH',
        'New River Gorge National Park': 'WV',
        'Congaree National Park': 'SC',
        'Pinnacles National Park': 'CA',
        'Channel Islands National Park': 'CA',
        'Redwood National Park': 'CA',
        'Lassen Volcanic National Park': 'CA',
        'Carlsbad Caverns National Park': 'NM',
        'Guadalupe Mountains National Park': 'TX',
        'Big Bend National Park': 'TX',
        'Petrified Forest National Park': 'AZ',
        'Saguaro National Park': 'AZ',
        'Grand Teton National Park': 'WY',
        'Denali National Park': 'AK',
        'Kenai Fjords National Park': 'AK',
        'Katmai National Park': 'AK',
        'Lake Clark National Park': 'AK',
        'Gates of the Arctic National Park': 'AK',
        'Kobuk Valley National Park': 'AK',
        'Wrangell-St. Elias National Park': 'AK',
        'Glacier Bay National Park': 'AK',
        'Haleakala National Park': 'HI',
        'Hawaii Volcanoes National Park': 'HI',
        'American Samoa National Park': 'AS',
        'Virgin Islands National Park': 'VI'
    };

    // Recreation areas to state mapping
    const recreationAreasToState = {
        'Lake Tahoe': 'CA',
        'Lake Powell': 'UT',
        'Lake Mead': 'NV',
        'Shasta Lake': 'CA',
        'Lake George': 'NY',
        'Finger Lakes': 'NY',
        'Adirondack Park': 'NY',
        'Catskill Mountains': 'NY',
        'White Mountain National Forest': 'NH',
        'Green Mountain National Forest': 'VT',
        'Allegheny National Forest': 'PA',
        'Monongahela National Forest': 'WV',
        'George Washington National Forest': 'VA',
        'Jefferson National Forest': 'VA',
        'Pisgah National Forest': 'NC',
        'Nantahala National Forest': 'NC',
        'Cherokee National Forest': 'TN',
        'Daniel Boone National Forest': 'KY',
        'Wayne National Forest': 'OH',
        'Hoosier National Forest': 'IN',
        'Shawnee National Forest': 'IL',
        'Mark Twain National Forest': 'MO',
        'Ouachita National Forest': 'AR',
        'Ozark National Forest': 'AR',
        'Superior National Forest': 'MN',
        'Chippewa National Forest': 'MN',
        'Ottawa National Forest': 'MI',
        'Hiawatha National Forest': 'MI',
        'Black Hills National Forest': 'SD',
        'Pike National Forest': 'CO',
        'San Isabel National Forest': 'CO',
        'Routt National Forest': 'CO',
        'White River National Forest': 'CO',
        'Arapaho National Forest': 'CO',
        'Roosevelt National Forest': 'CO',
        'Ashley National Forest': 'UT',
        'Dixie National Forest': 'UT',
        'Fishlake National Forest': 'UT',
        'Manti-La Sal National Forest': 'UT',
        'Uinta National Forest': 'UT',
        'Wasatch National Forest': 'UT',
        'Sawtooth National Forest': 'ID',
        'Boise National Forest': 'ID',
        'Payette National Forest': 'ID',
        'Nez Perce National Forest': 'ID',
        'Idaho Panhandle National Forest': 'ID',
        'Kootenai National Forest': 'MT',
        'Lolo National Forest': 'MT',
        'Bitterroot National Forest': 'MT',
        'Deerlodge National Forest': 'MT',
        'Helena National Forest': 'MT',
        'Lewis and Clark National Forest': 'MT',
        'Gallatin National Forest': 'MT',
        'Custer National Forest': 'MT'
    };

    // Comprehensive list of locations including states, national parks, and recreation areas
    const locations = [
        // States
        'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
        'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
        'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
        'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico',
        'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
        'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
        'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming',

        // National Parks
        'Yellowstone National Park', 'Yosemite National Park', 'Grand Canyon National Park',
        'Zion National Park', 'Great Smoky Mountains National Park', 'Rocky Mountain National Park',
        'Acadia National Park', 'Olympic National Park', 'Glacier National Park', 'Joshua Tree National Park',
        'Bryce Canyon National Park', 'Arches National Park', 'Canyonlands National Park',
        'Capitol Reef National Park', 'Death Valley National Park', 'Sequoia National Park',
        'Kings Canyon National Park', 'Mammoth Cave National Park', 'Hot Springs National Park',
        'Everglades National Park', 'Biscayne National Park', 'Dry Tortugas National Park',
        'Shenandoah National Park', 'Great Sand Dunes National Park', 'Mesa Verde National Park',
        'Black Canyon of the Gunnison National Park', 'Crater Lake National Park', 'Mount Rainier National Park',
        'North Cascades National Park', 'Badlands National Park', 'Wind Cave National Park',
        'Theodore Roosevelt National Park', 'Voyageurs National Park', 'Isle Royale National Park',
        'Indiana Dunes National Park', 'Cuyahoga Valley National Park', 'New River Gorge National Park',
        'Congaree National Park', 'Pinnacles National Park', 'Channel Islands National Park',
        'Redwood National Park', 'Lassen Volcanic National Park', 'Carlsbad Caverns National Park',
        'Guadalupe Mountains National Park', 'Big Bend National Park', 'Petrified Forest National Park',
        'Saguaro National Park', 'Grand Teton National Park', 'Denali National Park',
        'Kenai Fjords National Park', 'Katmai National Park', 'Lake Clark National Park',
        'Gates of the Arctic National Park', 'Kobuk Valley National Park', 'Wrangell-St. Elias National Park',
        'Glacier Bay National Park', 'Haleakala National Park', 'Hawaii Volcanoes National Park',
        'American Samoa National Park', 'Virgin Islands National Park',

        // Popular Recreation Areas and Forests
        'Lake Tahoe', 'Lake Powell', 'Lake Mead', 'Shasta Lake', 'Lake George', 'Finger Lakes',
        'Adirondack Park', 'Catskill Mountains', 'White Mountain National Forest', 'Green Mountain National Forest',
        'Allegheny National Forest', 'Monongahela National Forest', 'George Washington National Forest',
        'Jefferson National Forest', 'Pisgah National Forest', 'Nantahala National Forest',
        'Cherokee National Forest', 'Daniel Boone National Forest', 'Wayne National Forest',
        'Hoosier National Forest', 'Shawnee National Forest', 'Mark Twain National Forest',
        'Ouachita National Forest', 'Ozark National Forest'
    ];

    // Handle location input with autocomplete
    const handleLocationInputChange = (e) => {
        const value = e.target.value;
        setLocationInput(value);
        setSearchParams(prev => ({
            ...prev,
            location: value
        }));

        if (value.length > 0) {
            const filtered = locations.filter(location =>
                location.toLowerCase().includes(value.toLowerCase())
            ).slice(0, 10); // Limit to 10 suggestions
            setLocationSuggestions(filtered);
            setShowSuggestions(true);
        } else {
            setLocationSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const handleSuggestionClick = (suggestion) => {
        setLocationInput(suggestion);
        setSearchParams(prev => ({
            ...prev,
            location: suggestion
        }));
        setShowSuggestions(false);
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSearchParams(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Count weekends in date range
    const countWeekends = (startDate, endDate) => {
        if (!startDate || !endDate) return 0;

        const start = new Date(startDate);
        const end = new Date(endDate);
        let weekendCount = 0;

        for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
            const dayOfWeek = d.getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday = 0, Saturday = 6
                weekendCount++;
            }
        }

        return weekendCount;
    };

    // Get day of week name
    const getDayName = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { weekday: 'long' });
    };

    // Format date range display
    const formatDateRange = (startDate, endDate) => {
        if (!startDate || !endDate) return '';

        const start = new Date(startDate);
        const end = new Date(endDate);

        const startFormatted = start.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            weekday: 'short'
        });

        const endFormatted = end.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            weekday: 'short'
        });

        return `${startFormatted} → ${endFormatted}`;
    };

    // Calculate total days between dates
    const calculateTotalDays = (startDate, endDate) => {
        if (!startDate || !endDate) return 0;
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    // Update nights when start or end date changes
    useEffect(() => {
        if (searchParams.start_date && searchParams.end_date && searchParams.nights) {
            const weekendCount = countWeekends(searchParams.start_date, searchParams.end_date);
            const totalDays = calculateTotalDays(searchParams.start_date, searchParams.end_date);
            const dateRange = formatDateRange(searchParams.start_date, searchParams.end_date);
            setDateInfo({
                weekendCount,
                totalDays,
                dateRange
            });
        } else {
            setDateInfo({
                weekendCount: 0,
                totalDays: 0,
                dateRange: ''
            });
        }
    }, [searchParams.start_date, searchParams.end_date, searchParams.nights]);

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (locationInputRef.current && !locationInputRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const queryParams = new URLSearchParams();

            // Add all search parameters
            Object.entries(searchParams).forEach(([key, value]) => {
                if (value && value.toString().trim()) {
                    queryParams.append(key, value);
                }
            });

            console.log('Search query params:', queryParams.toString());

            const response = await axios.post('/api/search', searchParams, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.success) {
                handleSearchResults(response.data.data, response.data.total_count || response.data.data.length);
            } else {
                setError('Failed to search campgrounds');
            }
        } catch (err) {
            console.error('Search error:', err);
            setError(err.response?.data?.error || 'Failed to search campgrounds');
        } finally {
            setLoading(false);
        }
    };

    // Attach searchParams to results in CampgroundSearch so SearchResults and CampgroundCard can use them for availability fetching
    const handleSearchResults = (results, total) => {
        results.searchParams = {
            start_date: searchParams.start_date,
            end_date: searchParams.end_date,
            nights: searchParams.nights
        };
        onSearchResults(results, total);
    };

    // Live availability check for specific campground
    const checkLiveAvailability = async (campgroundId) => {
        if (!searchParams.start_date || !searchParams.end_date) {
            return null;
        }

        try {
            setAvailabilityLoading(true);
            const response = await axios.get(`/api/campgrounds/${campgroundId}/availability`, {
                params: {
                    start_date: searchParams.start_date,
                    end_date: searchParams.end_date,
                    nights: searchParams.nights
                }
            });

            return response.data;
        } catch (error) {
            console.error('Availability check error:', error);
            return null;
        } finally {
            setAvailabilityLoading(false);
        }
    };

    const resetSearch = () => {
        setSearchParams({
            location: '',
            activity: '',
            start_date: '',
            end_date: '',
            nights: 1,
            weekend_only: false,
            limit: 20,
            site_type: '',
            party_size: 1,
            accessibility: false,
            recreation_area_type: ''
        });
        setLocationInput('');
        setLocationSuggestions([]);
        setShowSuggestions(false);
        setError('');
        setDateInfo({
            weekendCount: 0,
            totalDays: 0,
            dateRange: ''
        });
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">🔍 Advanced Campground Search</h2>
            </div>

            <form onSubmit={handleSearch} className="space-y-6">
                {/* Enhanced Location Search with Autocomplete */}
                <div className="relative" ref={locationInputRef}>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                        🌍 Location (State, National Park, or Recreation Area)
                    </label>
                    <input
                        type="text"
                        id="location"
                        value={locationInput}
                        onChange={handleLocationInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                        placeholder="e.g., California, Yosemite, Lake Tahoe, Yellowstone"
                    />
                    {showSuggestions && locationSuggestions.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                            {locationSuggestions.map((suggestion, index) => (
                                <div
                                    key={index}
                                    onClick={() => handleSuggestionClick(suggestion)}
                                    className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-100 last:border-b-0 flex items-center"
                                >
                                    <span className="mr-2">
                                        {suggestion.includes('National Park') ? '🏞️' :
                                            suggestion.includes('National Forest') ? '🌲' :
                                                suggestion.includes('Lake') ? '🏔️' : '📍'}
                                    </span>
                                    {suggestion}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Enhanced Activity Selection - only camping selectable, others disabled */}
                <div>
                    <label htmlFor="activity" className="block text-sm font-medium text-gray-700 mb-1">
                        🎯 Primary Activity
                    </label>
                    <select
                        id="activity"
                        name="activity"
                        value={searchParams.activity}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="camping">🏕️ Camping</option>
                        <option value="hiking" disabled>🥾 Hiking (disabled)</option>
                        <option value="fishing" disabled>🎣 Fishing (disabled)</option>
                        <option value="boating" disabled>⛵ Boating (disabled)</option>
                        <option value="swimming" disabled>🏊 Swimming (disabled)</option>
                        <option value="wildlife viewing" disabled>🦌 Wildlife Viewing (disabled)</option>
                        <option value="photography" disabled>📸 Photography (disabled)</option>
                        <option value="biking" disabled>🚴 Biking (disabled)</option>
                        <option value="rock climbing" disabled>🧗 Rock Climbing (disabled)</option>
                        <option value="kayaking" disabled>🛶 Kayaking (disabled)</option>
                        <option value="stargazing" disabled>⭐ Stargazing (disabled)</option>
                        <option value="winter sports" disabled>⛷️ Winter Sports (disabled)</option>
                    </select>
                </div>

                {/* Enhanced Date Selection with Live Feedback */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h3 className="text-lg font-medium text-blue-900 mb-3">📅 Date Range & Duration</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        {/* Start Date */}
                        <div>
                            <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
                                Check-in Date
                            </label>
                            <input
                                type="date"
                                id="start_date"
                                name="start_date"
                                value={searchParams.start_date}
                                onChange={handleInputChange}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            {searchParams.start_date && (
                                <p className="text-xs text-gray-600 mt-1">
                                    {getDayName(searchParams.start_date)} arrival
                                </p>
                            )}
                        </div>
                        {/* End Date */}
                        <div>
                            <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">
                                Check-out Date
                            </label>
                            <input
                                type="date"
                                id="end_date"
                                name="end_date"
                                value={searchParams.end_date}
                                onChange={handleInputChange}
                                min={searchParams.start_date || new Date().toISOString().split('T')[0]}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            {searchParams.end_date && (
                                <p className="text-xs text-gray-600 mt-1">
                                    {getDayName(searchParams.end_date)} checkout
                                </p>
                            )}
                        </div>
                        {/* Number of Nights */}
                        <div>
                            <label htmlFor="nights" className="block text-sm font-medium text-gray-700 mb-1">
                                🌙 Number of Nights
                            </label>
                            <input
                                type="number"
                                id="nights"
                                name="nights"
                                min="1"
                                value={searchParams.nights}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <p className="text-xs text-gray-600 mt-1">
                                (Specify how many nights you want to stay within the selected date range)
                            </p>
                        </div>
                    </div>
                    {/* Live Date Range Feedback */}
                    {dateInfo.dateRange && (
                        <div className="bg-white p-3 rounded-md border border-blue-300 mt-2">
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center space-x-4">
                                    <span className="font-medium text-blue-900">
                                        📅 {dateInfo.dateRange}
                                    </span>
                                    <span className="text-gray-600">
                                        ({dateInfo.totalDays} {dateInfo.totalDays === 1 ? 'day' : 'days'})
                                    </span>
                                </div>
                                {dateInfo.weekendCount > 0 && (
                                    <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
                                        🎉 {dateInfo.weekendCount} weekend {dateInfo.weekendCount === 1 ? 'day' : 'days'}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Advanced Search Options */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">🎯 Advanced Options</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {/* Site Type */}
                        <div>
                            <label htmlFor="site_type" className="block text-sm font-medium text-gray-700 mb-1">
                                🏕️ Site Type
                            </label>
                            <select
                                id="site_type"
                                name="site_type"
                                value={searchParams.site_type}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">Any Site Type</option>
                                <option value="tent">⛺ Tent Sites</option>
                                <option value="rv">🚐 RV Sites</option>
                                <option value="cabin">🏠 Cabins</option>
                                <option value="group">👥 Group Sites</option>
                                <option value="backcountry">🥾 Backcountry</option>
                                <option value="equestrian">🐎 Equestrian</option>
                            </select>
                        </div>

                        {/* Party Size */}
                        <div>
                            <label htmlFor="party_size" className="block text-sm font-medium text-gray-700 mb-1">
                                👥 Party Size
                            </label>
                            <select
                                id="party_size"
                                name="party_size"
                                value={searchParams.party_size}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="1">1 person</option>
                                <option value="2">2 people</option>
                                <option value="3">3 people</option>
                                <option value="4">4 people</option>
                                <option value="5">5 people</option>
                                <option value="6">6 people</option>
                                <option value="8">8+ people</option>
                                <option value="10">10+ people (Group)</option>
                            </select>
                        </div>
                    </div>

                    {/* Checkboxes for special options */}
                    <div className="space-y-3">
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="weekend_only"
                                name="weekend_only"
                                checked={searchParams.weekend_only}
                                onChange={handleInputChange}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="weekend_only" className="ml-2 block text-sm text-gray-900">
                                🎉 Weekends Only (Friday-Sunday arrivals)
                            </label>
                        </div>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="accessibility"
                                name="accessibility"
                                checked={searchParams.accessibility}
                                onChange={handleInputChange}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="accessibility" className="ml-2 block text-sm text-gray-900">
                                ♿ Accessible Sites Only
                            </label>
                        </div>
                    </div>
                </div>

                {/* Enhanced Search Controls */}
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex flex-col space-y-3">
                        {/* Main Search Button */}
                        <button
                            type="submit"
                            disabled={loading || availabilityLoading}
                            className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 text-lg font-medium"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                                    🔍 Searching Campgrounds...
                                </span>
                            ) : availabilityLoading ? (
                                <span className="flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                                    📅 Checking Live Availability...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center">
                                    🔍 Search Campgrounds with Live Availability
                                </span>
                            )}
                        </button>

                        {/* Secondary Actions */}
                        <div className="flex space-x-3">
                            <button
                                type="button"
                                onClick={resetSearch}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150"
                            >
                                🔄 Reset Search
                            </button>

                            {searchParams.start_date && searchParams.end_date && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        // Quick weekend search
                                        const nextFriday = new Date();
                                        nextFriday.setDate(nextFriday.getDate() + (5 - nextFriday.getDay() + 7) % 7);
                                        setSearchParams(prev => ({
                                            ...prev,
                                            start_date: nextFriday.toISOString().split('T')[0],
                                            nights: 2,
                                            weekend_only: true
                                        }));
                                    }}
                                    className="flex-1 px-4 py-2 bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition duration-150"
                                >
                                    🎉 Next Weekend
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Search Tips */}
                    <div className="mt-3 text-xs text-green-700 bg-green-100 p-2 rounded">
                        💡 <strong>Pro Tips:</strong> Use specific locations for better results • Check multiple date ranges • Consider weekdays for better availability
                    </div>
                </div>

                {error && (
                    <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
                        {error}
                    </div>
                )}
            </form>
        </div>
    );
};

export default CampgroundSearch;