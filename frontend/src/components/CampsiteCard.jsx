














const CampsiteCard = ({ site, campgroundName }) => {
    return (
        <div className="bg-gray-50 p-3 rounded-lg border text-xs">
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <div className="font-medium text-gray-900">
                        {site.recreation_area || campgroundName}
                    </div>
                    <div className="text-gray-600">
                        {site.facility_name}
                    </div>
                    <div className="text-blue-600 font-medium">
                        Site: {site.campsite_site_name || site.campsite_id}
                    </div>
                    {site.campsite_loop_name && (
                        <div className="text-gray-600">
                            Loop: {site.campsite_loop_name}
                        </div>
                    )}
                </div>
                <div>
                    <div className="text-gray-900 font-medium">
                        {site.booking_date}
                    </div>
                    {site.booking_end_date && (
                        <div className="text-gray-600">
                            to {site.booking_end_date}
                        </div>
                    )}
                    <div className="text-gray-600">
                        {site.booking_nights} night{site.booking_nights !== 1 ? 's' : ''}
                    </div>
                    <div className="text-green-600 font-medium">
                        {site.availability_status}
                    </div>
                </div>
            </div>

            {/* Campsite Details */}
            <div className="mt-2 pt-2 border-t border-gray-200">
                <div className="flex flex-wrap gap-2 text-xs">
                    {site.campsite_type && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {site.campsite_type}
                        </span>
                    )}
                    {site.campsite_use_type && (
                        <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">
                            {site.campsite_use_type}
                        </span>
                    )}
                    {(site.campsite_occupancy_min !== null && site.campsite_occupancy_max !== null) && (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                            Occupancy: {site.campsite_occupancy_min}-{site.campsite_occupancy_max}
                        </span>
                    )}
                </div>

                {/* Permitted Equipment */}
                {site.permitted_equipment && site.permitted_equipment.length > 0 && (
                    <div className="mt-2">
                        <div className="text-gray-700 font-medium">Permitted Equipment:</div>
                        <div className="flex flex-wrap gap-1 mt-1">
                            {site.permitted_equipment.map((equipment, eqIndex) => (
                                <span key={eqIndex} className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                                    {equipment}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Recreation Area and Facility IDs */}
                {(site.recreation_area_id || site.facility_id) && (
                    <div className="mt-2 text-xs text-gray-500">
                        {site.recreation_area_id && (
                            <div>Recreation Area ID: {site.recreation_area_id}</div>
                        )}
                        {site.facility_id && (
                            <div>Facility ID: {site.facility_id}</div>
                        )}
                    </div>
                )}

                {/* Booking Link */}
                {site.booking_url && (
                    <div className="mt-2">
                        <a
                            href={site.booking_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline text-xs font-medium"
                        >
                            Book This Site →
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CampsiteCard;