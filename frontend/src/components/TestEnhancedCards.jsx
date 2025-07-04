import { useState } from 'react';
import CampsiteCard from './CampsiteCard.jsx';

const TestEnhancedCards = () => {
    const [showAllSites, setShowAllSites] = useState(false);

    // Mock data to demonstrate the enhanced cards
    const mockAvailability = {
        success: true,
        total_sites_found: 3,
        total_available_dates: 2,
        available_sites: [
            {
                campsite_id: '96141',
                campsite_site_name: 'A012',
                campsite_loop_name: 'A Loop',
                campsite_type: 'RV NONELECTRIC',
                campsite_use_type: 'Overnight',
                booking_date: '2025-09-12',
                booking_end_date: '2025-09-14',
                booking_nights: 2,
                booking_url: 'https://www.recreation.gov/camping/campsites/96141',
                recreation_area: 'Mt. Hood National Forest, OR',
                recreation_area_id: '1106',
                facility_name: 'Lost Lake Resort And Campground',
                facility_id: '251434',
                availability_status: 'Available',
                permitted_equipment: ['RV', 'Tent', 'Trailer'],
                campsite_occupancy_min: 0,
                campsite_occupancy_max: 3
            },
            {
                campsite_id: '96142',
                campsite_site_name: 'B015',
                campsite_loop_name: 'B Loop',
                campsite_type: 'TENT ONLY NONELECTRIC',
                campsite_use_type: 'Overnight',
                booking_date: '2025-09-12',
                booking_end_date: '2025-09-14',
                booking_nights: 2,
                booking_url: 'https://www.recreation.gov/camping/campsites/96142',
                recreation_area: 'Mt. Hood National Forest, OR',
                recreation_area_id: '1106',
                facility_name: 'Lost Lake Resort And Campground',
                facility_id: '251434',
                availability_status: 'Available',
                permitted_equipment: ['Tent'],
                campsite_occupancy_min: 1,
                campsite_occupancy_max: 6
            },
            {
                campsite_id: '96143',
                campsite_site_name: 'C008',
                campsite_loop_name: 'C Loop',
                campsite_type: 'RV ELECTRIC',
                campsite_use_type: 'Overnight',
                booking_date: '2025-09-13',
                booking_end_date: '2025-09-15',
                booking_nights: 2,
                booking_url: 'https://www.recreation.gov/camping/campsites/96143',
                recreation_area: 'Mt. Hood National Forest, OR',
                recreation_area_id: '1106',
                facility_name: 'Lost Lake Resort And Campground',
                facility_id: '251434',
                availability_status: 'Available',
                permitted_equipment: ['RV', 'Trailer'],
                campsite_occupancy_min: 1,
                campsite_occupancy_max: 4
            }
        ]
    };

    const mockCampground = {
        name: 'Lost Lake Resort And Campground',
        reservation_url: 'https://www.recreation.gov'
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Enhanced Campsite Cards Test</h1>

            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {mockCampground.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-1">
                            📍 Mt. Hood National Forest, OR
                        </p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Oregon
                    </span>
                </div>

                {/* Enhanced Availability Section */}
                <div className="mb-4">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">⏰ Availability</h4>
                    <div className="space-y-3">
                        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                            <div className="text-green-800 font-semibold mb-1">
                                {mockAvailability.total_sites_found} site{mockAvailability.total_sites_found !== 1 ? 's' : ''} available
                            </div>
                            <div className="text-sm text-green-700">
                                {mockAvailability.total_available_dates} date{mockAvailability.total_available_dates !== 1 ? 's' : ''} with availability
                            </div>
                        </div>

                        {/* Available Sites Details */}
                        <div className="space-y-2">
                            <h5 className="text-sm font-medium text-gray-900">Available Campsites:</h5>
                            <div className="max-h-64 overflow-y-auto space-y-2">
                                {(showAllSites ? mockAvailability.available_sites : mockAvailability.available_sites.slice(0, 3)).map((site, index) => (
                                    <CampsiteCard
                                        key={index}
                                        site={site}
                                        campgroundName={mockCampground.name}
                                    />
                                ))}
                                {mockAvailability.available_sites.length > 3 && (
                                    <div className="text-center py-2">
                                        <button
                                            onClick={() => setShowAllSites(!showAllSites)}
                                            className="text-blue-600 hover:text-blue-800 underline text-sm font-medium"
                                        >
                                            {showAllSites
                                                ? 'Show Less'
                                                : `Show All ${mockAvailability.available_sites.length} Sites`
                                            }
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* General booking link */}
                        <div className="pt-2 border-t border-gray-200">
                            <a
                                href={mockCampground.reservation_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-blue-600 hover:text-blue-800 underline text-sm font-medium"
                            >
                                View All Sites on Recreation.gov →
                            </a>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-3">
                    <a
                        href="https://www.recreation.gov"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-blue-600 text-white text-center py-2 px-4 text-sm font-medium rounded hover:bg-blue-700 transition duration-150"
                    >
                        View on Recreation.gov
                    </a>
                    <button className="px-4 py-2 border border-green-600 text-green-600 hover:bg-green-50 text-sm font-medium rounded transition duration-150">
                        🔔 Set Alert
                    </button>
                </div>
            </div>

            <div className="mt-8 p-6 bg-blue-50 rounded-lg">
                <h2 className="text-xl font-semibold text-blue-900 mb-4">What You're Seeing</h2>
                <p className="text-blue-800 mb-4">
                    This is exactly how the enhanced campsite cards will appear when users search for campgrounds and check availability.
                    The cards now show:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                        <h3 className="font-medium text-blue-800 mb-2">Detailed Site Information:</h3>
                        <ul className="space-y-1 text-blue-700">
                            <li>• Recreation Area & Facility Names</li>
                            <li>• Specific Site Names & Loop Information</li>
                            <li>• Campsite Type (RV, Tent, etc.)</li>
                            <li>• Occupancy Limits</li>
                            <li>• Use Type (Overnight, Day Use)</li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-medium text-blue-800 mb-2">Enhanced Functionality:</h3>
                        <ul className="space-y-1 text-blue-700">
                            <li>• Permitted Equipment Lists</li>
                            <li>• Direct Site Booking Links</li>
                            <li>• Recreation Area & Facility IDs</li>
                            <li>• Expandable Site Lists</li>
                            <li>• Availability Status Indicators</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TestEnhancedCards;